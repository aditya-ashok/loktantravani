/**
 * POST /api/lok-post/generate-card
 * Generates a 2x2 newspaper card with 4 news stories + AI images
 *
 * Body: { edition, tone, stories: [{topic, headline?, summary?}], language }
 * Returns: { html, stories: [{headline, headlineHi, summary, imageUrl}] }
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

const EDITION_THEMES: Record<string, { name: string; nameHi: string; bg: string; accent: string; dark: string; cream: string }> = {
  bharat:   { name: "Bharat Edition", nameHi: "भारत संस्करण", bg: "#f5e8ca", accent: "#e8820c", dark: "#2d1a0a", cream: "#fdf0d5" },
  kerala:   { name: "Kerala Edition", nameHi: "केरल संस्करण", bg: "#d4edda", accent: "#2ecc71", dark: "#0d2e1c", cream: "#e8f5ee" },
  india:    { name: "National Edition", nameHi: "राष्ट्रीय संस्करण", bg: "#fff5e6", accent: "#FF9933", dark: "#1a1a2e", cream: "#fff8f0" },
  ne:       { name: "Northeast Edition", nameHi: "पूर्वोत्तर संस्करण", bg: "#e5d5f5", accent: "#9b59b6", dark: "#1a0a2e", cream: "#f0e8f8" },
  bengal:   { name: "Bengal Edition", nameHi: "बंगाल संस्करण", bg: "#d5e0f5", accent: "#3a7bd5", dark: "#0a1a3d", cream: "#e8eef8" },
  bihar:    { name: "Bihar Edition", nameHi: "बिहार संस्करण", bg: "#f5e8ca", accent: "#b8860b", dark: "#2d1a0a", cream: "#fdf0d5" },
};

const TONE_PROMPTS: Record<string, string> = {
  "pro-bjp": "Write from a positive BJP/NDA governance perspective. Highlight development, achievements, and strong leadership.",
  "neutral": "Write balanced, factual analysis with multiple perspectives.",
  "anti-opp": "Write analytical criticism of opposition policies. Highlight contradictions and failures.",
  "pro-india": "Write from a proud nationalist perspective. Highlight India's civilizational greatness, growth, and global stature.",
  "satire": "Write sharp political satire with wit and humor.",
};

async function geminiGenerate(prompt: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
}

async function geminiImage(prompt: string): Promise<string | null> {
  const key = GEMINI_KEY();
  if (!key) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a photo: ${prompt}` }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data);
    return imgPart?.inlineData?.data || null;
  } catch { return null; }
}

function parseJSON(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch { /* */ }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      edition = "bharat",
      tone = "pro-india",
      stories = [] as { topic: string }[],
      language = "bilingual",
    } = body;

    const theme = EDITION_THEMES[edition] || EDITION_THEMES.bharat;
    const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.neutral;
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    // Generate content for each story
    const generatedStories: { headline: string; headlineHi: string; summary: string; imageB64: string | null }[] = [];

    for (const story of stories.slice(0, 4)) {
      const prompt = `You are a senior editor at LoktantraVani newspaper.
TONE: ${tonePrompt}
TOPIC: "${story.topic}"

Search for the latest facts about this topic. Write a newspaper card panel.
Return ONLY valid JSON:
{
  "headline": "English headline max 10 words",
  "headlineHi": "Hindi headline in Devanagari max 10 words",
  "summary": "2-3 sentence summary, factual, ${language === "hi" ? "in Hindi" : "in English"}",
  "imagePrompt": "Photojournalistic scene for this news. Specific, dramatic, cinematic."
}`;

      const raw = await geminiGenerate(prompt);
      const parsed = parseJSON(raw);

      const headline = (parsed?.headline as string) || story.topic;
      const headlineHi = (parsed?.headlineHi as string) || "";
      const summary = (parsed?.summary as string) || "";
      const imagePrompt = (parsed?.imagePrompt as string) || `Professional news photo about ${story.topic}`;

      // Generate image
      const imageB64 = await geminiImage(imagePrompt);

      generatedStories.push({ headline, headlineHi, summary, imageB64 });
    }

    // Build 2x2 card HTML
    const cardHTML = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&family=Playfair+Display:wght@700;900&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { background:${theme.bg}; font-family:'Source Sans 3',sans-serif; }
.card { width:600px; margin:20px auto; background:${theme.cream}; border:3px solid ${theme.dark}; overflow:hidden; }
.masthead { background:${theme.dark}; color:${theme.cream}; padding:10px 16px; display:flex; justify-content:space-between; align-items:center; }
.masthead h1 { font-family:'Noto Sans Devanagari',serif; font-size:20px; font-weight:900; }
.masthead .meta { font-size:8px; text-transform:uppercase; letter-spacing:1.5px; opacity:0.7; text-align:right; }
.masthead .edition { color:${theme.accent}; font-size:9px; font-weight:700; }
.grid { display:grid; grid-template-columns:1fr 1fr; }
.panel { border:1px solid ${theme.dark}; position:relative; overflow:hidden; }
.panel img { width:100%; height:140px; object-fit:cover; display:block; }
.panel .overlay { position:absolute; top:0; left:0; right:0; height:140px; background:linear-gradient(transparent 40%, rgba(0,0,0,0.8)); }
.panel .hl { position:absolute; top:100px; left:8px; right:8px; font-family:'Noto Sans Devanagari',serif; font-size:12px; font-weight:900; color:#fff; line-height:1.25; text-shadow:0 1px 4px rgba(0,0,0,0.7); }
.panel .body { padding:8px 10px; background:${theme.cream}; }
.panel .body .hi { font-family:'Noto Sans Devanagari',serif; font-size:10px; color:${theme.accent}; font-weight:700; margin-bottom:3px; }
.panel .body .sm { font-size:9px; line-height:1.5; color:${theme.dark}; }
.footer { background:${theme.dark}; color:${theme.cream}; padding:6px 16px; display:flex; justify-content:space-between; font-size:7px; text-transform:uppercase; letter-spacing:1.5px; opacity:0.6; }
</style></head><body>
<div class="card">
  <div class="masthead">
    <h1>लोकतंत्र वाणी</h1>
    <div class="meta">
      <div class="edition">${theme.nameHi} · ${theme.name}</div>
      <div>${today}</div>
    </div>
  </div>
  <div class="grid">
    ${generatedStories.map((s, i) => {
      const imgSrc = s.imageB64 ? `data:image/png;base64,${s.imageB64}` : `https://images.unsplash.com/photo-${1524492412937 + i * 111}-b28074a5d7da?w=600`;
      return `<div class="panel">
        <img src="${imgSrc}" alt="" />
        <div class="overlay"></div>
        <div class="hl">${s.headline}</div>
        <div class="body">
          ${s.headlineHi ? `<div class="hi">${s.headlineHi}</div>` : ""}
          <div class="sm">${s.summary}</div>
        </div>
      </div>`;
    }).join("")}
  </div>
  <div class="footer">
    <span>LoktantraVani by Kautilya World</span>
    <span>loktantravani.vercel.app</span>
    <span>${tone.toUpperCase()}</span>
  </div>
</div>
</body></html>`;

    return NextResponse.json({
      success: true,
      html: cardHTML,
      stories: generatedStories.map(s => ({
        headline: s.headline,
        headlineHi: s.headlineHi,
        summary: s.summary,
        hasImage: !!s.imageB64,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
