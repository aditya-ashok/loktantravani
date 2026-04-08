/**
 * POST /api/write/ai-validate
 * Admin AI quality check on user submission
 */
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

export async function POST(req: NextRequest) {
  try {
    const { title, content, category } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const key = GEMINI_KEY();
    if (!key) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const plainText = content.replace(/<[^>]*>/g, "").slice(0, 5000);

    const prompt = `You are an editorial quality checker for LoktantraVani newspaper.

TITLE: ${title || "Untitled"}
CATEGORY: ${category || "General"}
CONTENT:
${plainText}

Analyze this user-submitted article for:
1. FACTUALITY — flag unverifiable claims, made-up statistics, or misinformation
2. GRAMMAR — spelling, punctuation, sentence structure
3. TONE — is it appropriate for a newspaper? Professional vs inflammatory?
4. ORIGINALITY — does it seem like original analysis or copied content?
5. RELEVANCE — does it fit the ${category} category?

Return ONLY valid JSON:
{
  "factualityScore": 7,
  "grammarScore": 8,
  "toneScore": 9,
  "originalityScore": 7,
  "relevanceScore": 8,
  "overallVerdict": "approve",
  "issues": [
    {"type": "factuality", "description": "Claim about X is unverifiable", "excerpt": "exact text"},
    {"type": "grammar", "description": "Subject-verb agreement error", "excerpt": "exact text"}
  ],
  "summary": "Overall assessment in 2-3 sentences.",
  "recommendation": "approve" | "review" | "reject"
}

Verdicts: "approve" = good to publish, "review" = needs minor edits, "reject" = not publishable.`;

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
