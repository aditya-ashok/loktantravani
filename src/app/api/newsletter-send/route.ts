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
import { unsubToken } from "@/lib/unsub";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const RESEND_KEY = () => (process.env.RESEND_API_KEY || "").trim();
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://loktantravani.in").replace(/\/$/, "");
// The daily brief is written by the AI newsroom — it mails from its own desk.
const NEWSLETTER_FROM = (process.env.RESEND_FROM_NEWSLETTER || "LoktantraVani AI <ai@loktantravani.in>").trim();

const unsubUrl = (email: string) => `${SITE}/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;
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
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
              // Timestamp range also filters out legacy docs whose createdAt is
              // a string (Firestore types don't cross-match) — exactly the docs
              // a daily product never wants.
              { fieldFilter: { field: { fieldPath: "createdAt" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: new Date(Date.now() - 72 * 3600 * 1000).toISOString() } } },
            ],
          },
        },
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

function buildEmailHTML(dateFormatted: string, plan: any, stories: { title: string; summary: string; category: string; slug: string; imageUrl: string }[]): string {
  const SAFF = "#FF6A2C";
  const DARK = "#0C0C11";
  const clip = (s: string, n: number) => (s || "").slice(0, n);
  const [hero, ...rest] = stories;

  const heroBlock = hero ? `
    <a href="${SITE}/blog/${hero.slug}" style="text-decoration:none;color:inherit;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${DARK};border-radius:18px;overflow:hidden;margin-bottom:18px;">
        ${hero.imageUrl ? `<tr><td style="padding:0;line-height:0;"><img src="${hero.imageUrl}" width="560" alt="" style="display:block;width:100%;max-width:560px;height:auto;border-radius:18px 18px 0 0;" /></td></tr>` : ""}
        <tr><td style="padding:20px 22px;">
          <span style="display:inline-block;background:${SAFF};color:#ffffff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:5px 12px;border-radius:999px;">🔥 ${hero.category}</span>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:23px;font-weight:800;color:#ffffff;line-height:1.25;margin-top:12px;">${hero.title}</div>
          <div style="font-size:14px;color:#c9c9d2;line-height:1.55;margin-top:8px;">${clip(hero.summary, 150)}…</div>
          <div style="margin-top:14px;font-size:13px;font-weight:800;color:${SAFF};letter-spacing:1px;">READ THE STORY →</div>
        </td></tr>
      </table>
    </a>` : "";

  const storyCard = (s: { title: string; summary: string; category: string; slug: string; imageUrl: string }) => `
    <a href="${SITE}/blog/${s.slug}" style="text-decoration:none;color:inherit;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#ffffff;border:1px solid #eceae4;border-radius:14px;overflow:hidden;margin-bottom:12px;">
        <tr>
          ${s.imageUrl ? `<td width="92" valign="top" style="padding:0;line-height:0;"><img src="${s.imageUrl}" width="92" height="92" alt="" style="display:block;width:92px;height:92px;object-fit:cover;" /></td>` : ""}
          <td valign="top" style="padding:11px 14px;">
            <span style="font-size:10px;font-weight:800;color:${SAFF};text-transform:uppercase;letter-spacing:1px;">${s.category}</span>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:800;color:#121212;line-height:1.3;margin-top:3px;">${s.title}</div>
            <div style="font-size:12px;color:#70707a;line-height:1.45;margin-top:4px;">${clip(s.summary, 88)}…</div>
          </td>
        </tr>
      </table>
    </a>`;

  return `
  <div style="background:#f4f2ee;padding:20px 10px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="background:${DARK};border-radius:20px 20px 0 0;padding:24px 24px 20px;text-align:center;">
      <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;">Loktantra<span style="color:${SAFF};">Vani</span></div>
      <div style="font-size:12px;color:${SAFF};font-weight:800;letter-spacing:1px;margin-top:6px;">📲 YOUR DAILY DOWNLOAD</div>
      <div style="font-size:10px;color:#8a8a94;text-transform:uppercase;letter-spacing:2px;margin-top:6px;">${dateFormatted}</div>
    </td></tr>
    <tr><td style="background:#ffffff;padding:22px 20px 6px;">
      ${plan?.bannerHeadline ? `<div style="font-size:12px;font-weight:800;color:#c41e1e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">⚡ Today's Big One</div>` : ""}
      ${heroBlock}
      ${Array.isArray(plan?.atAGlance) && plan.atAGlance.length ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${SAFF};border-radius:16px;margin-bottom:18px;"><tr><td style="padding:16px 18px;">
          <div style="font-size:12px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">⚡ TL;DR — Today in 5</div>
          ${plan.atAGlance.slice(0, 6).map((g: string) => `<div style="font-size:13px;line-height:1.6;color:#ffffff;font-weight:600;">→ ${g}</div>`).join("")}
        </td></tr></table>` : ""}
      ${rest.length ? `<div style="font-size:12px;font-weight:800;color:#121212;text-transform:uppercase;letter-spacing:1.5px;margin:4px 0 12px;">📰 More Stories 👇</div>` : ""}
      ${rest.map(storyCard).join("")}
      ${plan?.editorial?.body ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${DARK};border-radius:16px;margin-top:6px;"><tr><td style="padding:18px 20px;">
          <div style="font-size:11px;font-weight:900;color:${SAFF};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">🎤 The Hot Take</div>
          <div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:6px;">${plan.editorial.title || "Editorial"}</div>
          <div style="font-size:13px;line-height:1.6;color:#c9c9d2;">${String(plan.editorial.body).split(/\n+/).slice(0, 2).map((p: string) => `<p style="margin:0 0 8px;">${p}</p>`).join("")}</div>
        </td></tr></table>` : ""}
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${SITE}" style="display:inline-block;background:${SAFF};color:#ffffff;padding:15px 34px;text-decoration:none;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;border-radius:999px;">Read More on LoktantraVani →</a>
      </div>
      <div style="text-align:center;font-size:11px;color:#a0a0a8;margin-bottom:6px;">100+ fresh stories daily · AI-written, human-checked</div>
    </td></tr>
    <tr><td style="background:#f4f2ee;border-radius:0 0 20px 20px;padding:18px 24px;text-align:center;">
      <div style="font-size:12px;color:#888;font-weight:700;">LoktantraVani · लोकतंत्रवाणी · India's 1st AI Newspaper</div>
      <div style="font-size:10px;color:#b4b4b4;margin-top:10px;">You get this because you subscribed at loktantravani.in<br/><a href="{{UNSUB_URL}}" style="color:#999;">Unsubscribe</a></div>
    </td></tr>
  </table>
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
  // ?test=someone@x.com sends only to that address and skips the daily marker
  const testTo = (req.nextUrl.searchParams.get("test") || "").toLowerCase().trim();

  // Once-per-day guard
  if (!force && !testTo) {
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

  const [fetchedSubs, plan, stories] = await Promise.all([
    testTo ? Promise.resolve([]) : fetchSubscribers(),
    fetchEditionPlan(date),
    fetchTopStories(),
  ]);
  const subscribers = testTo ? [{ email: testTo, name: "" }] : fetchedSubs;

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
      from: NEWSLETTER_FROM,
      to: s.email,
      subject,
      html: html.replace("{{UNSUB_URL}}", unsubUrl(s.email)),
      headers: {
        "List-Unsubscribe": `<${unsubUrl(s.email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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

  // Record the send (not for test mode)
  try {
    if (testTo) return NextResponse.json({ success: sent > 0, test: testTo, date, subject, sent, errors: errors.length ? errors : undefined });
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
