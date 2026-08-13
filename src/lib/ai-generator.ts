/**
 * AI Article & Cartoon Generation Service
 * Uses Gemini API via /api/lok-post/gemini proxy
 * Ported from IIIT B/LoktantraWani Post logic
 */

import type { PostCategory } from "./types";
import { callGroq, GROQ_DEFAULT_MODEL, GROQ_WEB_MODEL } from "./groq";

// ── Gemini API helper — calls Gemini directly (works server-side) ──
async function callGemini(model: string, body: Record<string, unknown>, action = "generateContent") {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}?key=${apiKey}`;

  // Retry transient 429/503; surface Gemini's real message so failures are actionable.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) return res.json();

    // Read the error body so we can tell a transient rate-limit from a hard failure.
    const errText = await res.text().catch(() => "");
    let msg = "";
    try { msg = (JSON.parse(errText)?.error?.message as string) || ""; } catch { /* non-JSON body */ }

    // Billing / credit depletion is NOT transient — retrying always fails, so fail fast with a clear message.
    if (/credit|billing|depleted|exceeded your current quota/i.test(msg)) {
      throw new Error(`Gemini billing: ${msg || "prepayment credits depleted — top up at aistudio.google.com"}`);
    }

    // Genuine transient rate-limit or model overload — back off (honour Retry-After) and retry.
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after")) || 0;
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 4000; // 4s, 8s
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(`Gemini API error ${res.status}: ${msg || errText.slice(0, 200)}`);
  }
  throw new Error("Gemini API: max retries exceeded");
}

function extractGeminiText(data: Record<string, unknown>): string {
  try {
    const candidates = data.candidates as Array<{ content: { parts: Array<{ text?: string }> } }>;
    return candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  } catch {
    return "";
  }
}

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(clean);
  } catch {
    // Try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
      // Models sometimes emit raw newlines inside JSON strings — invalid in
      // strings, insignificant outside, so flattening to spaces is safe.
      try { return JSON.parse(match[0].replace(/[\u0000-\u001F]+/g, " ")); } catch { return null; }
    }
    return null;
  }
}

// ── Article Generation ─────────────────────────────────────────
export interface GeneratedArticle {
  headline: string;
  headlineHi: string;
  summary: string;
  content: string;
  imagePrompt: string;
  category: PostCategory;
}

export async function generateArticle(
  topic: string,
  category: PostCategory,
  language: "en" | "hi" | "bilingual" = "bilingual",
  tone: "nationalist" | "neutral" | "analytical" = "neutral",
  wordCount: number = 1500
): Promise<GeneratedArticle> {
  const toneGuide = {
    nationalist: "Champion India's civilizational greatness, strategic autonomy, and Atmanirbhar Bharat vision. Use pride-evoking language.",
    neutral: "Balanced, fact-based analysis. Present multiple perspectives. Objective journalistic voice.",
    analytical: "Expert deep-dive with data, geopolitical context, and forward-looking implications for India.",
  };

  const isHindi = language === "hi";
  const isBilingual = language === "bilingual";

  const langGuide = isHindi
    ? "Write ENTIRELY in Hindi (Devanagari script). ALL text — headline, summary, content — must be in Hindi Devanagari. ZERO English words allowed except proper nouns (names, places, organizations)."
    : language === "en"
    ? "Write ENTIRELY in English. ZERO Hindi words. ZERO Devanagari characters."
    : "Write headline in both Hindi AND English. Article body in English with Hindi terms where culturally appropriate.";

  const jsonSchema = isHindi
    ? `{
  "headline": "हिंदी में शक्तिशाली शीर्षक, अधिकतम 12 शब्द (Devanagari only)",
  "headlineHi": "same as headline (Devanagari)",
  "summary": "हिंदी में 2-3 वाक्यों का सारांश (Devanagari only)",
  "content": "पूर्ण HTML लेख <h2>, <p>, <blockquote> टैग के साथ। ${wordCount} शब्द। हिंदी देवनागरी में। ZERO English.",
  "imagePrompt": "vivid English description for editorial illustration of this topic. Newspaper style. No text in image."
}`
    : `{
  "headline": "powerful ${isBilingual ? "English" : "English"} headline, max 12 words",
  "headlineHi": "${isBilingual ? "Hindi headline in Devanagari, max 12 words" : ""}",
  "summary": "engaging 2-3 sentence summary in English",
  "content": "full HTML article with <h2>, <p>, <blockquote> tags. ${wordCount} words. Professional newspaper tone.",
  "imagePrompt": "vivid English description for editorial illustration of this topic. Newspaper style. No text in image."
}`;

  const prompt = `You are a senior journalist and columnist for "LoktantraVani" — India's leading Neo Bharat digital newspaper.

LANGUAGE: ${langGuide}
SECTION: ${category}
EDITORIAL TONE: ${toneGuide[tone]}
TARGET LENGTH: ${wordCount} words

TOPIC: "${topic}"

Write a compelling, well-researched newspaper article. Use real facts and current context (${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}).

CRITICAL: Do NOT hallucinate quotes or statistics. Ground everything in plausible real-world context.
${isHindi ? "CRITICAL: Write ALL text in Hindi Devanagari script. The headline, summary, and entire article content MUST be in Hindi. Not bilingual. Not English. PURE HINDI." : ""}

Return ONLY valid JSON (no markdown fences):
${jsonSchema}`;

  // When the topic contains URLs, let Gemini actually fetch and read them
  // (url_context) and search for surrounding coverage — otherwise the model
  // only sees the URL string itself and invents the contents.
  const hasUrls = /https?:\/\//.test(topic);

  // Groq is the primary text backend. Devanagari tokenises heavily, so scale the
  // output budget to the requested length; URL topics use the web-search model.
  const maxTokens = Math.min(32000, Math.max(4096, Math.round(wordCount * 6)));
  const groqModel = hasUrls ? GROQ_WEB_MODEL : GROQ_DEFAULT_MODEL;
  const sysMsg = { role: "system" as const, content: "You are a senior journalist for LoktantraVani. Output ONLY a single valid JSON object — no markdown fences, no commentary." };

  // Gemini fallback config (used only if Groq is unavailable AND Gemini has credits).
  const generationConfig = { temperature: 0.5, maxOutputTokens: 16384 };

  let text = "";
  try {
    text = await callGroq([sysMsg, { role: "user", content: prompt }], {
      model: groqModel, jsonMode: true, temperature: 0.5, maxTokens,
    });
  } catch (groqErr) {
    // Groq down — fall back to Gemini (url_context/search when the topic has links).
    try {
      let data: Record<string, unknown>;
      try {
        data = await callGemini("gemini-flash-latest", {
          contents: [{ parts: [{ text: prompt }] }],
          ...(hasUrls ? { tools: [{ url_context: {} }, { google_search: {} }] } : {}),
          generationConfig,
        });
      } catch {
        data = await callGemini("gemini-flash-latest", {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        });
      }
      text = extractGeminiText(data);
    } catch {
      throw groqErr; // surface the Groq failure — it is the primary backend
    }
  }

  let parsed = parseJSON(text);

  // One retry on parse failure — regenerate with a stricter reminder.
  if (!parsed) {
    try {
      text = await callGroq(
        [sysMsg, { role: "user", content: prompt + "\n\nREMINDER: Output must be a single valid JSON object. Escape all newlines inside strings as \\n." }],
        { model: GROQ_DEFAULT_MODEL, jsonMode: true, temperature: 0.5, maxTokens }
      );
      parsed = parseJSON(text);
    } catch { /* keep parsed null → throw below */ }
  }

  if (!parsed) throw new Error("Failed to parse AI response");

  return {
    headline: (parsed.headline as string) || topic,
    headlineHi: (parsed.headlineHi as string) || "",
    summary: (parsed.summary as string) || "",
    content: (parsed.content as string) || "",
    imagePrompt: (parsed.imagePrompt as string) || `Editorial illustration about ${topic}`,
    category,
  };
}

// ── Cartoon Generation ─────────────────────────────────────────
export interface GeneratedCartoon {
  headline: string;
  headlineHi: string;
  caption: string;
  imagePrompt: string;
  imageBase64: string | null;
}

export async function generateCartoonConcept(
  topic: string,
  style: "political-satire" | "social-commentary" | "humor" = "political-satire"
): Promise<{ headline: string; headlineHi: string; caption: string; imagePrompt: string }> {
  const styleGuide = {
    "political-satire": "Sharp political satire in the tradition of R.K. Laxman. Witty, pointed commentary on Indian politics and governance.",
    "social-commentary": "Social commentary cartoon highlighting everyday Indian life, culture, and societal issues with warmth and humor.",
    "humor": "Light-hearted, fun cartoon that makes people smile. Can reference pop culture, cricket, chai, or daily life in India.",
  };

  const prompt = `You are a legendary Indian newspaper cartoonist like R.K. Laxman.

STYLE: ${styleGuide[style]}
TOPIC: "${topic}"

Create a cartoon concept for the "Lok Post" section of LoktantraVani newspaper.

Return ONLY valid JSON:
{
  "headline": "witty English caption for the cartoon, max 8 words",
  "headlineHi": "Hindi caption in Devanagari, max 8 words",
  "caption": "one-line description of what the cartoon depicts",
  "imagePrompt": "detailed description for AI image generation: describe the scene, characters, expressions, props. Style: bold colorful 3D cartoon editorial illustration, Indian newspaper cartoon style, exaggerated features, satirical. Square format. NO TEXT in the image."
}`;

  const text = await callGroq(
    [
      { role: "system", content: "You are a legendary Indian newspaper cartoonist. Output ONLY a single valid JSON object." },
      { role: "user", content: prompt },
    ],
    { model: GROQ_DEFAULT_MODEL, jsonMode: true, temperature: 0.7, maxTokens: 2048 }
  );
  const parsed = parseJSON(text);

  if (!parsed) throw new Error("Failed to parse cartoon concept");

  return {
    headline: (parsed.headline as string) || topic,
    headlineHi: (parsed.headlineHi as string) || "",
    caption: (parsed.caption as string) || "",
    imagePrompt: (parsed.imagePrompt as string) || `Cartoon about ${topic}`,
  };
}

// ── Image Generation (Gemini Imagen) ───────────────────────────
export async function generateImage(prompt: string): Promise<string | null> {
  // Try Imagen 4.0 first
  try {
    const data = await callGemini("imagen-4.0-generate-001", {
      contents: [{ parts: [{ text: prompt + " Bold 3D cartoon newspaper editorial style. Square. No text." }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }, "predict");

    const predictions = data.predictions as Array<{ bytesBase64Encoded: string }> | undefined;
    if (predictions?.[0]?.bytesBase64Encoded) {
      return `data:image/png;base64,${predictions[0].bytesBase64Encoded}`;
    }
  } catch {
    // fallback below
  }

  // Fallback: Gemini Flash with image output
  try {
    const data = await callGemini("gemini-flash-latest", {
      contents: [{ parts: [{ text: `Generate an image: ${prompt}. Bold 3D cartoon newspaper editorial illustration style. No text in image.` }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const candidates = data.candidates as Array<{ content: { parts: Array<{ inlineData?: { mimeType: string; data: string } }> } }> | undefined;
    const imgPart = candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (imgPart?.inlineData) {
      return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
    }
  } catch {
    // no image generated
  }

  return null;
}

// ── Full Cartoon Pipeline ──────────────────────────────────────
export async function generateFullCartoon(
  topic: string,
  style: "political-satire" | "social-commentary" | "humor" = "political-satire"
): Promise<GeneratedCartoon> {
  const concept = await generateCartoonConcept(topic, style);

  // Generate the cartoon image
  const imageBase64 = await generateImage(concept.imagePrompt);

  return {
    ...concept,
    imageBase64,
  };
}
