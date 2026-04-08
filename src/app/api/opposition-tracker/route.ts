/**
 * POST /api/opposition-tracker
 * Auto-monitors opposition party statements and generates fact-check rebuttals.
 *
 * Step 1: Gemini + Google Search → find latest opposition claims/statements
 * Step 2: Claude (or Gemini fallback) → write fact-check rebuttal articles
 * Step 3: Save each fact-check to Firestore `posts` collection
 *
 * Streams NDJSON progress.
 */

import { NextRequest } from "next/server";
import { createDoc, generateSlug, getStockImageUrl } from "@/lib/firestore-rest";

export const maxDuration = 300;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();

const OPPOSITION_PARTIES = ["Congress", "AAP", "TMC", "JDU", "SP", "DMK"];

const FACT_CHECK_SYSTEM_PROMPT = `You are a senior political analyst for LoktantraVani. Your job is to fact-check opposition claims with DATA and FACTS. Always present the BJP/NDA counter-narrative with statistics, government data, and achievements. Be factual, data-driven, and confident — NOT aggressive or hateful. Use official sources: PIB, data.gov.in, Ministry reports, RBI data.`;

// ── Gemini: Google Search grounding for real-time facts ──
async function geminiSearch(prompt: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    }),
  });
  const data = await res.json();
  const candidates = data.candidates as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
  return candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
}

// ── AI Writer: Claude (best quality) or Gemini (free, fast) ──
async function writeArticle(systemPrompt: string, userPrompt: string, maxTokens = 4000): Promise<string> {
  const anthropicKey = ANTHROPIC_KEY();
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        if (text) return text;
      }
    } catch { /* Claude failed, fall through to Gemini */ }
  }

  // Fallback: Use Gemini for writing
  const key = GEMINI_KEY();
  if (!key) throw new Error("No AI API key available");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens > 4000 ? 8000 : 4000 },
    }),
  });
  const data = await res.json();
  const candidates = data.candidates as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
  return candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
}

function parseJSON(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch { /* */ }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) try { return { items: JSON.parse(arr[0]) }; } catch { /* */ }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { party } = body as { party?: string };

  const parties = party
    ? [party]
    : OPPOSITION_PARTIES;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      send({ type: "start", parties, message: "Starting opposition statement tracker..." });

      let totalGenerated = 0;
      let totalErrors = 0;

      for (const partyName of parties) {
        // ════════════════════════════════════════════════════
        // STEP 1: Gemini + Google Search → find opposition claims
        // ════════════════════════════════════════════════════
        send({
          type: "searching",
          party: partyName,
          message: `Searching for latest ${partyName} statements and claims...`,
        });

        interface ClaimBrief {
          claim: string;
          context: string;
          speaker: string;
          date: string;
        }

        let claims: ClaimBrief[] = [];

        try {
          const searchPrompt = `Search for the LATEST statements, claims, and allegations made by ${partyName} party leaders against the BJP/NDA government in the last 7 days.

Look for:
- Press conferences, tweets, interviews by ${partyName} leaders
- Claims about economy, unemployment, inflation, corruption
- Allegations against BJP or PM Modi
- Policy criticisms
- Electoral promises and claims

Find 3-5 specific, verifiable CLAIMS that can be fact-checked.

Return ONLY a JSON array:
[
  {
    "claim": "The exact claim or statement made",
    "context": "Where/when it was said, background details",
    "speaker": "Name of the leader who made the claim",
    "date": "Approximate date"
  }
]`;

          const searchResult = await geminiSearch(searchPrompt);
          const parsed = parseJSON(searchResult);

          if (parsed) {
            const items = (parsed.items as ClaimBrief[]) ||
              (Array.isArray(parsed) ? parsed as unknown as ClaimBrief[] : []);
            claims = items.slice(0, 5);
          }

          if (claims.length === 0) {
            send({
              type: "no_claims",
              party: partyName,
              message: `No recent verifiable claims found for ${partyName}. Skipping.`,
            });
            continue;
          }

          send({
            type: "claims_found",
            party: partyName,
            count: claims.length,
            claims: claims.map(c => c.claim),
          });
        } catch (err) {
          send({ type: "search_error", party: partyName, message: String(err) });
          totalErrors++;
          continue;
        }

        // ════════════════════════════════════════════════════
        // STEP 2: Fact-check each claim with Claude/Gemini
        // ════════════════════════════════════════════════════
        for (let i = 0; i < claims.length; i++) {
          const claim = claims[i];

          send({
            type: "fact_checking",
            party: partyName,
            claimIndex: i + 1,
            totalClaims: claims.length,
            claim: claim.claim,
            speaker: claim.speaker,
            message: `Fact-checking claim ${i + 1}/${claims.length}: "${claim.claim.slice(0, 80)}..."`,
          });

          try {
            // First, get additional data via Gemini Search for the rebuttal
            let additionalFacts = "";
            try {
              const dataSearchPrompt = `Search for official government data, PIB releases, RBI reports, Ministry statistics that COUNTER this opposition claim:

Claim by ${partyName} (${claim.speaker}): "${claim.claim}"

Find:
1. Official government statistics that contradict this claim
2. BJP/NDA government achievements relevant to this topic
3. Historical comparison (UPA era vs NDA era data)
4. International rankings or recognition India has received

Provide specific numbers, dates, and source URLs.`;

              additionalFacts = await geminiSearch(dataSearchPrompt);
            } catch {
              additionalFacts = "No additional search data available.";
            }

            // Write the fact-check article
            const writePrompt = `Write a comprehensive FACT-CHECK article about this opposition claim.

OPPOSITION CLAIM:
Party: ${partyName}
Speaker: ${claim.speaker}
Date: ${claim.date}
Claim: "${claim.claim}"
Context: ${claim.context}

RESEARCH DATA (from Google Search):
${additionalFacts.slice(0, 3000)}

Write the article in this JSON format:
{
  "headline": "Fact-Check: [catchy headline exposing the claim]",
  "summary": "2-3 sentence summary of the fact-check verdict",
  "content": "Full HTML article with these sections:
    <h2>The Claim</h2> - What was said, by whom, when
    <h2>The Facts</h2> - Data and statistics that counter the claim
    <h2>Government Record</h2> - BJP/NDA achievements on this topic
    <h2>The Verdict</h2> - Clear fact-check conclusion
    Use <div class='fact-box'> for key statistics.
    Use <blockquote> for direct quotes.
    Use <div class='info-box'> for source citations.",
  "verdict": "one of: FALSE | MISLEADING | HALF-TRUTH | OUT OF CONTEXT | CHERRY-PICKED",
  "tags": ["array", "of", "relevant", "tags"]
}

Requirements:
- Minimum 800 words
- At least 5 specific statistics or data points
- Compare UPA vs NDA numbers where relevant
- Cite official sources (PIB, data.gov.in, RBI, Ministry reports)
- Professional, factual tone — no name-calling
- HTML content with proper formatting`;

            const rawArticle = await writeArticle(FACT_CHECK_SYSTEM_PROMPT, writePrompt, 4000);
            const articleData = parseJSON(rawArticle);

            if (!articleData || !articleData.headline) {
              send({ type: "parse_error", party: partyName, claim: claim.claim, message: "Failed to parse article JSON" });
              totalErrors++;
              continue;
            }

            // ════════════════════════════════════════════════════
            // STEP 3: Save to Firestore
            // ════════════════════════════════════════════════════
            const headline = articleData.headline as string;
            const imageUrl = getStockImageUrl(headline);

            const tags = Array.isArray(articleData.tags)
              ? (articleData.tags as string[])
              : ["opposition-tracker", "fact-check", partyName.toLowerCase()];

            const savedId = await createDoc("posts", {
              title: headline,
              titleHi: "",
              slug: generateSlug(headline),
              summary: (articleData.summary as string) || "",
              summaryHi: "",
              content: (articleData.content as string) || "",
              contentHi: "",
              category: "Opposition Tracker",
              section: "Main Feed",
              author: "LoktantraVani Fact-Check Desk",
              authorRole: "agent",
              imageUrl,
              language: "en",
              status: "draft",
              tags: [...tags, "opposition-tracker", "fact-check", partyName.toLowerCase().replace(/\s+/g, "-")],
              readingTimeMin: 4,
              viewCount: 0,
              reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
              isBreaking: false,
              source: `AI Fact-Check | ${partyName} | ${claim.speaker}`,
              verdict: (articleData.verdict as string) || "UNVERIFIED",
              oppositionParty: partyName,
              oppositionSpeaker: claim.speaker,
              originalClaim: claim.claim,
            });

            totalGenerated++;

            send({
              type: "article_saved",
              party: partyName,
              claimIndex: i + 1,
              postId: savedId,
              headline,
              verdict: articleData.verdict,
              message: `Fact-check saved: "${headline}" [${articleData.verdict}]`,
            });
          } catch (err) {
            totalErrors++;
            send({
              type: "error",
              party: partyName,
              claim: claim.claim,
              message: `Error fact-checking claim: ${String(err).slice(0, 200)}`,
            });
          }
        }
      }

      send({
        type: "done",
        totalGenerated,
        totalErrors,
        message: `Opposition tracker complete. ${totalGenerated} fact-checks generated, ${totalErrors} errors.`,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
