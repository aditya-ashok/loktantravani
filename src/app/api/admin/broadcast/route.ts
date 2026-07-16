/**
 * POST /api/admin/broadcast — one-click message to all active subscribers
 * Body: { subject: string, message: string }  (message: plain text or HTML)
 * Sends from the AI desk with per-recipient unsubscribe links, batched via Resend.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";
import { unsubToken } from "@/lib/unsub";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://loktantravani.in").replace(/\/$/, "");
const FROM = (process.env.RESEND_FROM_NEWSLETTER || "LoktantraVani AI <ai@loktantravani.in>").trim();

export const maxDuration = 300;

async function activeSubscribers(): Promise<string[]> {
  const res = await fetch(`${BASE}/subscribers?pageSize=300`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set<string>();
  for (const doc of data.documents || []) {
    const f = doc.fields || {};
    const email = (f.email?.stringValue || "").toLowerCase().trim();
    const active = f.active && "booleanValue" in f.active ? f.active.booleanValue : true;
    if (email && email.includes("@") && active) seen.add(email);
  }
  return [...seen].slice(0, 500);
}

function wrap(message: string): string {
  const body = /<[a-z][\s\S]*>/i.test(message)
    ? message
    : message.split(/\n{2,}/).map(p => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#333;">${p.replace(/\n/g, "<br/>")}</p>`).join("");
  return `
  <div style="background:#f5f2ec;padding:24px 12px;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e0dcd2;">
    <div style="text-align:center;padding:22px 24px 14px;border-bottom:3px double #121212;">
      <div style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:#121212;">Loktantra<span style="color:#FF9933;">Vani</span></div>
    </div>
    <div style="padding:24px;font-family:Georgia,serif;">${body}</div>
    <div style="padding:14px 24px;border-top:1px solid #e0dcd2;text-align:center;">
      <div style="font-size:11px;color:#888;">LoktantraVani — लोकतंत्रवाणी · India's 1st AI Newspaper</div>
      <div style="font-size:10px;color:#aaa;margin-top:4px;">You receive this because you subscribed at loktantravani.in · <a href="{{UNSUB_URL}}" style="color:#aaa;">Unsubscribe</a></div>
    </div>
  </div></div>`;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 422 });

  const { subject, message } = await req.json();
  if (!subject || !message) return NextResponse.json({ error: "subject and message required" }, { status: 400 });

  const emails = await activeSubscribers();
  if (emails.length === 0) return NextResponse.json({ error: "No active subscribers" }, { status: 422 });

  const html = wrap(String(message));
  const unsubUrl = (email: string) => `${SITE}/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;

  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map(email => ({
      from: FROM,
      to: email,
      subject: String(subject),
      html: html.replace("{{UNSUB_URL}}", unsubUrl(email)),
      headers: {
        "List-Unsubscribe": `<${unsubUrl(email)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
      else errors.push(`batch ${i / 100 + 1}: ${res.status} ${(await res.text()).slice(0, 120)}`);
    } catch (e) {
      errors.push(`batch ${i / 100 + 1}: ${String(e).slice(0, 80)}`);
    }
  }
  return NextResponse.json({ success: sent > 0, recipients: emails.length, sent, errors: errors.length ? errors : undefined });
}
