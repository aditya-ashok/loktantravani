/**
 * GET /api/cron-publish
 * Vercel Cron job — auto-generates and publishes articles every morning.
 * Triggered by Vercel cron at 5:30 AM IST (00:00 UTC) daily.
 *
 * Calls the agent-generate endpoint internally to produce articles
 * across all sections with auto-publish enabled.
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const ADMIN_KEY = () => (process.env.ADMIN_API_KEY || "").trim();

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "";
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = ["India", "World", "Politics", "Economy", "Sports", "Tech", "Defence", "West Asia", "Opinion"];
  const articlesPerSection = 2;

  try {
    // Build the internal URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : req.nextUrl.origin;

    const res = await fetch(`${baseUrl}/api/agent-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY(),
      },
      body: JSON.stringify({
        sections,
        articlesPerSection,
        wordCount: 1500,
        language: "en",
        author: "LoktantraVani AI",
        engine: "auto",
        autoPublish: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json({
        error: "Agent generate failed",
        status: res.status,
        detail: err.slice(0, 500),
      }, { status: 500 });
    }

    // Read the NDJSON stream to completion
    const text = await res.text();
    const lines = text.split("\n").filter(l => l.trim());
    let completed = 0;
    let errors = 0;
    const headlines: string[] = [];

    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === "article_saved") {
          completed++;
          if (msg.headline) headlines.push(msg.headline);
        }
        if (msg.type === "error") errors++;
        if (msg.type === "complete") {
          completed = msg.completed || completed;
          errors = msg.errors || errors;
        }
      } catch { /* skip */ }
    }

    return NextResponse.json({
      success: true,
      completed,
      errors,
      total: sections.length * articlesPerSection,
      headlines: headlines.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Cron failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
