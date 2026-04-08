/**
 * POST /api/social-post
 * Auto-post articles to X (Twitter), Facebook, and WhatsApp
 *
 * Environment Variables needed:
 * - TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 * - FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID
 * - WHATSAPP_API_TOKEN, WHATSAPP_PHONE_ID (Meta Business API)
 *
 * Usage: Called after article is published (from agent-generate or admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 60;

interface PostData {
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  category: string;
  hashtags?: string[];
}

// ── X (Twitter) Auto-Post ──────────────────────────────────
async function postToTwitter(data: PostData): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !accessToken) {
    return { success: false, error: "Twitter API credentials not configured" };
  }

  try {
    // Build tweet text
    const hashtags = data.hashtags?.length
      ? data.hashtags.map(t => `#${t.replace(/\s+/g, "")}`).join(" ")
      : `#${data.category.replace(/\s+/g, "")} #LoktantraVani #India`;

    const tweetText = `${data.title}\n\n${data.summary.slice(0, 180)}...\n\n${hashtags}\n\n${data.url}`;

    // OAuth 1.0a signing
    const { createHmac, randomBytes } = await import("crypto");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(16).toString("hex");

    const params: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    const baseUrl = "https://api.twitter.com/2/tweets";
    const paramString = Object.keys(params).sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join("&");
    const signatureBase = `POST&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(apiSecret!)}&${encodeURIComponent(accessSecret!)}`;
    const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

    const authHeader = `OAuth ${Object.entries({ ...params, oauth_signature: signature })
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")}`;

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ text: tweetText.slice(0, 280) }),
    });

    if (res.ok) {
      const result = await res.json();
      return { success: true, id: result.data?.id };
    }
    const errText = await res.text();
    return { success: false, error: `Twitter ${res.status}: ${errText.slice(0, 200)}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Facebook Page Auto-Post ────────────────────────────────
async function postToFacebook(data: PostData): Promise<{ success: boolean; id?: string; error?: string }> {
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageToken || !pageId) {
    return { success: false, error: "Facebook Page credentials not configured" };
  }

  try {
    const message = `${data.title}\n\n${data.summary}\n\n#LoktantraVani #India #${data.category.replace(/\s+/g, "")}`;

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        link: data.url,
        access_token: pageToken,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      return { success: true, id: result.id };
    }
    const errText = await res.text();
    return { success: false, error: `Facebook ${res.status}: ${errText.slice(0, 200)}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── WhatsApp Business API Auto-Post ────────────────────────
async function postToWhatsApp(data: PostData): Promise<{ success: boolean; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  // Comma-separated group/channel IDs or phone numbers
  const recipients = (process.env.WHATSAPP_RECIPIENTS || "").split(",").filter(Boolean);

  if (!token || !phoneId || recipients.length === 0) {
    return { success: false, error: "WhatsApp API credentials not configured" };
  }

  try {
    let sent = 0;
    for (const to of recipients) {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.trim(),
          type: "template",
          template: {
            name: "news_update",
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [{ type: "image", image: { link: data.imageUrl } }],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: data.title },
                  { type: "text", text: data.summary.slice(0, 200) },
                  { type: "text", text: data.url },
                ],
              },
            ],
          },
        }),
      });
      if (res.ok) sent++;
    }
    return { success: sent > 0, error: sent === 0 ? "No messages sent" : undefined };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Main endpoint ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  const body = await req.json();
  const {
    title, summary, url, imageUrl, category,
    hashtags = [],
    platforms = ["twitter", "facebook", "whatsapp"],
  } = body as PostData & { platforms?: string[] };

  if (!title || !url) {
    return NextResponse.json({ error: "title and url required" }, { status: 400 });
  }

  const data: PostData = { title, summary, url, imageUrl, category, hashtags };
  const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

  // Post to all requested platforms in parallel
  const promises: Promise<void>[] = [];

  if (platforms.includes("twitter")) {
    promises.push(postToTwitter(data).then(r => { results.twitter = r; }));
  }
  if (platforms.includes("facebook")) {
    promises.push(postToFacebook(data).then(r => { results.facebook = r; }));
  }
  if (platforms.includes("whatsapp")) {
    promises.push(postToWhatsApp(data).then(r => { results.whatsapp = r; }));
  }

  await Promise.all(promises);

  return NextResponse.json({
    success: Object.values(results).some(r => r.success),
    results,
  });
}
