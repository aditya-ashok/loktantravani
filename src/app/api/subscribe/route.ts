/**
 * POST /api/subscribe
 * Saves subscriber email to Firestore and sends welcome email via Resend (if configured)
 * Body: { email: string, name?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { queryByField, createDoc, setDoc } from "@/lib/firestore-rest";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Save via Firestore REST — the web SDK's streaming transport is
    // unreliable in serverless, which silently dropped subscribers.
    let saved = false;
    try {
      const clean = String(email).toLowerCase().trim();
      const existing = await queryByField("subscribers", "email", clean, 1);
      if (existing.length > 0) {
        // Re-subscribing reactivates a previously unsubscribed address
        await setDoc(`subscribers/${existing[0].id}`, { active: true });
        return NextResponse.json({ success: true, saved: true, message: "Already subscribed!" });
      }
      await createDoc("subscribers", {
        email: clean,
        name: name || "",
        subscribedAt: new Date(),
        active: true,
      });
      saved = true;
    } catch (e) {
      console.warn("Firestore save failed:", e);
    }

    // Send welcome email via Resend (if API key is set)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: (process.env.RESEND_FROM_NEWSLETTER || "LoktantraVani AI <ai@loktantravani.in>").trim(),
            to: email,
            subject: "Welcome to LoktantraVani — India's 1st AI Newspaper",
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 28px; margin-bottom: 8px;">Loktantra<span style="color: #FF9933;">Vani</span></h1>
                <p style="color: #727272; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px;">India's 1st AI Newspaper</p>
                <hr style="border: 1px solid #dfdfdf; margin-bottom: 20px;" />
                <p style="font-size: 16px; line-height: 1.6;">Dear ${name || "Reader"},</p>
                <p style="font-size: 16px; line-height: 1.6;">Welcome to <strong>LoktantraVani</strong> — the voice of democratic India. You'll now receive our daily AI-curated digest with the stories that matter most.</p>
                <p style="font-size: 16px; line-height: 1.6;">Our AI reads hundreds of sources daily and delivers you the sharpest analysis on Politics, Geopolitics, Economy, Defence, Tech, and more.</p>
                <a href="https://loktantravani.in" style="display: inline-block; background: #121212; color: white; padding: 12px 24px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 20px;">Read Today's Edition →</a>
                <hr style="border: 1px solid #dfdfdf; margin: 30px 0;" />
                <p style="color: #727272; font-size: 12px;">LoktantraVani · Neo Bharat · Est. 2026</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      saved,
      message: "Subscribed successfully! Welcome to LoktantraVani.",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
