/**
 * POST /api/write/notify
 * Send email to contributor on approve/reject via Resend
 */
import { NextRequest, NextResponse } from "next/server";

const RESEND_KEY = () => (process.env.RESEND_API_KEY || "").trim();

export async function POST(req: NextRequest) {
  try {
    const { type, email, name, title, slug, reason } = await req.json();
    if (!type || !email) {
      return NextResponse.json({ error: "type and email required" }, { status: 400 });
    }

    const key = RESEND_KEY();
    if (!key) {
      return NextResponse.json({ success: true, message: "Email not configured — skipped" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://loktantravani.vercel.app";
    const greeting = name ? `Dear ${name}` : "Dear Contributor";

    let subject: string;
    let html: string;

    if (type === "approved") {
      subject = `🎉 Published: "${title}" is now live on LoktantraVani!`;
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FF9933; padding: 16px 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">LoktantraVani</h1>
          </div>
          <div style="padding: 24px;">
            <p>${greeting},</p>
            <p>Great news! Your article <strong>"${title}"</strong> has been reviewed and approved by our editorial team.</p>
            <p>It is now <strong>live on LoktantraVani</strong> — India's 1st AI Newspaper.</p>
            <div style="margin: 24px 0;">
              <a href="${siteUrl}/blog/${slug}" style="background: #121212; color: white; padding: 12px 24px; text-decoration: none; font-family: sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                Read Your Article →
              </a>
            </div>
            <p>Thank you for contributing to LoktantraVani. We encourage you to write more and share your article on social media.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
            <p style="font-size: 12px; color: #727272;">LoktantraVani — लोकतंत्रवाणी | India's 1st AI Newspaper</p>
          </div>
        </div>`;
    } else {
      subject = `Update needed: "${title}" — LoktantraVani`;
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FF9933; padding: 16px 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">LoktantraVani</h1>
          </div>
          <div style="padding: 24px;">
            <p>${greeting},</p>
            <p>Thank you for submitting <strong>"${title}"</strong> to LoktantraVani.</p>
            <p>After editorial review, we'd like you to make some changes before we can publish it:</p>
            <div style="background: #f7f7f5; border-left: 4px solid #FF9933; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Editor's feedback:</strong></p>
              <p style="margin: 8px 0 0;">${reason || "Please revise and resubmit."}</p>
            </div>
            <div style="margin: 24px 0;">
              <a href="${siteUrl}/write/dashboard" style="background: #121212; color: white; padding: 12px 24px; text-decoration: none; font-family: sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                Edit & Resubmit →
              </a>
            </div>
            <p>We appreciate your effort and look forward to your revised article.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
            <p style="font-size: 12px; color: #727272;">LoktantraVani — लोकतंत्रवाणी | India's 1st AI Newspaper</p>
          </div>
        </div>`;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: "LoktantraVani <noreply@loktantravani.com>",
        to: email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Resend error:", err);
      return NextResponse.json({ success: true, emailSent: false, message: "Email failed but action completed" });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
