/**
 * GET  /api/admin/event-registrations?event=slug — list registrations
 * POST /api/admin/event-registrations             — AI brief: shortlist the best audience questions
 */

import { NextRequest, NextResponse } from "next/server";
import { queryByField } from "@/lib/firestore-rest";
import { verifyAdmin } from "@/lib/admin-auth";
import { decryptPii } from "@/lib/pii-crypto";
import { callGroq } from "@/lib/groq";
import { getEvent } from "@/lib/events";

export const maxDuration = 60;

const PII_FIELDS = ["name", "email", "phone", "organisation", "question", "questionRefined"];

async function loadRegistrations(slug: string) {
  const rows = await queryByField("event_registrations", "event", slug, 2000);
  return rows.map((r) => {
    const out: Record<string, unknown> = { ...r };
    for (const f of PII_FIELDS) out[f] = decryptPii(r[f]);
    return out;
  });
}

function denied() {
  return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return denied();

  const slug = req.nextUrl.searchParams.get("event") || "";
  if (!getEvent(slug)) return NextResponse.json({ error: "Unknown event." }, { status: 400 });

  const rows = await loadRegistrations(slug);
  rows.sort((a, b) => String(b.registeredAt || "").localeCompare(String(a.registeredAt || "")));
  return NextResponse.json({ registrations: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return denied();

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const event = getEvent(typeof body.event === "string" ? body.event : "");
  if (!event) return NextResponse.json({ error: "Unknown event." }, { status: 400 });

  const rows = await loadRegistrations(event.slug);
  const questions = rows
    .filter((r) => r.question && !r.questionFlagged)
    .map((r) => `- [${r.questionTheme || "Other"}] ${r.questionRefined || r.question} (${r.name}, ${r.city}, ${r.profession})`)
    .slice(0, 300)
    .join("\n");
  if (!questions) return NextResponse.json({ error: "No questions submitted yet." }, { status: 400 });

  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: `You are the producer of the LoktantraVani show "${event.title.en}" with ${event.guest} (${event.guestRole.en}). From the audience questions, prepare a brief as JSON: {"themes":[{"theme":"...","count":number,"summary":"one line on what the audience wants to know"}],"shortlist":[{"question":"merged/best phrasing","askedBy":"name, city","theme":"..."}],"note":"one line on audience mood"}. Shortlist the 10 best questions: diverse themes, substantive, mixing supportive and challenging ones fairly; merge near-duplicates. Keep each question's original language.`,
        },
        { role: "user", content: questions },
      ],
      { jsonMode: true, temperature: 0.3, maxTokens: 2500 },
    );
    return NextResponse.json({ brief: JSON.parse(raw) });
  } catch (error) {
    console.error("[admin/event-registrations] brief failed", error);
    return NextResponse.json({ error: "AI brief is unavailable right now." }, { status: 503 });
  }
}
