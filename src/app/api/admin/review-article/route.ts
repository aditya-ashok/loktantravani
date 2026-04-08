/**
 * POST /api/admin/review-article
 * AI Review Agent — reviews article for:
 * 1. Factual accuracy (cross-checks claims)
 * 2. Data verification (checks numbers, dates, stats)
 * 3. Hate speech / communal content detection
 * 4. Bias detection
 * 5. Grammar & readability score
 * 6. Overall verdict: APPROVED / NEEDS_EDIT / REJECTED
 *
 * Body: { id: string } — Firestore post ID
 * OR: { content: string, title: string } — inline review
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 120;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

async function geminiReview(prompt: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 3000 },
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const body = await req.json();
    let title = body.title || "";
    let content = body.content || "";
    let postId = body.id || null;
    let category = body.category || "";
    let author = body.author || "";

    let imageUrl = body.imageUrl || "";

    // If ID provided, fetch from Firestore
    if (postId && !content) {
      const post = await getDoc(`posts/${postId}`);
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      title = (post.title as string) || "";
      content = (post.content as string) || "";
      category = (post.category as string) || "";
      author = (post.author as string) || "";
      imageUrl = (post.imageUrl as string) || "";
    }

    if (!content) return NextResponse.json({ error: "No content to review" }, { status: 400 });

    const plainText = stripHtml(content);
    const wordCount = plainText.split(/\s+/).length;

    // ── AI Review Prompt ──
    const reviewPrompt = `You are an AI Editorial Review Agent for LoktantraVani, India's premier digital newspaper. You must review this article with the highest journalistic standards.

ARTICLE TO REVIEW:
Title: "${title}"
Category: ${category}
Author: ${author}
Word Count: ${wordCount}
Content:
${plainText.slice(0, 6000)}

REVIEW CHECKLIST — evaluate EACH of the following:

1. FACTUAL ACCURACY (score 1-10):
   - Search Google to verify the KEY CLAIMS in this article
   - Are dates, names, places, statistics correct?
   - Are there any fabricated quotes or invented expert names?
   - List any claims that could NOT be verified

2. DATA VERIFICATION (score 1-10):
   - Are numbers, percentages, statistics cited correctly?
   - Are financial figures, GDP numbers, population stats plausible?
   - Are dates and timelines accurate?

3. HATE SPEECH & COMMUNAL CHECK (PASS/FAIL):
   - Does article contain hate speech against any religion, caste, ethnicity, gender?
   - Does it incite violence or communal tension?
   - Does it use derogatory language about any group?
   - Is language respectful even when critical?

4. BIAS DETECTION (score 1-10, where 10 = perfectly neutral):
   - Is the article one-sided or balanced?
   - Does it present multiple perspectives?
   - Are claims attributed properly?
   - Note: Opinion pieces are expected to have a viewpoint — judge accordingly

5. GRAMMAR & READABILITY (score 1-10):
   - Grammar correctness
   - Sentence structure and flow
   - Professional tone
   - Readability for general audience

6. HALLUCINATION CHECK (PASS/FAIL):
   - Does article contain "Dr. Sharma said" or similar fabricated quotes?
   - Are there made-up organization names?
   - Are there claims that seem implausible or unverifiable?

7. OVERALL VERDICT:
   - APPROVED: All checks pass, ready for admin approval
   - NEEDS_EDIT: Minor issues found, list specific fixes needed
   - REJECTED: Major factual errors, hate speech, or fabricated content

Return ONLY valid JSON:
{
  "factualAccuracy": { "score": 8, "issues": ["list any factual issues found"], "verified": ["list verified claims"] },
  "dataVerification": { "score": 9, "issues": ["list data issues"] },
  "hateSpeech": { "pass": true, "flags": ["any flagged content"] },
  "biasDetection": { "score": 7, "notes": "brief bias analysis" },
  "grammar": { "score": 8, "issues": ["grammar issues"] },
  "hallucination": { "pass": true, "flags": ["any hallucinated content"] },
  "overallScore": 82,
  "verdict": "APPROVED",
  "summary": "2-3 sentence review summary",
  "suggestedEdits": ["specific edit 1", "specific edit 2"],
  "readyForApproval": true
}`;

    const raw = await geminiReview(reviewPrompt);
    const review = parseJSON(raw);

    if (!review) {
      return NextResponse.json({
        error: "Failed to parse review",
        rawReview: raw.slice(0, 500),
      }, { status: 500 });
    }

    // Calculate overall
    const factScore = (review.factualAccuracy as { score: number })?.score || 0;
    const dataScore = (review.dataVerification as { score: number })?.score || 0;
    const hateSpeechPass = (review.hateSpeech as { pass: boolean })?.pass !== false;
    const biasScore = (review.biasDetection as { score: number })?.score || 0;
    const grammarScore = (review.grammar as { score: number })?.score || 0;
    const hallucinationPass = (review.hallucination as { pass: boolean })?.pass !== false;

    const avgScore = Math.round((factScore + dataScore + biasScore + grammarScore) / 4 * 10);
    const isApproved = avgScore >= 60 && hateSpeechPass && hallucinationPass;
    const isRejected = !hateSpeechPass || !hallucinationPass || avgScore < 40;

    const verdict = isRejected ? "REJECTED" : isApproved ? "APPROVED" : "NEEDS_EDIT";

    // ── Image Review (if image URL exists) ──
    let imageReview: Record<string, unknown> = { checked: false };
    if (imageUrl && !imageUrl.includes("unsplash.com")) {
      try {
        const key = GEMINI_KEY();
        const imgReviewUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        const imgRes = await fetch(imgReviewUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `You are a newspaper image editor. Review this article thumbnail image for a news article titled "${title}" in the ${category} section.\n\nCheck:\n1. RELEVANCE (1-10): Does the image match the article topic?\n2. QUALITY (1-10): Is it professional, well-composed?\n3. APPROPRIATENESS (PASS/FAIL): Is it appropriate for a family newspaper? No violence, nudity, offensive content?\n4. ACCURACY: Does the image show the correct people/places mentioned in the article? (e.g., if article is about Modi, does image show Modi and not someone else?)\n5. AI_ARTIFACTS: Does the image have obvious AI artifacts (extra fingers, distorted faces, text gibberish)?\n\nReturn ONLY JSON:\n{"relevance":8,"quality":7,"appropriate":true,"accuracy":"brief note","aiArtifacts":false,"verdict":"GOOD","notes":"brief summary"}` },
                { fileData: { mimeType: "image/jpeg", fileUri: imageUrl } }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
          }),
        });
        const imgData = await imgRes.json();
        const imgText = imgData.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
        const imgParsed = parseJSON(imgText);
        if (imgParsed) {
          imageReview = { checked: true, ...imgParsed };
        }
      } catch { imageReview = { checked: false, error: "Image review failed" }; }
    }

    const reviewResult = {
      ...review,
      imageReview,
      overallScore: avgScore,
      verdict,
      readyForApproval: isApproved,
      reviewedAt: new Date().toISOString(),
      reviewedBy: "AI Review Agent (Gemini + Google Search)",
      wordCount,
    };

    // Save review to Firestore if post ID provided
    if (postId) {
      await setDoc(`posts/${postId}`, {
        aiReview: JSON.stringify(reviewResult),
        aiReviewScore: avgScore,
        aiReviewVerdict: verdict,
        aiReviewedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, review: reviewResult });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
