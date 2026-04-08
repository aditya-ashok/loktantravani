/**
 * POST /api/generate-image/caricature
 * Generate an AI caricature using Gemini Imagen from a text prompt
 * Uploads result to Firebase Storage and returns the URL
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const key = GEMINI_KEY();
    if (!key) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Generate caricature with Gemini Imagen
    const fullPrompt = `${prompt}. Style: Bold editorial caricature illustration, vibrant colors, exaggerated features, satirical newspaper cartoon style, professional quality, no text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Imagen API error:", errText);
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    const data = await res.json();
    const preds = data.predictions as Array<{ bytesBase64Encoded: string }> | undefined;

    if (!preds?.[0]?.bytesBase64Encoded) {
      return NextResponse.json({ error: "No image generated — try a different prompt" }, { status: 500 });
    }

    // Upload to Firebase Storage
    const buffer = Buffer.from(preds[0].bytesBase64Encoded, "base64");
    const filename = `caricatures/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: new Uint8Array(buffer),
    });

    if (!uploadRes.ok) {
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(uploadData.name)}?alt=media&token=${uploadData.downloadTokens || ""}`;

    return NextResponse.json({ imageUrl: downloadUrl });
  } catch (err) {
    console.error("Caricature error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
