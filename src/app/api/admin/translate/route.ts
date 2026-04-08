/**
 * POST /api/admin/translate
 * Translate/transliterate text to Hindi using Gemini
 */

import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

export async function POST(req: NextRequest) {
  try {
    const { text, field } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    const key = GEMINI_KEY();
    if (!key) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    const isName = field === "name";
    const prompt = isName
      ? `Transliterate the following person's name into Hindi Devanagari script. Do NOT translate the meaning — just write how it sounds in Hindi. Return ONLY the Hindi text, nothing else.\n\nName: ${text}`
      : `Translate the following ${field || "text"} into Hindi (Devanagari script). Keep it natural and professional. Return ONLY the Hindi translation, nothing else.\n\nText: ${text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await res.json();
    const hindi = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!hindi) return NextResponse.json({ error: "Translation failed" }, { status: 500 });

    return NextResponse.json({ hindi });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
