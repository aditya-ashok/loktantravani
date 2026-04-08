/**
 * POST /api/ai-revisit
 * AI Revisit: Send existing article through Claude + Gemini for editorial improvement
 * - Improves writing quality, fact-checks, enriches content
 * - Returns improved title, titleHi, summary, summaryHi, content
 * - Tries Claude first (best quality), falls back to Gemini
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

async function callClaude(system: string, user: string, maxTokens = 8000): Promise<string | null> {
  const key = ANTHROPIC_KEY();
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

async function callGemini(system: string, user: string): Promise<string | null> {
  const key = GEMINI_KEY();
  if (!key) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8000 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const candidates = data.candidates as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
    return candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, titleHi, summary, summaryHi, content, category, author, engine } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const systemPrompt = `You are a senior editor at LoktantraVani, India's premier AI-powered newspaper. Your job is to REVISIT and IMPROVE an existing article while preserving the author's voice and intent.

EDITORIAL GUIDELINES:
1. Improve clarity, flow, and readability
2. Fix any factual inaccuracies or outdated information
3. Strengthen the headline to be more compelling
4. Make the summary punchier and more informative
5. Enhance the content with better structure, transitions, and analysis
6. Add relevant context where needed
7. Maintain the article's original tone and perspective
8. Keep Hindi translations natural and idiomatic, not literal translations
9. Use professional journalistic language
10. Content MUST be in valid HTML format with proper <p>, <h2>, <blockquote>, <ul>/<li> tags
11. Do NOT add any markdown formatting — output pure HTML for content field

Return a JSON object with these fields:
{
  "title": "improved English headline",
  "titleHi": "improved Hindi headline",
  "summary": "improved English summary (2-3 sentences, compelling)",
  "summaryHi": "improved Hindi summary",
  "content": "improved full article HTML content"
}

Return ONLY the JSON object, no markdown code fences, no extra text.`;

    const userPrompt = `Please revisit and improve this ${category} article by ${author}:

CURRENT TITLE: ${title}
CURRENT HINDI TITLE: ${titleHi || "Not available"}
CURRENT SUMMARY: ${summary || "Not available"}
CURRENT HINDI SUMMARY: ${summaryHi || "Not available"}

CURRENT CONTENT:
${content}

Improve the article while keeping its core message. Make it sharper, more engaging, and editorially polished. Ensure the Hindi translations are natural.`;

    let result: string | null = null;
    let usedEngine = "none";

    // Try preferred engine first, or auto (Claude first, then Gemini)
    if (engine === "gemini") {
      result = await callGemini(systemPrompt, userPrompt);
      if (result) usedEngine = "gemini";
    } else if (engine === "claude") {
      result = await callClaude(systemPrompt, userPrompt);
      if (result) usedEngine = "claude";
    } else {
      // Auto: try Claude first
      result = await callClaude(systemPrompt, userPrompt);
      if (result) {
        usedEngine = "claude";
      } else {
        result = await callGemini(systemPrompt, userPrompt);
        if (result) usedEngine = "gemini";
      }
    }

    if (!result) {
      return NextResponse.json({ error: "Both Claude and Gemini failed. Check API keys." }, { status: 500 });
    }

    // Parse JSON from result
    let parsed: Record<string, unknown> | null = null;
    try {
      const clean = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* */ }
      }
    }

    if (!parsed || !parsed.title) {
      return NextResponse.json({ error: "AI returned invalid response. Try again.", raw: result?.slice(0, 500) }, { status: 500 });
    }

    return NextResponse.json({
      title: parsed.title as string,
      titleHi: (parsed.titleHi as string) || titleHi || "",
      summary: (parsed.summary as string) || summary || "",
      summaryHi: (parsed.summaryHi as string) || summaryHi || "",
      content: (parsed.content as string) || content,
      engine: usedEngine,
    });
  } catch (err) {
    console.error("AI Revisit error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
