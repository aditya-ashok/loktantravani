/**
 * POST /api/subscribe
 * Saves subscriber email to Firestore and sends welcome email via Resend (if configured)
 * Body: { email: string, name?: string }
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Save to Firestore
    let saved = false;
    try {
      const { isFirebaseConfigured } = await import("@/lib/firebase");
      if (isFirebaseConfigured) {
        const { db } = await import("@/lib/firebase");
        const { collection, addDoc, Timestamp, query, where, getDocs } = await import("firebase/firestore");

        // Check if already subscribed
        const existing = await getDocs(query(collection(db, "subscribers"), where("email", "==", email)));
        if (!existing.empty) {
          return NextResponse.json({ success: true, message: "Already subscribed!" });
        }

        await addDoc(collection(db, "subscribers"), {
          email,
          name: name || "",
          subscribedAt: Timestamp.now(),
          active: true,
        });
        saved = true;
      }
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
            from: "LoktantraVani <noreply@loktantravani.com>",
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
                <a href="https://loktantravani.vercel.app" style="display: inline-block; background: #121212; color: white; padding: 12px 24px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 20px;">Read Today's Edition →</a>
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
