/**
 * GET  /api/talking-points         — fetch today's talking points from Firestore
 * POST /api/talking-points         — generate fresh talking points for today
 *
 * Flow: Gemini + Google Search (real-time news) → Claude/Gemini (structured writing) → Firestore
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/firestore-rest";

export const maxDuration = 120;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();

function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

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
      generationConfig: { temperature: 0.2, maxOutputTokens: 4000 },
    }),
  });
  const data = await res.json();
  const candidates = data.candidates as
    | Array<{ content: { parts: Array<{ text?: string }> } }>
    | undefined;
  return (
    candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || ""
  );
}

// ── AI Writer: Claude first, Gemini fallback ──
async function aiGenerate(systemPrompt: string, userPrompt: string): Promise<string> {
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
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        if (text) return text;
      }
    } catch {
      /* Claude failed, fall through to Gemini */
    }
  }

  // Fallback: Gemini
  const key = GEMINI_KEY();
  if (!key) throw new Error("No AI API key available");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4000 },
    }),
  });
  const data = await res.json();
  const candidates = data.candidates as
    | Array<{ content: { parts: Array<{ text?: string }> } }>
    | undefined;
  return (
    candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || ""
  );
}

const SYSTEM_PROMPT = `You are a BJP political strategist preparing a daily briefing for party supporters and social media warriors. Focus on: 1) Government achievements of the day 2) Counter-narratives to opposition claims 3) Data-backed facts 4) Nationalistic talking points 5) Development milestones. Tone: confident, patriotic, data-driven. NOT hateful or communal.

You MUST return ONLY valid JSON — no markdown fences, no commentary. Follow the exact schema provided.`;

// ── GET: Fetch today's talking points ──
export async function GET() {
  try {
    const date = todayIST();
    const doc = await getDoc(`talking-points/${date}`);
    if (!doc) {
      return NextResponse.json(
        { error: "No talking points for today yet", date },
        { status: 404 }
      );
    }
    return NextResponse.json(doc);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST: Generate and save today's talking points ──
export async function POST(req: NextRequest) {
  try {
    const date = todayIST();

    // Allow forcing regeneration via ?force=true, otherwise return cached
    const force = req.nextUrl.searchParams.get("force") === "true";
    if (!force) {
      const existing = await getDoc(`talking-points/${date}`);
      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Step 1: Gemini + Google Search for today's top political news
    const newsRaw = await geminiSearch(
      `Today is ${date}. Find today's top 8-10 Indian political news stories. ` +
        `Focus on: BJP and Modi government announcements, policy decisions, infrastructure milestones, ` +
        `economic data releases, opposition statements and controversies, India's international relations. ` +
        `For each story include the headline, key facts, any statistics, and sources. Be factual and detailed.`
    );

    if (!newsRaw) {
      return NextResponse.json({ error: "Failed to fetch today's news" }, { status: 502 });
    }

    // Step 2: Generate structured talking points
    const userPrompt = `Based on today's (${date}) political news below, generate "Today's 5 Points Every BJP Supporter Should Know".

NEWS CONTEXT:
${newsRaw}

Return ONLY valid JSON matching this exact schema:
{
  "date": "${date}",
  "headline": "Overall daily headline — punchy, under 20 words",
  "summary": "2-line summary of the day's political landscape",
  "points": [
    {
      "title": "Short headline under 15 words",
      "point": "The key fact/achievement/counter-narrative in 2-3 sentences",
      "data": "Supporting statistic or official source",
      "counter": "If opposition made a claim, the BJP counter-argument. Empty string if not applicable.",
      "hashtag": "#SuggestedHashtag"
    }
  ],
  "whatsappText": "Pre-formatted WhatsApp message with all 5 points — use emojis, numbered list, compact format, include a sign-off like 'Forward to 5 groups 🇮🇳'"
}

Rules:
- Exactly 5 points in the array
- Each title under 15 words
- whatsappText should be ready to copy-paste into WhatsApp
- All facts must come from the news context provided — do not invent statistics`;

    const raw = await aiGenerate(SYSTEM_PROMPT, userPrompt);

    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON object from the response
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI returned invalid JSON", raw: jsonStr.slice(0, 500) },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    // Ensure required fields
    const result = {
      date,
      headline: parsed.headline || "Today's BJP Briefing",
      summary: parsed.summary || "",
      points: Array.isArray(parsed.points) ? parsed.points.slice(0, 5) : [],
      whatsappText: parsed.whatsappText || "",
      generatedAt: new Date().toISOString(),
    };

    // Step 3: Save to Firestore
    await setDoc(`talking-points/${date}`, result);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
