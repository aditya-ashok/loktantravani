/**
 * POST /api/admin/generate-bio
 * Generate a professional journalist bio using Gemini (English + Hindi)
 */

import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

export async function POST(req: NextRequest) {
  try {
    const { name, designation, education, college, city, gender } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const key = GEMINI_KEY();
    if (!key) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const context = [
      `Name: ${name}`,
      designation && `Designation: ${designation}`,
      education && `Education: ${education}`,
      college && `College: ${college}`,
      city && `City: ${city}`,
      gender && `Gender: ${gender}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are writing a short professional bio for an Indian journalist/editor at LoktantraVani (India's digital newspaper).

${context}

Generate a compelling 2-3 sentence bio. Make it sound prestigious and professional. Include their role, expertise area, and a personal touch.

Return JSON only:
{
  "bio": "English bio here (2-3 sentences)",
  "bioHi": "Same bio in Hindi Devanagari (2-3 sentences)"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let parsed: { bio: string; bioHi: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, treat the whole response as English bio
      parsed = { bio: cleaned, bioHi: "" };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
