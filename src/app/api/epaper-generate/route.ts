/**
 * GET /api/epaper-generate?date=YYYY-MM-DD
 * Composes the daily AI e-paper edition, TOI/IE style:
 *  1. Picks the freshest published articles and marks them inEpaper
 *  2. Claude (→ Groq → Gemini fallback) writes the front-page package:
 *     banner headline, deck, Today at a Glance, editorial, quote of the day,
 *     punchy print headlines for the top stories
 *  3. Saves the edition plan to editions/{date} — the epaper-pdf renderer
 *     picks it up to build the paper
 *
 * Triggered by Vercel cron daily at 01:30 UTC (07:00 IST) and available
 * to admins as a manual regenerate.
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 300;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const GROQ_KEY = () => (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();

type EditionArticle = { id: string; title: string; summary: string; category: string; createdAt: string };

async function callClaude(system: string, user: string): Promise<string> {
  const key = ANTHROPIC_KEY();
  if (!key) return "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 4000, system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch { return ""; }
}

async function callGroq(system: string, user: string): Promise<string> {
  const key = GROQ_KEY();
  if (!key) return "";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: GROQ_MODEL, max_tokens: 4000, temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch { return ""; }
}

async function callGemini(system: string, user: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) return "";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const candidates = data.candidates as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
    return candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  } catch { return ""; }
}

function parseJSON(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* */ }
    try { return JSON.parse(m[0].replace(/[\u0000-\u001F]+/g, " ")); } catch { /* */ }
  }
  return null;
}

export async function GET(req: NextRequest) {
  // Allow Vercel cron (CRON_SECRET) or admin/same-origin
  const authHeader = req.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isCron) {
    const auth = await verifyAuth(req);
    if (!auth.authorized) return unauthorized(auth.error);
  }

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];

  // ── 1. Fetch recent published articles ──
  const res = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "posts" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
              // Timestamp range also filters out legacy docs whose createdAt is
              // a string (Firestore types don't cross-match) — exactly the docs
              // a daily product never wants.
              { fieldFilter: { field: { fieldPath: "createdAt" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: new Date(new Date(date + "T23:59:59+05:30").getTime() - 72 * 3600 * 1000).toISOString() } } },
            ],
          },
        },
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: 150,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });

  const results = await res.json();
  const str = (f: Record<string, any>, k: string) => f?.[k]?.stringValue || "";
  const all: EditionArticle[] = (results || [])
    .filter((r: any) => r.document)
    .map((r: any) => ({
      id: r.document.name.split("/").pop(),
      title: str(r.document.fields, "title"),
      summary: str(r.document.fields, "summary"),
      category: str(r.document.fields, "category"),
      createdAt: str(r.document.fields, "createdAt") || r.document.createTime || "",
      language: str(r.document.fields, "language"),
    }))
    .filter((a: EditionArticle & { language: string }) => a.language !== "hi" && a.title)
    .sort((a: EditionArticle, b: EditionArticle) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Prefer the last 36 hours; if the day was slow, take the newest 12 anyway
  const cutoff = new Date(date + "T23:59:59+05:30").getTime() - 36 * 3600 * 1000;
  let selected = all.filter(a => new Date(a.createdAt).getTime() >= cutoff && new Date(a.createdAt).getTime() <= new Date(date + "T23:59:59+05:30").getTime());
  if (selected.length < 8) selected = all.slice(0, 12);
  selected = selected.slice(0, 30);

  if (selected.length === 0) return NextResponse.json({ error: "No published articles to compose an edition from" }, { status: 422 });

  // ── 2. Mark selected posts for the e-paper ──
  let marked = 0;
  await Promise.all(selected.map(async (a) => {
    try { await setDoc(`posts/${a.id}`, { inEpaper: true }); marked++; } catch { /* best-effort */ }
  }));

  // ── 3. AI composes the front-page package ──
  const system = `You are the Night Editor of LoktantraVani, a right-of-centre Indian daily in the tradition of The Times of India and The Indian Express. You compose tomorrow's front page. Confident, precise, patriotic tone — never hateful. Return ONLY valid JSON.`;
  const user = `Today's stories (index · category · headline · summary):
${selected.map((a, i) => `${i} · ${a.category} · ${a.title} · ${(a.summary || "").slice(0, 180)}`).join("\n")}

Compose the front-page package for the ${date} edition. Return ONLY JSON:
{
  "leadIndex": <index of the most important story — national impact first>,
  "bannerHeadline": "<punchy banner headline for the lead, max 10 words, print style, Title Case>",
  "deck": "<one-sentence subhead under the banner, max 25 words>",
  "atAGlance": ["<6 crisp one-line bullets summarising the day's biggest stories, max 15 words each>"],
  "editorial": {"title": "<editorial title, max 8 words>", "body": "<the paper's own editorial voice: 3 short paragraphs, 200-250 words total, plain text, no markdown, connecting today's biggest themes>"},
  "quoteOfDay": {"text": "<one striking real quote or data point from the summaries above>", "by": "<attribution>"},
  "printHeadlines": [{"index": <story index>, "headline": "<punchier print-style rewrite, max 9 words>"} for the top 10 stories]
}`;

  let raw = await callClaude(system, user);
  let engine = "claude";
  if (!raw) { raw = await callGroq(system, user); engine = "groq"; }
  if (!raw) { raw = await callGemini(system, user); engine = "gemini"; }
  const plan = raw ? parseJSON(raw) : null;

  if (!plan) {
    return NextResponse.json({ error: "AI edition composition failed on all providers", marked }, { status: 502 });
  }

  // Resolve indexes to article ids/titles so the renderer can match
  const leadIdx = typeof plan.leadIndex === "number" && selected[plan.leadIndex] ? plan.leadIndex : 0;
  const printHeadlines = Array.isArray(plan.printHeadlines)
    ? (plan.printHeadlines as Array<{ index: number; headline: string }>)
        .filter(h => h && typeof h.index === "number" && selected[h.index] && h.headline)
        .map(h => ({ title: selected[h.index].title, headline: h.headline }))
    : [];

  const edition = {
    leadTitle: selected[leadIdx].title,
    leadCategory: selected[leadIdx].category,
    bannerHeadline: (plan.bannerHeadline as string) || selected[leadIdx].title,
    deck: (plan.deck as string) || "",
    atAGlance: Array.isArray(plan.atAGlance) ? (plan.atAGlance as string[]).slice(0, 6) : [],
    editorial: plan.editorial || null,
    quoteOfDay: plan.quoteOfDay || null,
    printHeadlines,
  };

  // ── 4. Save edition (plan stored as JSON string — simple for REST round-trips) ──
  try {
    await setDoc(`editions/${date}`, {
      date,
      generatedAt: new Date().toISOString(),
      engine,
      articleCount: selected.length,
      plan: JSON.stringify(edition),
    }, false);
  } catch (e) {
    return NextResponse.json({ error: `Edition save failed: ${String(e).slice(0, 200)}`, marked }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    date,
    engine,
    articles: selected.length,
    markedInEpaper: marked,
    bannerHeadline: edition.bannerHeadline,
    lead: edition.leadTitle,
  });
}
