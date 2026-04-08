import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify Razorpay payment and activate premium subscription

export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    // Dev mode — auto-approve
    return NextResponse.json({ success: true, message: "Dev mode — payment auto-approved" });
  }

  // Verify signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  // Payment verified — store subscription in Firestore
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani";
    const now = new Date().toISOString();
    const expiresAt = planId === "annual"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const docId = `sub_${razorpay_payment_id}`;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions/${docId}`;

    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          paymentId: { stringValue: razorpay_payment_id },
          orderId: { stringValue: razorpay_order_id },
          planId: { stringValue: planId },
          status: { stringValue: "active" },
          createdAt: { stringValue: now },
          expiresAt: { stringValue: expiresAt },
        },
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Payment was verified even if Firestore write fails
    return NextResponse.json({ success: true, warning: "Payment verified but subscription record failed" });
  }
}
