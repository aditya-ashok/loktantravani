/**
 * GET /api/image?prompt=...
 * Generates an AI image using Gemini Imagen and returns it as PNG.
 * Caches by prompt hash so same prompt = same image without re-generating.
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

// Simple in-memory cache (per serverless instance)
const imageCache = new Map<string, Buffer>();

function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get("prompt");
  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  const cacheKey = hashPrompt(prompt);

  // Check cache
  if (imageCache.has(cacheKey)) {
    return new NextResponse(new Uint8Array(imageCache.get(cacheKey)!), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const key = GEMINI_KEY();
  if (!key) {
    // Return a redirect to Unsplash as fallback
    return NextResponse.redirect(`https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800`);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt + " Bold newspaper editorial illustration style. No text overlay." }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      }),
    });

    const data = await res.json();
    const preds = data.predictions as Array<{ bytesBase64Encoded: string }> | undefined;

    if (preds?.[0]?.bytesBase64Encoded) {
      const buffer = Buffer.from(preds[0].bytesBase64Encoded, "base64");
      // Cache it
      if (imageCache.size > 100) imageCache.clear(); // prevent memory leak
      imageCache.set(cacheKey, buffer);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch {
    // fallback
  }

  // Fallback to Unsplash
  return NextResponse.redirect(`https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800`);
}
