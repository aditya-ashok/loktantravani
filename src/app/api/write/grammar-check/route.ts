/**
 * POST /api/write/grammar-check
 * AI grammar + clarity check using Gemini
 */
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

export async function POST(req: NextRequest) {
  try {
    const { content, title } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const key = GEMINI_KEY();
    if (!key) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const plainText = content.replace(/<[^>]*>/g, "").slice(0, 5000);

    const prompt = `You are a professional newspaper copy editor. Proofread this article.

TITLE: ${title || "Untitled"}
CONTENT:
${plainText}

Check for:
1. Grammar and spelling errors
2. Clarity and readability
3. Sentence structure
4. Punctuation
5. Factual consistency (flag claims that seem unverifiable)

Return ONLY valid JSON:
{
  "overallScore": 8,
  "corrections": [
    {"original": "exact text with error", "corrected": "fixed version", "reason": "brief explanation"}
  ],
  "suggestions": ["tip 1", "tip 2"],
  "readabilityGrade": "College level",
  "wordCount": 1200
}

If the article is well-written with no errors, return an empty corrections array and high score.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
        }),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

    // Parse JSON
    const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let result;
    try { result = JSON.parse(clean); } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) result = JSON.parse(m[0]);
      else return NextResponse.json({ error: "AI returned invalid response" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
