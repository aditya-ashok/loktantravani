/**
 * Caricature Bank — canonical caricature reference per public figure so
 * every AI-generated cartoon draws the same recognizable face.
 *
 * GET    → list bank entries
 * POST   → { name, nameHi?, description?, imageUrl? } — with no imageUrl,
 *          Gemini generates a portrait caricature; pass regenerate: true
 *          with an id to repaint an existing entry
 * DELETE → { id }
 */

import { NextRequest, NextResponse } from "next/server";
import { createDoc, setDoc, deleteDocRest } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 60;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();

async function generatePortrait(name: string, description: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) return "";
  const prompt = `Head-and-shoulders editorial caricature portrait of ${name}${description ? ` (${description})` : ""}, Indian public figure. Recognizable, respectful likeness with gently exaggerated features in the R.K. Laxman tradition — this portrait becomes the canonical reference for this person across a newspaper's cartoons. Warm colors, thick clean outlines, plain light background, facing slightly left. Square format. NO text in the image.`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const parts = (data.candidates?.[0]?.content?.parts || []) as Array<{ inlineData?: { data: string } }>;
    const b64 = parts.find(p => p.inlineData?.data)?.inlineData?.data;
    if (!b64) return "";
    const buffer = Buffer.from(b64, "base64");
    const filename = `caricature-bank/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}.png`;
    const up = await fetch(`https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: new Uint8Array(buffer),
    });
    if (!up.ok) return "";
    const upData = await up.json();
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(upData.name)}?alt=media&token=${upData.downloadTokens || ""}`;
  } catch { return ""; }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const res = await fetch(`${BASE}/caricatures?pageSize=100`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ caricatures: [] });
    const data = await res.json();
    const sv = (f: Record<string, { stringValue?: string }>, k: string) => f?.[k]?.stringValue || "";
    const caricatures = (data.documents || []).map((doc: { name: string; fields: Record<string, { stringValue?: string }> }) => ({
      id: doc.name.split("/").pop() || "",
      name: sv(doc.fields, "name"),
      nameHi: sv(doc.fields, "nameHi"),
      description: sv(doc.fields, "description"),
      imageUrl: sv(doc.fields, "imageUrl"),
    })).filter((c: { name: string }) => c.name);
    return NextResponse.json({ caricatures });
  } catch (e) {
    return NextResponse.json({ caricatures: [], error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id, name, nameHi, description, imageUrl, regenerate } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    let finalImage = imageUrl || "";
    if (!finalImage || regenerate) {
      finalImage = await generatePortrait(name, description || "");
      if (!finalImage) return NextResponse.json({ error: "Portrait generation failed — try again or upload an image" }, { status: 502 });
    }

    const payload = { name, nameHi: nameHi || "", description: description || "", imageUrl: finalImage };
    if (id) {
      await setDoc(`caricatures/${id}`, payload);
      return NextResponse.json({ success: true, id, imageUrl: finalImage });
    }
    const newId = await createDoc("caricatures", payload);
    return NextResponse.json({ success: true, id: newId, imageUrl: finalImage });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteDocRest(`caricatures/${id}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
