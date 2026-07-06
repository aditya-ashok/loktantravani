/**
 * GET /api/newsletter-send?date=YYYY-MM-DD&force=true
 * Sends the daily "Vani Morning Brief" email to all active subscribers.
 *
 * Content comes from the AI edition plan (editions/{date}, composed by
 * /api/epaper-generate) plus the newest published stories. Sends once per
 * day — a marker doc (newsletter/{date}) prevents double sends unless
 * force=true. Triggered by Vercel cron at 02:00 UTC (07:30 IST).
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 300;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const RESEND_KEY = () => (process.env.RESEND_API_KEY || "").trim();
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://loktantravani.in").replace(/\/$/, "");
const MAX_RECIPIENTS = 500;

const str = (f: Record<string, any> | undefined, k: string) => f?.[k]?.stringValue || "";

async function fetchSubscribers(): Promise<{ email: string; name: string }[]> {
  const res = await fetch(`${BASE}/subscribers?pageSize=300`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set<string>();
  const subs: { email: string; name: string }[] = [];
  for (const doc of data.documents || []) {
    const f = doc.fields || {};
    const email = str(f, "email").toLowerCase().trim();
    const active = f.active && "booleanValue" in f.active ? f.active.booleanValue : true;
    if (!email || !email.includes("@") || !active || seen.has(email)) continue;
    seen.add(email);
    subs.push({ email, name: str(f, "name") });
  }
  return subs.slice(0, MAX_RECIPIENTS);
}

async function fetchEditionPlan(date: string): Promise<any | null> {
  try {
    const res = await fetch(`${BASE}/editions/${date}`, { cache: "no-store" });
    if (!res.ok) return null;
    const doc = await res.json();
    const planStr = doc.fields?.plan?.stringValue;
    return planStr ? JSON.parse(planStr) : null;
  } catch { return null; }
}

async function fetchTopStories(): Promise<{ title: string; summary: string; category: string; slug: string; imageUrl: string }[]> {
  const res = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "posts" }],
        where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: 100,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const results = await res.json();
  return (results || [])
    .filter((r: any) => r.document)
    .map((r: any) => {
      const f = r.document.fields || {};
      return {
        title: str(f, "title"), summary: str(f, "summary"), category: str(f, "category"),
        slug: str(f, "slug"), imageUrl: str(f, "imageUrl"),
        createdAt: str(f, "createdAt") || r.document.createTime || "",
        language: str(f, "language"),
      };
    })
    .filter((p: any) => p.language !== "hi" && p.title && p.slug)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);
}

function buildEmailHTML(dateFormatted: string, plan: any, stories: { title: string; summary: string; category: string; slug: string }[]): string {
  const orange = "#FF9933";
  const storyRow = (s: { title: string; summary: string; category: string; slug: string }) => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #e8e4dc;">
      <div style="font-size:10px;color:${orange};text-transform:uppercase;letter-spacing:2px;font-weight:bold;margin-bottom:3px;">${s.category}</div>
      <a href="${SITE}/blog/${s.slug}" style="font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#121212;text-decoration:none;line-height:1.3;">${s.title}</a>
      <div style="font-size:13px;color:#555;line-height:1.5;margin-top:4px;">${(s.summary || "").slice(0, 160)}</div>
    </td></tr>`;

  return `
  <div style="background:#f5f2ec;padding:24px 12px;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e0dcd2;">
    <div style="text-align:center;padding:26px 24px 18px;border-bottom:3px double #121212;">
      <div style="font-family:Georgia,serif;font-size:32px;font-weight:900;color:#121212;">Loktantra<span style="color:${orange};">Vani</span></div>
      <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:3px;margin-top:4px;">Vani Morning Brief · ${dateFormatted}</div>
    </div>
    <div style="padding:24px;">
      ${plan?.bannerHeadline ? `
        <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #e8e4dc;margin-bottom:16px;">
          <div style="font-family:Georgia,serif;font-size:24px;font-weight:900;line-height:1.15;color:#121212;">${plan.bannerHeadline}</div>
          ${plan.deck ? `<div style="font-size:13px;font-style:italic;color:#666;margin-top:6px;">${plan.deck}</div>` : ""}
        </div>` : ""}
      ${Array.isArray(plan?.atAGlance) && plan.atAGlance.length ? `
        <div style="background:#fbf9f4;border:2px solid #121212;padding:14px 16px;margin-bottom:18px;">
          <div style="font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2.5px;color:#c41e1e;margin-bottom:8px;">Today at a Glance</div>
          ${plan.atAGlance.map((g: string) => `<div style="font-size:13px;line-height:1.6;color:#333;">▸ ${g}</div>`).join("")}
        </div>` : ""}
      <table style="width:100%;border-collapse:collapse;">${stories.map(storyRow).join("")}</table>
      ${plan?.editorial?.body ? `
        <div style="border-top:3px double #121212;border-bottom:3px double #121212;padding:16px;margin-top:18px;background:#fdfcf9;">
          <div style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;color:#c41e1e;margin-bottom:4px;">✒ The LoktantraVani View</div>
          <div style="font-family:Georgia,serif;font-size:16px;font-weight:bold;margin-bottom:6px;">${plan.editorial.title || "Editorial"}</div>
          <div style="font-size:13px;line-height:1.6;color:#333;">${String(plan.editorial.body).split(/\n+/).map((p: string) => `<p style="margin:0 0 8px;">${p}</p>`).join("")}</div>
        </div>` : ""}
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE}/epaper" style="background:#121212;color:#ffffff;padding:13px 28px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-family:sans-serif;">Read Today's E-Paper →</a>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e0dcd2;text-align:center;">
      <div style="font-size:11px;color:#888;">LoktantraVani — लोकतंत्रवाणी · India's 1st AI Newspaper</div>
      <div style="font-size:10px;color:#aaa;margin-top:4px;">You receive this because you subscribed at loktantravani.in</div>
    </div>
  </div>
  </div>`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isCron) {
    const auth = await verifyAuth(req);
    if (!auth.authorized) return unauthorized(auth.error);
  }

  const key = RESEND_KEY();
  if (!key) {
    return NextResponse.json({ error: "RESEND_API_KEY not set — add it in Vercel env vars to enable newsletter sends" }, { status: 422 });
  }

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const force = req.nextUrl.searchParams.get("force") === "true";

  // Once-per-day guard
  if (!force) {
    try {
      const marker = await fetch(`${BASE}/newsletter/${date}`, { cache: "no-store" });
      if (marker.ok) {
        const doc = await marker.json();
        if (doc.fields?.sentAt) {
          return NextResponse.json({ skipped: true, reason: `Already sent for ${date}. Use ?force=true to resend.` });
        }
      }
    } catch { /* proceed */ }
  }

  const [subscribers, plan, stories] = await Promise.all([
    fetchSubscribers(),
    fetchEditionPlan(date),
    fetchTopStories(),
  ]);

  if (subscribers.length === 0) return NextResponse.json({ error: "No active subscribers found" }, { status: 422 });
  if (stories.length === 0) return NextResponse.json({ error: "No published stories to send" }, { status: 422 });

  const dateFormatted = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const html = buildEmailHTML(dateFormatted, plan, stories);
  const subject = plan?.bannerHeadline
    ? `☀️ ${plan.bannerHeadline} — Vani Morning Brief`
    : `☀️ Vani Morning Brief — ${dateFormatted}`;

  // Send via Resend batch endpoint (up to 100 emails per call, one per recipient)
  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < subscribers.length; i += 100) {
    const batch = subscribers.slice(i, i + 100).map(s => ({
      from: "LoktantraVani <noreply@loktantravani.com>",
      to: s.email,
      subject,
      html,
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(batch),
      });
      if (res.ok) {
        sent += batch.length;
      } else {
        errors.push(`Batch ${i / 100 + 1}: ${res.status} ${(await res.text()).slice(0, 150)}`);
      }
    } catch (e) {
      errors.push(`Batch ${i / 100 + 1}: ${String(e).slice(0, 100)}`);
    }
  }

  // Record the send
  try {
    await setDoc(`newsletter/${date}`, {
      sentAt: new Date().toISOString(),
      recipients: sent,
      subject,
      errors: errors.length,
    }, false);
  } catch { /* non-fatal */ }

  return NextResponse.json({
    success: sent > 0,
    date,
    subject,
    subscribers: subscribers.length,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
