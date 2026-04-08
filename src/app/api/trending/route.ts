/**
 * GET /api/trending
 * Returns trending news topics using Gemini + Google Search
 */

import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return NextResponse.json({ topics: ["Budget 2026", "IPL 2026", "India-China Relations", "AI Regulation", "ISRO Mission", "Delhi Metro Phase 5", "UPI Global Expansion", "West Asia Crisis"] });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `List 12 trending Indian news topics RIGHT NOW (March 2026). Mix of politics, sports, tech, economy, defence, culture. Return ONLY a JSON array of short headline strings (max 8 words each). Example: ["IPL 2026 Auction Drama", "India GDP Growth Forecast"]. No explanation.` }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const topics = JSON.parse(match[0]) as string[];
      return NextResponse.json({ topics: topics.slice(0, 12) });
    }
  } catch { /* fallback */ }

  return NextResponse.json({ topics: ["Budget 2026", "IPL 2026", "India-China Border", "ISRO Gaganyaan", "Delhi Elections", "AI in India", "West Asia War", "UPI Global", "Cricket World Cup", "Semiconductor Push", "Defence Exports", "Smart Cities"] });
}

export async function POST() {
  return GET();
}
