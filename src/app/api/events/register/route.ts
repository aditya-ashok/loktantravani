/**
 * POST /api/events/register — register a reader for a LoktantraVani event.
 *
 * AI step (Groq): the reader's question for the guest is cleaned up, tagged
 * with a theme and screened for abuse, so the team can shortlist audience
 * questions. Registration still succeeds if the AI is unavailable.
 * One registration per email per event (re-submitting updates it).
 * Personal fields are encrypted at rest (see lib/pii-crypto).
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/firestore-rest";
import { callGroq } from "@/lib/groq";
import { getEvent, PROFESSIONS, type LvEvent } from "@/lib/events";
import { assertPiiKey, encryptPii, piiHash } from "@/lib/pii-crypto";

export const maxDuration = 30;

const RESEND_KEY = () => (process.env.RESEND_API_KEY || "").trim();
const FROM = () => (process.env.RESEND_FROM || "LoktantraVani <noreply@loktantravani.in>").trim();

const REQUEST_WINDOW_MS = 10 * 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestLog = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < REQUEST_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

type AiReview = { refined: string; theme: string; flagged: boolean };

async function reviewQuestion(event: LvEvent, question: string): Promise<AiReview | null> {
  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: `You screen audience questions for a LoktantraVani show, "${event.title.en}", with guest ${event.guest} (${event.guestRole.en}). Reply as JSON: {"refined":"the question rewritten to be clear, concise (max 40 words) and respectful, in the SAME language as the original, keeping its meaning and edge — do not soften legitimate criticism","theme":one of ${JSON.stringify(event.themes)},"flagged":true only if it is abusive, hateful, a personal attack, spam, or unrelated to the show}`,
        },
        { role: "user", content: question },
      ],
      { jsonMode: true, temperature: 0.2, maxTokens: 300 },
    );
    const parsed = JSON.parse(raw) as Partial<AiReview>;
    return {
      refined: str(parsed.refined, 400) || question,
      theme: event.themes.includes(parsed.theme || "") ? parsed.theme! : "Other",
      flagged: parsed.flagged === true,
    };
  } catch (error) {
    console.error("[events/register] AI review failed", error);
    return null;
  }
}

async function sendConfirmation(event: LvEvent, to: string, name: string, hindi: boolean) {
  const key = RESEND_KEY();
  if (!key) return;
  const title = hindi ? event.title.hi : event.title.en;
  const when = event.date
    ? new Date(event.date).toLocaleString(hindi ? "hi-IN" : "en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" })
    : hindi ? "तिथि जल्द घोषित की जाएगी — हम आपको ईमेल करेंगे।" : "Date to be informed — we'll email you as soon as it's announced.";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: FROM(),
        to,
        subject: hindi ? `आपका पंजीकरण पक्का: ${title}` : `You're registered: ${title}`,
        html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#171717;">
          <h1 style="font-size:28px;margin:0 0 4px;">Loktantra<span style="color:#FF9933;">Vani</span></h1>
          <p style="font-size:13px;color:#666;margin:0 0 28px;">${hindi ? "भारत का पहला AI समाचार दैनिक" : "India's first AI news daily"}</p>
          <p style="font-size:16px;line-height:1.6;">${hindi ? "नमस्ते" : "Hi"} ${escapeHtml(name)},</p>
          <p style="font-size:16px;line-height:1.6;">${hindi ? "आप पंजीकृत हैं:" : "You're registered for"} <strong>${escapeHtml(title)}</strong> ${hindi ? "— अतिथि" : "with"} <strong>${escapeHtml(event.guest)}</strong>, ${escapeHtml(hindi ? event.guestRole.hi : event.guestRole.en)}.</p>
          ${event.panelists.length ? `<p style="font-size:16px;line-height:1.6;"><strong>${hindi ? "पैनलिस्ट:" : "Panelists:"}</strong> ${event.panelists.map((p) => `${escapeHtml(p.name)} (${escapeHtml(hindi ? p.bio.hi : p.bio.en)})`).join(", ")}</p>` : ""}
          <p style="font-size:16px;line-height:1.6;"><strong>${hindi ? "कब:" : "When:"}</strong> ${escapeHtml(when)}</p>
          <p style="font-size:13px;color:#666;margin-top:28px;">${hindi ? "आपको यह ईमेल इसलिए मिला क्योंकि आपने loktantravani.in पर पंजीकरण किया।" : "You received this because you registered on loktantravani.in."}</p>
        </div>`,
      }),
    });
  } catch (error) {
    console.error("[events/register] confirmation email failed", error);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field.
  if (str(body.website, 100)) return NextResponse.json({ ok: true });

  const event = getEvent(str(body.event, 80));
  if (!event || !event.open) return NextResponse.json({ error: "Registrations for this event are closed." }, { status: 400 });

  const name = str(body.name, 100);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 20).replace(/[^\d+]/g, "");
  const city = str(body.city, 80);
  const profession = PROFESSIONS.some((p) => p.en === body.profession) ? (body.profession as string) : "Other";
  const organisation = str(body.organisation, 120);
  const mode = body.mode === "online" ? "online" : "in-person";
  const question = str(body.question, 600);
  const hindi = body.language === "hi";

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (phone && !/^\+?\d{10,14}$/.test(phone)) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "Please enter your city." }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "Please agree to be contacted about the event." }, { status: 400 });

  try {
    assertPiiKey();
  } catch (error) {
    console.error("[events/register]", error);
    return NextResponse.json({ error: "Registrations are temporarily unavailable." }, { status: 503 });
  }

  const id = piiHash(`${event.slug}:${email}`);
  const path = `event_registrations/${id}`;

  const [existing, review] = await Promise.all([
    getDoc(path).catch(() => null),
    question ? reviewQuestion(event, question) : Promise.resolve(null),
  ]);

  try {
    await setDoc(path, {
      event: event.slug,
      name: encryptPii(name),
      email: encryptPii(email),
      phone: encryptPii(phone),
      city,
      profession,
      organisation: encryptPii(organisation),
      mode,
      language: hindi ? "hi" : "en",
      question: encryptPii(question),
      questionRefined: encryptPii(review?.refined || question),
      questionTheme: question ? review?.theme || "Other" : "",
      questionFlagged: review?.flagged || false,
      aiReviewed: !!review,
      consent: true,
      registeredAt: existing?.registeredAt ? new Date(existing.registeredAt as string) : new Date(),
    });
  } catch (error) {
    console.error("[events/register] save failed", error);
    return NextResponse.json({ error: "Could not save your registration. Please try again." }, { status: 503 });
  }

  if (!existing) await sendConfirmation(event, email, name, hindi);

  return NextResponse.json({
    ok: true,
    updated: !!existing,
    question: question ? { refined: review?.refined || question, theme: review?.theme || null, flagged: review?.flagged || false } : null,
  });
}
