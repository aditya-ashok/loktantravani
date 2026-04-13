/**
 * POST /api/agent-generate
 * Deep Research AI Agent: Gemini (Google Search) → Claude (research + write) → Gemini (images)
 *
 * Step 1: Gemini + Google Search → find TODAY's trending topics with real facts
 * Step 2: Claude → deep research analysis + write professional article
 * Step 3: Gemini Imagen → generate thumbnail (background)
 * Step 4: Save to Firestore
 *
 * Streams NDJSON progress.
 */

import { NextRequest } from "next/server";
import { createDoc, generateSlug, getStockImageUrl, setDoc, queryByField } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 300;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();

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
async function writeArticle(systemPrompt: string, userPrompt: string, maxTokens = 4000, enginePref = "auto"): Promise<string> {
  // Try Claude first if engine is "auto" or "claude"
  const anthropicKey = ANTHROPIC_KEY();
  if (anthropicKey && enginePref !== "gemini") {
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

// ── Gemini Imagen: Generate + upload thumbnail ──
async function generateAndUploadImage(prompt: string, postId: string): Promise<void> {
  const key = GEMINI_KEY();
  if (!key) return;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt + " Bold editorial caricature, satirical cartoon style, exaggerated features, vibrant colors. No text." }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      }),
    });
    const data = await res.json();
    const preds = data.predictions as Array<{ bytesBase64Encoded: string }> | undefined;
    if (!preds?.[0]?.bytesBase64Encoded) return;

    const buffer = Buffer.from(preds[0].bytesBase64Encoded, "base64");
    const filename = `articles/${postId}.png`;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: new Uint8Array(buffer),
    });
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(uploadData.name)}?alt=media&token=${uploadData.downloadTokens || ""}`;
      await setDoc(`posts/${postId}`, { imageUrl: downloadUrl });
    }
  } catch { /* keep stock image */ }
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

// Section-specific search queries — pro-India, right-of-centre sources + PIB
const SECTION_SEARCH: Record<string, string> = {
  India: "India breaking news today latest pib.gov.in BJP Modi government achievement swarajyamag.com opindia.com",
  World: "world news today India global influence G20 BRICS SCO PM Modi diplomacy reuters.com",
  Politics: "Indian politics news today BJP NDA Modi government opposition Congress AAP propaganda pib.gov.in swarajyamag.com",
  Geopolitics: "geopolitics India China US relations India foreign policy victory mea.gov.in defence deals",
  Economy: "Indian economy news today GDP growth record FDI UPI Make in India pib.gov.in economictimes.com",
  Sports: "India sports news today cricket IPL Olympic medal espncricinfo.com",
  Tech: "India technology news today AI startups ISRO Digital India semiconductor UPI",
  Defence: "India defence news today military indigenisation Make in India HAL DRDO pib.gov.in",
  Opinion: "India editorial opinion column today economy policy governance BJP reform development analysis swarajyamag.com firstpost.com",
  Cities: "Indian cities news today smart city infrastructure metro highway airport development Modi government",
  "West Asia": "West Asia Middle East news today Iran Israel India impact oil crude",
  "Lok Post": "India trending satirical topics today opposition gaffe political cartoon BJP Congress",
};

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  const body = await req.json();
  const {
    sections = ["India", "Politics", "Economy", "Geopolitics", "Sports", "Tech", "Defence", "Opinion", "West Asia", "World"],
    articlesPerSection = 5,
    wordCount = 1500,
    language = "en",
    author = "LoktantraVani AI",
    engine = "auto",
    autoPublish = false,
  } = body;

  const perSection = Math.min(Math.max(articlesPerSection, 1), 5);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      const totalArticles = sections.length * perSection;
      let completed = 0;
      let errors = 0;

      send({ type: "start", totalArticles, sections });

      for (const section of sections) {
        // ════════════════════════════════════════════════════
        // STEP 1: Gemini + Google Search → find trending topics
        // ════════════════════════════════════════════════════
        send({ type: "searching", section, message: `🔍 Gemini searching trending ${section} news...` });

        let researchBriefs: { topic: string; facts: string; sources: string }[] = [];
        try {
          const searchPrompt = `You are a news research assistant. Search for the LATEST trending news about: ${SECTION_SEARCH[section] || section + " news today"}

Check these sources:
- PIB (pib.gov.in) for official government releases
- Major news outlets for breaking stories
- Recent developments in the last 24-48 hours

Find ${perSection + 2} IMPORTANT stories happening RIGHT NOW.

For EACH story, provide:
1. The specific topic/headline
2. KEY FACTS: exact numbers, dates, names, locations, statistics
3. SOURCE: which publication reported this

Return ONLY a JSON array:
[
  {"topic": "specific headline", "facts": "detailed facts with numbers, dates, names — at least 5 factual points", "sources": "PIB, Reuters, NDTV etc"},
  ...
]`;

          const searchResult = await geminiSearch(searchPrompt);
          const parsed = parseJSON(searchResult);

          if (parsed) {
            const items = (parsed.items as Array<{ topic: string; facts: string; sources: string }>) ||
                         (Array.isArray(parsed) ? parsed as unknown as Array<{ topic: string; facts: string; sources: string }> : []);
            researchBriefs = items.slice(0, perSection);
          }

          if (researchBriefs.length === 0) {
            researchBriefs = [{ topic: `Latest ${section} developments in India`, facts: "General overview needed", sources: "Various" }];
          }

          send({
            type: "topics_found", section,
            count: researchBriefs.length,
            topics: researchBriefs.map(r => r.topic),
          });
        } catch (err) {
          send({ type: "search_error", section, message: String(err) });
          researchBriefs = [{ topic: `Latest ${section} news`, facts: "", sources: "" }];
        }

        // ════════════════════════════════════════════════════
        // STEP 2: Claude → Deep research + write article
        // ════════════════════════════════════════════════════
        for (let i = 0; i < researchBriefs.length; i++) {
          const brief = researchBriefs[i];

          send({
            type: "generating", section,
            articleIndex: i + 1,
            topic: brief.topic,
            completed, totalArticles,
            pct: Math.round((completed / totalArticles) * 100),
            engine: "Claude",
          });

          try {
            const isOpinion = section === "Opinion";
            const systemPrompt = `You are a senior journalist at LoktantraVani, India's premier right-of-centre digital newspaper. You write in the style of The New York Times — authoritative, well-structured, deeply researched — but with a clear pro-India, nationalist editorial lens.

EDITORIAL STANCE:
- You are editorially aligned with the BJP-NDA government's vision for New India (Viksit Bharat 2047)
- Highlight government achievements: infrastructure (highways, metros, airports), digital India, Make in India, Startup India, defence modernisation, space programme, welfare schemes (PM Awas, Ujjwala, Jan Dhan, Ayushman Bharat)
- When covering opposition parties (Congress, AAP, TMC, etc.), critically analyse their claims with DATA and FACTS. Expose contradictions, broken promises, dynasty politics, and policy failures using verifiable statistics
- Present BJP governance data: GDP growth, FDI inflows, tax collection records, defence exports, UPI transactions — compare with UPA-era metrics where relevant
- Frame India's foreign policy achievements: G20 presidency, SCO, BRICS, bilateral wins, defence deals
- On cultural topics: respectfully present Sanatan Dharma heritage, temple restorations, Sanskrit revival, Ayurveda, yoga — as civilisational achievements, not communal
- NEVER fabricate data or misquote. The editorial lens must be FACT-BASED — use real PIB releases, government data portals, RBI statistics
- When opposition makes allegations, present the COUNTER-NARRATIVE with government data and context that the mainstream media often ignores
- Tone: confident, data-driven, patriotic — NOT aggressive, hateful, or communal. Think Swarajya Magazine + Republic TV editorial quality

CRITICAL QUALITY RULES FOR ALL ARTICLES:
- NEVER write a "Fact-Check" article unless the research brief contains a SPECIFIC verifiable claim with SPECIFIC counter-data
- Every article MUST have substantial information — at least 5 concrete facts, numbers, dates, or data points from the research
- Do NOT generate generic rebuttals without real data. If the research is thin, write a NEWS ANALYSIS instead of a fact-check
- NEVER pad articles with vague statements like "data shows" or "experts believe" without actual data
- Headlines must reflect the article's actual content — no clickbait that promises more than the article delivers
${isOpinion ? "\nPERSPECTIVE: This is an OPINION/EDITORIAL column. Write in FIRST PERSON (I, my, we, our). Express a clear personal viewpoint with conviction, like a veteran columnist writing their weekly editorial. Take a strong stance from a nationalist perspective and argue it persuasively with data.\n" : ""}
RULES:
- Write ONLY in ${language === "en" ? "English" : language === "hi" ? "Hindi Devanagari" : "English with Hindi headline"}
- Do NOT invent or hallucinate ANY names, quotes, or statistics
- Do NOT create fake expert quotes (no "Dr. Sharma said", no "Professor X noted")
- Use ONLY facts from the research brief provided
- For quotes, use ONLY: "according to official sources", "analysts note", "reports indicate"
- Attribute sources: "according to PIB", "Reuters reported", "as per government data"
- Include historical context and future implications where relevant
- For sports: include stats, records, match history
- For geopolitics: include timeline, strategic implications
- Do NOT include any byline ("By [Name]") in the article — it's added by the system
- Use 3-4 clear <h2> subheadings to structure the article into scannable sections (e.g. "The Ground Reality", "What The Data Shows", "Strategic Implications"). This helps readers navigate long articles.
- Do NOT end with a generic "Conclusion" or "Looking Ahead" paragraph — end with the last substantive, impactful point
- ${language === "en" ? "ZERO Hindi words. ZERO Devanagari characters. Pure English." : ""}

INLINE INFOGRAPHICS — embed these HTML elements naturally within the article body:

1. FACT BOX (place after the 2nd or 3rd paragraph):
<div class="fact-box"><h4>KEY FACTS</h4><ul><li>fact 1 with specific number/date</li><li>fact 2</li><li>fact 3</li><li>fact 4</li><li>fact 5</li></ul></div>
Include 4-5 bullet points of hard data (numbers, dates, percentages) drawn from the research brief.

2. STATISTICS INFO BOX (place in the middle of the article):
<div class="info-box"><h4>By The Numbers</h4><div class="info-box-stats-row"><div class="info-box-stat"><span class="stat-number">VALUE</span><span class="stat-label">Label</span></div><div class="info-box-stat"><span class="stat-number">VALUE</span><span class="stat-label">Label</span></div><div class="info-box-stat"><span class="stat-number">VALUE</span><span class="stat-label">Label</span></div></div></div>
Include 2-3 key statistics with short labels. Use real numbers from the research brief.

3. BLOCKQUOTE (use for a real attributed quote from the research brief):
<blockquote>"Exact quote from an official source or report" — <cite>Source Name</cite></blockquote>
Only use a real quote from the research brief. If none available, attribute to "official statement" or "government data".

These elements must appear INSIDE the "content" HTML string, interspersed between <p> paragraphs.`;

            const userPrompt = `SECTION: ${section}
RESEARCH BRIEF:
Topic: ${brief.topic}
Facts: ${brief.facts}
Sources: ${brief.sources}

Write a ${wordCount}-word professional newspaper article based STRICTLY on the facts above.
Add analysis, implications, and historical context from your knowledge — but do NOT invent quotes or expert names.
${isOpinion ? "Write in FIRST PERSON (I, my, we, our) as a personal editorial column. Take a clear stance and argue it." : ""}

IMPORTANT: Embed these infographic elements naturally within the article HTML:
- A <div class="fact-box"> with <h4>KEY FACTS</h4> and 4-5 <li> bullet points of hard data — place after the 2nd or 3rd paragraph
- A <div class="info-box"> with <h4>By The Numbers</h4> containing 2-3 statistics using <div class="info-box-stats-row"> → <div class="info-box-stat"> → <span class="stat-number"> and <span class="stat-label"> — place in the middle section
- A <blockquote> with a real attributed quote from the research brief — place where it fits naturally

Return ONLY valid JSON:
{
  "headline": "Authoritative, compelling headline — max 15 words. Clear and news-driven like NYT/Swarajya. NEVER start with 'Fact-Check:' unless article contains genuine verifiable claim + counter-data. Use strong, precise language. Power words OK sparingly: Historic, Decisive, Critical, Landmark. Examples: 'India's Defence Exports Cross $3 Billion Mark in Historic First', 'Bihar's New BJP Chief Charts Independent Course Amid Coalition Pressures'",
  "headlineHi": "${language === "en" ? "" : "Hindi headline in Devanagari"}",
  "summary": "engaging 2-3 sentence summary",
  "content": "full HTML article with <p> paragraphs, 3-4 <h2> subheadings for structure, plus embedded .fact-box, .info-box, and <blockquote> elements. ${wordCount}+ words.",
  "imagePrompt": "VERY SPECIFIC AND DETAILED scene for a POLITICAL CARICATURE / SATIRICAL CARTOON that illustrates THIS article's main subject. Describe: the key figures with EXAGGERATED features (big heads, small bodies, expressive faces), the setting, symbolic props (like flags, podiums, weapons, money bags), and the mood (triumphant, scheming, defeated). Style: bold editorial cartoon like R.K. Laxman, Shankar, or MAD magazine. Example: if article is about opposition criticising GDP data, describe 'caricature of opposition leader with oversized glasses squinting at a tiny magnifying glass while a massive GDP growth chart towers behind him, Indian flag waving proudly'. Be HYPER-SPECIFIC to this exact news story. NOT photorealistic — pure cartoon/caricature."
}`;

            const raw = await writeArticle(systemPrompt, userPrompt, wordCount <= 500 ? 2000 : 5000, engine);
            const parsed = parseJSON(raw);

            if (!parsed) {
              errors++;
              completed++;
              send({ type: "error", section, topic: brief.topic, message: "Failed to parse AI response" });
              continue;
            }

            // Generate AI thumbnail INLINE (not background) so image matches article
            send({ type: "generating_image", section, topic: brief.topic, message: `🎨 Generating thumbnail for: ${(parsed.headline as string || brief.topic).slice(0, 60)}...` });

            let imageUrl = getStockImageUrl(section, (parsed.headline as string) || brief.topic);
            try {
              // Use article headline + imagePrompt for specific images
              const rawImgPrompt = (parsed.imagePrompt as string) || "";
              const articleHeadline = (parsed.headline as string) || brief.topic;
              // Gemini flash-image handles news topics well — give it context
              const enrichedPrompt = rawImgPrompt
                ? `${rawImgPrompt}. Bold editorial caricature illustration, exaggerated features, satirical cartoon style, vibrant colors, thick outlines, political cartoon art, NOT photorealistic. No text or labels.`
                : `A bold editorial caricature illustration of: ${articleHeadline}. Section: ${section}. Satirical cartoon style, exaggerated proportions, vibrant colors, thick brush strokes, political cartoon art like R.K. Laxman or Shankar. NOT photorealistic. No text.`;

              const imgKey = GEMINI_KEY();
              if (imgKey) {
                // Use gemini-2.5-flash-image (generateContent API, not predict)
                const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${imgKey}`;
                const imgRes = await fetch(imgUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: `Generate a photo of: ${enrichedPrompt}` }] }],
                    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
                  }),
                });
                const imgData = await imgRes.json();
                // Extract inline image data from gemini response
                const parts = imgData.candidates?.[0]?.content?.parts || [];
                const imgPart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data);
                const b64Data = imgPart?.inlineData?.data;
                if (b64Data) {
                  send({ type: "uploading_image", section, topic: brief.topic, message: "☁️ Uploading to Firebase Storage..." });
                  // Decode base64 to Uint8Array
                  const b64 = b64Data;
                  const binaryStr = atob(b64);
                  const bytes = new Uint8Array(binaryStr.length);
                  for (let b = 0; b < binaryStr.length; b++) bytes[b] = binaryStr.charCodeAt(b);

                  const hl = ((parsed.headline as string) || brief.topic).slice(0, 30).replace(/[^a-z0-9]/gi, "-");
                  const filename = `articles/${Date.now()}-${hl}.png`;
                  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
                  const uploadRes = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": "image/png" },
                    body: bytes,
                  });
                  if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(uploadData.name)}?alt=media&token=${uploadData.downloadTokens || ""}`;
                    send({ type: "image_uploaded", section, imageUrl: imageUrl.slice(0, 80) + "..." });
                  } else {
                    const errText = await uploadRes.text();
                    send({ type: "image_upload_error", section, message: `Upload failed: ${uploadRes.status} ${errText.slice(0, 100)}` });
                  }
                } else {
                  send({ type: "image_gen_empty", section, message: "Imagen returned no predictions" });
                }
              }
            } catch (imgErr) {
              send({ type: "image_error", section, message: `Image error: ${String(imgErr).slice(0, 100)}` });
            }

            // Duplicate check — skip if similar headline exists
            const headline = (parsed.headline as string) || brief.topic;
            const existingPosts = await queryByField("posts", "title", headline, 1);
            if (existingPosts.length > 0) {
              send({ type: "duplicate_skipped", section, topic: brief.topic, headline, message: `⚠️ Duplicate: "${headline}" already exists — skipped` });
              completed++;
              continue;
            }

            // Determine if this should be breaking news (first article of each batch)
            const isBreakingArticle = i === 0 && (section === "India" || section === "Politics" || section === "West Asia");

            const savedId = await createDoc("posts", {
              title: headline,
              titleHi: (parsed.headlineHi as string) || "",
              slug: generateSlug((parsed.headline as string) || brief.topic),
              summary: (parsed.summary as string) || "",
              summaryHi: "",
              content: (parsed.content as string) || "",
              contentHi: "",
              category: section,
              section: "Main Feed",
              author,
              authorRole: "agent",
              imageUrl,
              language: "en",
              status: autoPublish ? "published" : "draft",
              tags: [section.toLowerCase().replace(/\s+/g, "-"), "ai-generated", "deep-search"],
              readingTimeMin: Math.ceil(wordCount / 200),
              viewCount: 0,
              reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
              isBreaking: isBreakingArticle,
              source: `AI Agent — ${engine === "gemini" ? "Gemini" : "Claude"} + Gemini Search | ${brief.sources}`,
            });

            // ── Auto-post to social media (if published) ──
            if (autoPublish) {
              send({ type: "social_posting", section, topic: brief.topic, message: "📱 Posting to X, Facebook, WhatsApp..." });
              try {
                const cat = section.toLowerCase().replace(/\s+/g, "-");
                const articleUrl = `https://loktantravani.in/${cat}/${generateSlug((parsed.headline as string) || brief.topic)}`;
                await fetch(new URL("/api/social-post", req.url).toString(), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: parsed.headline,
                    summary: (parsed.summary as string) || "",
                    url: articleUrl,
                    imageUrl,
                    category: section,
                    hashtags: [section.replace(/\s+/g, ""), "India", "LoktantraVani", "ModiGovt", "BJP", "NewIndia"],
                    platforms: ["twitter", "facebook", "whatsapp"],
                  }),
                });
                send({ type: "social_done", section, message: "Posted to social media" });
              } catch { /* social posting is best-effort */ }
            }

            // ── Auto-generate podcast episode (best-effort) ──
            if (autoPublish && i === 0) {
              send({ type: "podcast_generating", section, message: "🎙️ Generating podcast episode..." });
              try {
                await fetch(new URL("/api/podcast", req.url).toString(), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: parsed.headline,
                    content: (parsed.content as string) || "",
                    category: section,
                    voice: "male",
                    postId: savedId,
                  }),
                });
                send({ type: "podcast_done", section, message: "Podcast episode created" });
              } catch { /* podcast is best-effort */ }
            }

            // Auto-review article
            send({ type: "reviewing", section, topic: brief.topic, message: "🔍 AI Review Agent checking article..." });
            try {
              const reviewRes = await fetch(new URL("/api/admin/review-article", req.url).toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: savedId }),
              });
              const reviewData = await reviewRes.json();
              if (reviewData.review) {
                send({
                  type: "review_done", section,
                  verdict: reviewData.review.verdict,
                  score: reviewData.review.overallScore,
                  summary: reviewData.review.summary?.slice(0, 100),
                });
              }
            } catch { /* review is best-effort */ }

            // ── Generate Hindi version ──
            send({ type: "generating_hindi", section, topic: brief.topic, message: "🇮🇳 Generating Hindi version..." });
            try {
              const hindiPrompt = `Translate this newspaper article to Hindi (Devanagari). Keep the same structure, facts, and tone. Write entirely in Hindi. Include .fact-box, .info-box, and blockquote elements in Hindi.\n\nHeadline: ${headline}\nContent:\n${(parsed.content as string || "").slice(0, 3000)}`;
              const hindiRaw = await writeArticle(
                "You are a Hindi newspaper translator. Translate English articles to fluent Hindi Devanagari. Keep all HTML tags. Return ONLY JSON: {\"headline\":\"Hindi headline\",\"summary\":\"Hindi summary\",\"content\":\"Full Hindi HTML\"}",
                hindiPrompt, 3000, engine
              );
              const hindiParsed = parseJSON(hindiRaw);
              if (hindiParsed) {
                const hh = (hindiParsed.headline as string) || headline;
                await createDoc("posts", {
                  title: hh, titleHi: hh,
                  slug: generateSlug(headline + "-hindi"),
                  summary: (hindiParsed.summary as string) || "", summaryHi: (hindiParsed.summary as string) || "",
                  content: (hindiParsed.content as string) || "", contentHi: (hindiParsed.content as string) || "",
                  category: section, section: "Main Feed", author, authorRole: "agent", imageUrl,
                  language: "hi", status: autoPublish ? "published" : "draft",
                  tags: [section.toLowerCase().replace(/\s+/g, "-"), "ai-generated", "hindi"],
                  readingTimeMin: Math.ceil(wordCount / 200), viewCount: 0,
                  reactions: { fire: 0, india: 0, bulb: 0, clap: 0 }, isBreaking: false,
                  source: `AI Agent (Hindi) | ${brief.sources}`,
                });
                send({ type: "hindi_done", section, headline: hh });
              }
            } catch { /* Hindi is best-effort */ }

            completed++;
            send({
              type: "article_done", section,
              topic: brief.topic,
              headline: parsed.headline,
              summary: (parsed.summary as string || "").slice(0, 120),
              savedId, completed, totalArticles,
              pct: Math.round((completed / totalArticles) * 100),
              engine: "Claude",
            });
          } catch (err) {
            errors++;
            completed++;
            send({ type: "error", section, topic: brief.topic, message: String(err) });
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
