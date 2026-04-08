/**
 * POST /api/bulk-generate
 * Generate multiple articles across sections in one call.
 * Streams progress back via newline-delimited JSON (NDJSON).
 *
 * Body: {
 *   sections: string[] — categories to generate for
 *   count: number — articles per section (1-5)
 *   wordCount: number — 500 | 1500 | 2000 | 2500
 *   language: string — "en" | "hi" | "bilingual"
 *   tone: string
 *   author: string
 * }
 */

import { NextRequest } from "next/server";
import { createDoc, generateSlug, getStockImageUrl } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 300; // 5 min for bulk

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

async function gemini(prompt: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 6000 },
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
  return null;
}

// RSS-based topic hints per section
const SECTION_TOPICS: Record<string, string[]> = {
  India: ["India G20 presidency impact 2026", "Indian Railways modernization", "India population dividend workforce", "Digital India rural transformation", "India climate change policy COP"],
  World: ["Global AI regulation debate", "NATO expansion tensions", "Africa economic growth 2026", "UN reform proposals", "South America political shifts"],
  Politics: ["India Parliament budget session 2026", "State elections results analysis", "Opposition alliance strategy", "Governance reforms digital India", "Political dynasty debate India"],
  Geopolitics: ["India-China LAC standoff update", "BRICS expansion impact", "Indo-Pacific strategy Quad", "India-Russia defense ties", "Middle East realignment 2026"],
  Economy: ["India GDP growth forecast 2026", "UPI global expansion", "Startup India unicorn boom", "Inflation food prices India", "India manufacturing PLI scheme"],
  Sports: ["IPL 2026 season preview", "India Olympic preparation 2028", "Indian football ISL growth", "Badminton India world ranking", "India women cricket revolution"],
  Tech: ["India semiconductor fab progress", "AI adoption Indian enterprises", "5G rollout India coverage", "Indian space program ISRO 2026", "EV adoption India charging infra"],
  Defence: ["India Tejas Mark 2 fighter", "Indian Navy aircraft carrier", "Border infrastructure India", "India missile defense system", "Defence export India growth"],
  Opinion: ["India demographic dividend or disaster", "Social media regulation needed", "Climate justice developing nations", "Education reform India NEP", "Federalism India center-state"],
  Cities: ["Delhi Metro Phase 5 progress", "Mumbai coastal road impact", "Bangalore traffic tech solutions", "Kolkata smart city transformation", "Patna infrastructure development"],
  "West Asia": ["Iran nuclear deal status 2026", "Saudi Vision 2030 progress", "Yemen conflict resolution", "India-Gulf economic corridor", "Oil prices geopolitical impact"],
  "Lok Post": ["Budget reactions common man", "Social media addiction youth", "Election promises vs reality", "Cricket fever India", "AI replacing jobs debate"],
};

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  const body = await req.json();
  const {
    sections = ["India", "Politics", "Economy"],
    count = 2,
    wordCount = 1500,
    language = "en",
    tone = "neutral",
    author = "LoktantraVani AI",
  } = body as {
    sections?: string[];
    count?: number;
    wordCount?: number;
    language?: string;
    tone?: string;
    author?: string;
  };

  const articlesPerSection = Math.min(Math.max(count, 1), 5);

  const langInstructions: Record<string, string> = {
    en: "Write ENTIRELY in English. No Hindi. No Devanagari.",
    hi: "Write ENTIRELY in Hindi Devanagari. No English.",
    bilingual: "Headline in both Hindi & English. Body in English.",
  };

  const toneMap: Record<string, string> = {
    neutral: "Balanced fact-based analysis.",
    nationalist: "Champion India's civilizational greatness.",
    analytical: "Expert deep-dive with data.",
    "pro-bjp": "Pro-BJP/NDA editorial voice.",
  };

  // Stream NDJSON progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      const totalArticles = sections.length * articlesPerSection;
      let completed = 0;
      let errors = 0;

      send({ type: "start", totalArticles, sections, articlesPerSection });

      for (const section of sections) {
        const topics = SECTION_TOPICS[section] || [`Latest news about ${section} in India March 2026`];

        for (let i = 0; i < articlesPerSection; i++) {
          const topic = topics[i % topics.length];
          const isCartoon = section === "Lok Post";

          send({
            type: "progress",
            section,
            articleIndex: i + 1,
            topic,
            completed,
            totalArticles,
            pct: Math.round((completed / totalArticles) * 100),
          });

          try {
            const prompt = isCartoon
              ? `You are a legendary Indian newspaper cartoonist. Create a cartoon concept for "${topic}".
Return ONLY valid JSON: {"headline":"witty caption max 8 words","headlineHi":"Hindi caption","summary":"2 sentence description","content":"<p>Editorial context.</p>","imagePrompt":"cartoon scene description"}`
              : `You are ${author}, writing for "LoktantraVani" — India's digital newspaper.
BYLINE: ${author}
LANGUAGE: ${langInstructions[language] || langInstructions.en}
SECTION: ${section}
TONE: ${toneMap[tone] || toneMap.neutral}
LENGTH: ${wordCount} words
TOPIC: "${topic}"

Write a compelling professional newspaper article. Use real facts, current March 2026 context.
Do NOT write any byline like "By [Your Name]" inside the content. No placeholder text.
Do NOT hallucinate expert names or quotes. Use "analysts say" instead of invented names.
${language === "en" ? "IMPORTANT: Write ONLY in English. Zero Hindi." : ""}

Return ONLY valid JSON:
{"headline":"CLICKBAIT viral headline — curiosity-gap, power words (Shocking, Exclusive, Breaking, Historic, Exposed, Game-Changer). Max 12 words","headlineHi":"${language === "en" ? "" : "Hindi headline"}","summary":"2-3 sentence summary","content":"full HTML article with <h2> <p> <blockquote>. ${wordCount}+ words. NO byline in content. NO placeholder text.","imagePrompt":"editorial illustration description"}`;

            const raw = await gemini(prompt);
            const parsed = parseJSON(raw);

            if (!parsed) {
              errors++;
              send({ type: "error", section, topic, message: "Failed to parse AI response" });
              completed++;
              continue;
            }

            // Save to Firestore
            const savedId = await createDoc("posts", {
              title: (parsed.headline as string) || topic,
              titleHi: (parsed.headlineHi as string) || "",
              slug: generateSlug((parsed.headline as string) || topic),
              summary: (parsed.summary as string) || "",
              summaryHi: "",
              content: (parsed.content as string) || "",
              contentHi: "",
              category: section,
              section: "Main Feed",
              author,
              authorRole: "agent",
              imageUrl: getStockImageUrl(section, (parsed.headline as string) || topic),
              status: "draft",
              tags: [section.toLowerCase().replace(/\s+/g, "-"), "ai-generated", "bulk"],
              readingTimeMin: Math.ceil(wordCount / 200),
              viewCount: 0,
              reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
            });

            completed++;
            send({
              type: "done",
              section,
              topic,
              headline: parsed.headline,
              savedId,
              completed,
              totalArticles,
              pct: Math.round((completed / totalArticles) * 100),
            });
          } catch (err) {
            errors++;
            completed++;
            send({ type: "error", section, topic, message: String(err), completed, totalArticles });
          }
        }
      }

      send({ type: "complete", completed, errors, totalArticles });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
