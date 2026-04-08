import { NextRequest, NextResponse } from "next/server";

// Razorpay order creation
// Set these in your Vercel environment variables:
// RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

const PLANS: Record<string, { amount: number; name: string }> = {
  monthly: { amount: 9900, name: "Ultra Monthly" },        // ₹99 in paise
  annual: { amount: 79900, name: "Ultra Pro Annual" },     // ₹799 in paise
};

export async function POST(req: NextRequest) {
  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({
      error: "Razorpay not configured",
      // Return a mock order for development
      id: `order_dev_${Date.now()}`,
      amount: plan.amount,
      currency: "INR",
      razorpayKey: "rzp_test_placeholder",
    });
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: "INR",
        receipt: `loktantra_${planId}_${Date.now()}`,
        notes: { plan: planId },
      }),
    });

    const order = await res.json();
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: keyId,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
