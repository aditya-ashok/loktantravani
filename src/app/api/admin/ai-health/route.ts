/**
 * GET /api/admin/ai-health
 * Pings each AI provider with a minimal real request and reports key status.
 * Use this to confirm whether GEMINI_API_KEY / ANTHROPIC_API_KEY are valid.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 30;

type ProviderStatus = {
  configured: boolean;
  ok: boolean;
  status?: number;
  error?: string;
  sample?: string;
};

async function checkGemini(): Promise<ProviderStatus> {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return { configured: false, ok: false, error: "GEMINI_API_KEY env var not set" };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with the single word: OK" }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 10 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return { configured: true, ok: false, status: res.status, error: msg };
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    if (!text) {
      return { configured: true, ok: false, status: res.status, error: "Empty response from Gemini", sample: JSON.stringify(data).slice(0, 200) };
    }
    return { configured: true, ok: true, status: res.status, sample: text.slice(0, 60) };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkGeminiSearch(): Promise<ProviderStatus> {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return { configured: false, ok: false, error: "GEMINI_API_KEY env var not set" };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "What is today's date? Reply in one short sentence." }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0, maxOutputTokens: 100 },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return { configured: true, ok: false, status: res.status, error: msg };
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    if (!text) {
      return { configured: true, ok: false, status: res.status, error: "Empty response from Gemini Search", sample: JSON.stringify(data).slice(0, 200) };
    }
    return { configured: true, ok: true, status: res.status, sample: text.slice(0, 100) };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkGroq(): Promise<ProviderStatus> {
  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) return { configured: false, ok: false, error: "GROQ_API_KEY env var not set" };
  const model = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        temperature: 0,
        messages: [{ role: "user", content: "Reply with the single word: OK" }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return { configured: true, ok: false, status: res.status, error: msg };
    }
    const text = data.choices?.[0]?.message?.content || "";
    return { configured: true, ok: true, status: res.status, sample: `[${model}] ${text.slice(0, 50)}` };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkClaude(): Promise<ProviderStatus> {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return { configured: false, ok: false, error: "ANTHROPIC_API_KEY env var not set" };

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
        max_tokens: 10,
        messages: [{ role: "user", content: "Reply with the single word: OK" }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return { configured: true, ok: false, status: res.status, error: msg };
    }
    const text = data.content?.[0]?.text || "";
    return { configured: true, ok: true, status: res.status, sample: text.slice(0, 60) };
  } catch (err) {
    return { configured: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  const [gemini, geminiSearch, claude, groq] = await Promise.all([
    checkGemini(),
    checkGeminiSearch(),
    checkClaude(),
    checkGroq(),
  ]);

  const allOk = gemini.ok && geminiSearch.ok && claude.ok && groq.ok;
  const anyWriter = gemini.ok || claude.ok || groq.ok;
  // Topic discovery: prefer Gemini Search (real-time web), fall back to Groq (training-data topics)
  const anyTopicSource = geminiSearch.ok || groq.ok;
  const canGenerate = anyWriter && anyTopicSource;

  return NextResponse.json({
    ok: allOk,
    canGenerate,
    summary: canGenerate
      ? (allOk ? "All providers healthy" : "Generation will work — at least one writer + one topic source is up")
      : "Generation will fail — need at least one working writer (Claude/Groq/Gemini) AND one topic source (Gemini Search or Groq)",
    providers: {
      "claude (writing)": claude,
      "groq (writing + topic fallback)": groq,
      "gemini (writing)": gemini,
      "gemini search (live topic discovery)": geminiSearch,
    },
    timestamp: new Date().toISOString(),
  });
}
