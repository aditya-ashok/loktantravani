/**
 * POST /api/generate-image
 * Generate an AI image using Gemini Imagen → upload to Firebase Storage → return permanent URL.
 * The URL is stored in the post's imageUrl field — no regeneration needed.
 *
 * Body: { prompt: string, postId?: string }
 * Returns: { url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";

export const maxDuration = 60;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app";

async function generateImage(prompt: string): Promise<Buffer | null> {
  const key = GEMINI_KEY();
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: prompt + " Bold newspaper editorial illustration style. Square. No text." }],
      parameters: { sampleCount: 1, aspectRatio: "16:9" },
    }),
  });

  const data = await res.json();
  const preds = data.predictions as Array<{ bytesBase64Encoded: string }> | undefined;
  if (preds?.[0]?.bytesBase64Encoded) {
    return Buffer.from(preds[0].bytesBase64Encoded, "base64");
  }
  return null;
}

async function uploadToFirebaseStorage(buffer: Buffer, filename: string): Promise<string> {
  // Use Firebase Storage REST API to upload
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "image/png",
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload failed: ${err}`);
  }

  const data = await res.json();
  // Construct the public download URL
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`;
  return downloadUrl;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, postId } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // Generate image
    const buffer = await generateImage(prompt);
    if (!buffer) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    // Upload to Firebase Storage
    const filename = `articles/${postId || Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const url = await uploadToFirebaseStorage(buffer, filename);

    // If postId provided, update the post's imageUrl
    if (postId) {
      await setDoc(`posts/${postId}`, { imageUrl: url });
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
