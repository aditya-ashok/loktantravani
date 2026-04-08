/**
 * GET  /api/modi-scorecard  → return cached scorecard from Firestore
 * POST /api/modi-scorecard  → refresh scorecard via Gemini + Google Search, save to Firestore
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc, getDoc } from "@/lib/firestore-rest";

export const maxDuration = 120;

/* ── Types ── */

interface SchemeData {
  name: string;
  description: string;
  beneficiaries: string;
  achievement: string;
  growth: string;
  lastUpdated: string;
  source: string;
  icon: string;
}

interface ScorecardDoc {
  schemes: SchemeData[];
  generatedAt: string;
}

/* ── Gemini with Google Search grounding ── */

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

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
      generationConfig: { temperature: 0.2, maxOutputTokens: 8000 },
    }),
  });

  const data = await res.json();
  const candidates = data.candidates as
    | Array<{ content: { parts: Array<{ text?: string }> } }>
    | undefined;
  return (
    candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("") || ""
  );
}

/* ── Schemes to track ── */

const SCHEMES: { name: string; icon: string; searchHint: string }[] = [
  { name: "Ayushman Bharat", icon: "🏥", searchHint: "beneficiaries count, empanelled hospitals" },
  { name: "PM Awas Yojana", icon: "🏠", searchHint: "houses sanctioned and built" },
  { name: "Ujjwala Yojana", icon: "🔥", searchHint: "LPG connections given" },
  { name: "Swachh Bharat Mission", icon: "🧹", searchHint: "toilets built, ODF status villages" },
  { name: "Jan Dhan Yojana", icon: "🏦", searchHint: "bank accounts opened, total deposits" },
  { name: "Digital India", icon: "📱", searchHint: "broadband connections, digital payments volume" },
  { name: "Make in India", icon: "🏭", searchHint: "FDI inflow, manufacturing sector growth" },
  { name: "Startup India", icon: "🚀", searchHint: "DPIIT recognised startups registered" },
  { name: "PM Kisan Samman Nidhi", icon: "🌾", searchHint: "farmers benefited, total amount disbursed" },
  { name: "Mudra Yojana", icon: "💰", searchHint: "loans sanctioned and disbursed amount" },
  { name: "Jal Jeevan Mission", icon: "💧", searchHint: "functional household tap connections" },
  { name: "Vande Bharat Express", icon: "🚄", searchHint: "total trains launched, routes" },
  { name: "National Highway Construction", icon: "🛣️", searchHint: "km built per year, total km added since 2014" },
  { name: "Defence Exports", icon: "🛡️", searchHint: "defence export value in crores, growth percentage" },
  { name: "UPI Transactions", icon: "📲", searchHint: "monthly transaction volume and value" },
];

/* ── Build prompt for Gemini ── */

function buildPrompt(): string {
  const schemeList = SCHEMES.map(
    (s, i) => `${i + 1}. ${s.name} — find: ${s.searchHint}`
  ).join("\n");

  return `You are a research assistant. Use Google Search to find the LATEST official numbers for each Indian government scheme listed below. Return ONLY a valid JSON array (no markdown, no explanation).

For each scheme return an object with these exact keys:
- "name": scheme name
- "description": one-line description (max 15 words)
- "beneficiaries": number of people/entities benefited (e.g. "50 Crore+")
- "achievement": the key metric achievement (e.g. "3 Crore houses built")
- "growth": growth since 2014 with arrow (e.g. "↑ 340% since 2014")
- "lastUpdated": the date of the data source (e.g. "March 2026")
- "source": source name (e.g. "PIB", "Ministry website", "NPCI")

Schemes:
${schemeList}

IMPORTANT:
- Use the most recent data available from official Indian government sources, PIB releases, ministry dashboards, or credible news.
- All numbers should be in Indian notation (Crore, Lakh).
- Return ONLY the JSON array — no markdown fences, no commentary.`;
}

/* ── Parse Gemini response into SchemeData[] ── */

function parseSchemes(raw: string): SchemeData[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed: Array<Record<string, string>> = JSON.parse(cleaned);

  return parsed.map((item, idx) => ({
    name: item.name || SCHEMES[idx]?.name || `Scheme ${idx + 1}`,
    description: item.description || "",
    beneficiaries: item.beneficiaries || "Data unavailable",
    achievement: item.achievement || "Data unavailable",
    growth: item.growth || "",
    lastUpdated: item.lastUpdated || new Date().toISOString().slice(0, 10),
    source: item.source || "Government of India",
    icon: SCHEMES.find((s) => s.name === item.name)?.icon || SCHEMES[idx]?.icon || "📊",
  }));
}

/* ── GET: return cached scorecard ── */

export async function GET() {
  try {
    const doc = await getDoc("scorecard/schemes");

    if (!doc) {
      return NextResponse.json(
        { error: "No scorecard data yet. POST to generate." },
        { status: 404 }
      );
    }

    return NextResponse.json(doc as unknown as ScorecardDoc);
  } catch (err) {
    console.error("GET /api/modi-scorecard error:", err);
    return NextResponse.json(
      { error: "Failed to fetch scorecard" },
      { status: 500 }
    );
  }
}

/* ── POST: refresh scorecard via Gemini + Google Search ── */

export async function POST(req: NextRequest) {
  try {
    // Optional: simple auth check via query param or header
    const authHeader = req.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey && authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = buildPrompt();
    const raw = await geminiSearch(prompt);

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 502 }
      );
    }

    const schemes = parseSchemes(raw);

    const scorecardDoc: ScorecardDoc = {
      schemes,
      generatedAt: new Date().toISOString(),
    };

    await setDoc("scorecard/schemes", scorecardDoc as unknown as Record<string, unknown>);

    return NextResponse.json({
      success: true,
      count: schemes.length,
      generatedAt: scorecardDoc.generatedAt,
      schemes,
    });
  } catch (err) {
    console.error("POST /api/modi-scorecard error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate scorecard", details: message },
      { status: 500 }
    );
  }
}
