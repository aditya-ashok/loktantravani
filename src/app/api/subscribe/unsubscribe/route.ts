/**
 * GET/POST /api/subscribe/unsubscribe?email=&token=
 * One-click unsubscribe from the daily brief. Token is an HMAC of the email
 * (see lib/unsub) so only newsletter links can deactivate a subscription.
 * POST supports RFC 8058 List-Unsubscribe=One-Click from mail clients.
 */
import { NextRequest, NextResponse } from "next/server";
import { queryByField, setDoc } from "@/lib/firestore-rest";
import { unsubToken } from "@/lib/unsub";

async function unsubscribe(email: string, token: string): Promise<{ ok: boolean; message: string }> {
  const clean = email.toLowerCase().trim();
  if (!clean || !clean.includes("@")) return { ok: false, message: "Invalid email." };
  if (token !== unsubToken(clean)) return { ok: false, message: "Invalid or expired unsubscribe link." };

  const docs = await queryByField("subscribers", "email", clean, 10);
  // Emails may have been stored with original casing — try that too
  const extra = clean !== email.trim() ? await queryByField("subscribers", "email", email.trim(), 10) : [];
  const all = [...docs, ...extra];
  if (all.length === 0) return { ok: true, message: "This email is not on the list." };

  for (const d of all) {
    await setDoc(`subscribers/${d.id}`, { active: false });
  }
  return { ok: true, message: "You have been unsubscribed from the Vani Morning Brief." };
}

function page(message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LoktantraVani</title></head>
<body style="font-family:Georgia,serif;background:#f5f2ec;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
<div style="background:#fff;border:1px solid #e0dcd2;padding:40px;max-width:420px;text-align:center;">
<div style="font-size:26px;font-weight:900;">Loktantra<span style="color:#FF9933;">Vani</span></div>
<p style="color:#444;line-height:1.6;margin:18px 0;">${message}</p>
<a href="https://loktantravani.in" style="font-size:12px;color:#c41e1e;">← Back to loktantravani.in</a>
</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  const res = await unsubscribe(email, token);
  return page(res.message);
}

// RFC 8058 one-click unsubscribe (mail clients POST to the List-Unsubscribe URL)
export async function POST(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const token = req.nextUrl.searchParams.get("token") || "";
  const res = await unsubscribe(email, token);
  return NextResponse.json({ success: res.ok, message: res.message });
}
