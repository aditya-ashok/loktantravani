/**
 * POST /api/ai-tools
 * Unified AI tools endpoint for admin portal.
 * Actions: headline-optimize, auto-tag, quality-score, seo-recommend, fact-check, caption-image, writing-assist
 */

import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

async function gemini(prompt: string, maxTokens = 1024, temperature = 0.4): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function parseJSON(text: string): unknown {
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      // ─── Headline Optimizer ───────────────────────────────────────
      case "headline-optimize": {
        const { title, category, language } = params;
        const result = await gemini(
          `You are a headline optimization expert for an Indian news website. Analyze this headline and provide improvements.

Headline: "${title}"
Category: ${category || "General"}
Language: ${language || "English"}

Return ONLY valid JSON:
{
  "score": <number 1-10>,
  "analysis": {
    "clarity": <1-10>,
    "clickability": <1-10>,
    "seo": <1-10>,
    "emotion": <1-10>
  },
  "issues": ["issue1", "issue2"],
  "suggestions": [
    {"headline": "alternative 1", "reason": "why this is better"},
    {"headline": "alternative 2", "reason": "why this is better"},
    {"headline": "alternative 3", "reason": "why this is better"}
  ],
  "powerWords": ["word1", "word2"],
  "tip": "one specific actionable tip"
}`,
          1024,
          0.5
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── Auto-Tagging ─────────────────────────────────────────────
      case "auto-tag": {
        const { title: tagTitle, content, category: tagCat } = params;
        const plainContent = (content || "").replace(/<[^>]+>/g, "").slice(0, 2000);
        const result = await gemini(
          `Analyze this news article and suggest relevant tags and the best category.

Title: ${tagTitle}
Category (current): ${tagCat || "none"}
Content excerpt: ${plainContent}

Return ONLY valid JSON:
{
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedCategory": "best category from: India, World, IR, Politics, Geopolitics, Economy, Markets, Sports, Tech, Defence, Culture, Opinion, Cities, West Asia, Viral, Ancient India",
  "categoryConfidence": <0-100>,
  "topics": ["main topic 1", "main topic 2"],
  "entities": ["person/org/place mentioned 1", "person/org/place 2"]
}`,
          512,
          0.3
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── Content Quality Score ────────────────────────────────────
      case "quality-score": {
        const { title: qTitle, content: qContent } = params;
        const plainText = (qContent || "").replace(/<[^>]+>/g, "").slice(0, 3000);
        const result = await gemini(
          `You are a senior news editor. Evaluate this article draft for quality. Be strict but constructive.

Title: ${qTitle}
Content: ${plainText}

Return ONLY valid JSON:
{
  "overallScore": <1-100>,
  "grades": {
    "accuracy": { "score": <1-10>, "note": "brief note" },
    "readability": { "score": <1-10>, "note": "brief note" },
    "structure": { "score": <1-10>, "note": "brief note" },
    "engagement": { "score": <1-10>, "note": "brief note" },
    "bias": { "score": <1-10>, "note": "1=very biased, 10=neutral" },
    "completeness": { "score": <1-10>, "note": "brief note" }
  },
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "readingLevel": "easy|moderate|advanced",
  "wordCount": <approximate>,
  "verdict": "one-line editorial verdict"
}`,
          1024,
          0.3
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── SEO Recommendations ──────────────────────────────────────
      case "seo-recommend": {
        const { title: sTitle, content: sContent, tags: sTags } = params;
        const plainText = (sContent || "").replace(/<[^>]+>/g, "").slice(0, 2000);
        const result = await gemini(
          `You are an SEO specialist for an Indian news website (loktantravani.in). Analyze this article for SEO optimization.

Title: ${sTitle}
Current tags: ${(sTags || []).join(", ")}
Content excerpt: ${plainText}

Return ONLY valid JSON:
{
  "seoScore": <1-100>,
  "metaDescription": "optimal meta description under 155 chars",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "titleSuggestion": "SEO-optimized title if current is weak, or null",
  "issues": [
    {"severity": "high|medium|low", "issue": "description", "fix": "how to fix"}
  ],
  "internalLinks": ["suggested related topic to link to"],
  "structuredDataTips": ["tip for better Google News visibility"],
  "estimatedSearchVolume": "low|medium|high"
}`,
          1024,
          0.3
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── Fact Check ───────────────────────────────────────────────
      case "fact-check": {
        const { title: fTitle, content: fContent } = params;
        const plainText = (fContent || "").replace(/<[^>]+>/g, "").slice(0, 3000);
        const result = await gemini(
          `You are a fact-checking editor. Review this news article for potential factual issues, unverified claims, and potential misinformation. Be thorough but fair.

Title: ${fTitle}
Content: ${plainText}

Return ONLY valid JSON:
{
  "riskLevel": "low|medium|high",
  "overallAssessment": "one paragraph assessment",
  "claims": [
    {
      "claim": "the specific claim made",
      "status": "verified|unverified|questionable|needs-source",
      "note": "why this status",
      "suggestion": "what to do about it"
    }
  ],
  "missingContext": ["important context that should be added"],
  "potentialBias": "assessment of editorial bias if any",
  "recommendation": "publish|revise|hold for verification"
}`,
          1500,
          0.2
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── Image Captioning ────────────────────────────────────────
      case "caption-image": {
        const { imageUrl, title: cTitle, category: cCat } = params;
        const result = await gemini(
          `Generate captions for a news article image.

Article title: ${cTitle || "News article"}
Category: ${cCat || "General"}
Image URL: ${imageUrl}

Since you cannot see the image, generate appropriate captions based on the article context.

Return ONLY valid JSON:
{
  "altText": "descriptive alt text for accessibility (under 125 chars)",
  "caption": "photo caption in journalistic style (under 200 chars)",
  "captionHi": "same caption in Hindi",
  "credit": "suggested credit format: Photo: Source/Agency"
}`,
          512,
          0.4
        );
        return NextResponse.json(parseJSON(result));
      }

      // ─── Writing Assistant ────────────────────────────────────────
      case "writing-assist": {
        const { text, instruction, context } = params;
        const result = await gemini(
          `You are a professional news writing assistant for LoktantraVani, an Indian digital newspaper. Help the editor with their request.

${context ? `Article context: ${context.slice(0, 1000)}` : ""}

Editor's current text:
"""
${text || "(empty)"}
"""

Editor's instruction: ${instruction}

Respond with ONLY the improved/generated text. No explanations, no markdown formatting, just the raw text/HTML that should replace or follow the current text. Use <p>, <h2>, <blockquote> tags for structure if writing paragraphs.`,
          2000,
          0.6
        );
        return NextResponse.json({ result: result.trim() });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("AI tools error:", err);
    const message = err instanceof Error ? err.message : "AI tool failed";
    // If JSON parse failed, return raw text
    if (message.includes("JSON")) {
      return NextResponse.json({ error: "AI returned invalid format. Please try again." }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
