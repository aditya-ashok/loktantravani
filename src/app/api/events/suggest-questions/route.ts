/**
 * POST /api/events/suggest-questions — AI helps a registrant turn a rough idea
 * into sharp questions for the event's guest.
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/groq";
import { getEvent } from "@/lib/events";

export const maxDuration = 30;

const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const requestLog = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < REQUEST_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (limited(ip)) return NextResponse.json({ error: "Please wait a minute and try again." }, { status: 429 });

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const event = getEvent(typeof body.event === "string" ? body.event : "");
  if (!event) return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  const idea = typeof body.idea === "string" ? body.idea.trim().slice(0, 400) : "";
  const language = body.language === "hi" ? "Hindi (Devanagari script)" : "English";

  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: `You help audience members of the LoktantraVani show "${event.title.en}" frame questions for the guest, ${event.guest} (${event.guestRole.en}). Write 3 distinct, specific, respectful questions (max 35 words each) about AI and public policy in India. Good questions are concrete, invite a substantive answer, and may be challenging. Never invent statistics or quotes. ${idea ? "Build on the reader's idea." : "Cover different themes."} Reply in ${language} as JSON: {"questions":["...","...","..."]}`,
        },
        { role: "user", content: idea || "Suggest questions." },
      ],
      { jsonMode: true, temperature: 0.8, maxTokens: 400 },
    );
    const questions = (JSON.parse(raw).questions as unknown[] || [])
      .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
      .slice(0, 3);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[events/suggest-questions]", error);
    return NextResponse.json({ error: "AI suggestions are unavailable right now." }, { status: 503 });
  }
}
