/**
 * POST /api/insta-carousel  { id: string, regenerate?: boolean }
 * Writes Gen-Z style Instagram carousel copy for an article:
 * hook slide → 4-5 point slides → CTA slide.
 * Cached on the post doc (instaCarousel field) so repeat opens are instant.
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 60;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const GROQ_KEY = () => (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();

export type CarouselData = {
  hook: string;
  hookSub: string;
  points: { emoji: string; title: string; text: string }[];
  cta: string;
  caption: string;
  hashtags: string[];
  coverImage?: string;
};

/** Gemini renders the cover art (square), uploaded to Storage. Best-effort. */
async function generateCoverArt(prompt: string, postId: string): Promise<string> {
  const key = GEMINI_KEY();
  if (!key) return "";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: `${prompt}. Bold Gen-Z editorial illustration for an Instagram news carousel: vibrant electric colors, thick outlines, flat modern cartoon style with subtle grain, dramatic composition, Indian context. Square format. NO text, NO words, NO letters in the image.` }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" },
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const parts = (data.candidates?.[0]?.content?.parts || []) as Array<{ inlineData?: { data: string } }>;
    const b64 = parts.find(pt => pt.inlineData?.data)?.inlineData?.data;
    if (!b64) return "";
    const buffer = Buffer.from(b64, "base64");
    const filename = `carousels/${postId}-${Date.now().toString(36)}.png`;
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

function parseJSON(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch { /* */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* */ }
    try { return JSON.parse(m[0].replace(/[\u0000-\u001F]+/g, " ")); } catch { /* */ }
  }
  return null;
}

async function writeCopy(system: string, user: string): Promise<string> {
  const gk = GROQ_KEY();
  if (gk) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${gk}` },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 2000, temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const t = data.choices?.[0]?.message?.content || "";
        if (t) return t;
      }
    } catch { /* fall through */ }
  }
  const ak = ANTHROPIC_KEY();
  if (ak) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ak, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 2000, system, messages: [{ role: "user", content: user }] }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content?.[0]?.text || "";
      }
    } catch { /* */ }
  }
  return "";
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  const { id: idIn, slug, regenerate } = await req.json();
  if (!idIn && !slug) return NextResponse.json({ error: "id or slug required" }, { status: 400 });

  // Resolve slug → id when needed (share surfaces only know the slug)
  let id = idIn as string;
  if (!id && slug) {
    const q = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          where: { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } } },
          limit: 1,
        },
      }),
      cache: "no-store",
    });
    if (q.ok) {
      const rows = await q.json();
      id = rows?.find((r: { document?: { name: string } }) => r.document)?.document?.name?.split("/").pop() || "";
    }
    if (!id) return NextResponse.json({ error: "Post not found for slug" }, { status: 404 });
  }

  // Fetch the post
  const res = await fetch(`${BASE}/posts/${id}`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  const doc = await res.json();
  const f = doc.fields || {};
  const sv = (k: string) => f[k]?.stringValue || "";

  // Cached?
  if (!regenerate && sv("instaCarousel")) {
    try {
      return NextResponse.json({ carousel: JSON.parse(sv("instaCarousel")), cached: true });
    } catch { /* regenerate */ }
  }

  const title = sv("title");
  const summary = sv("summary");
  const content = sv("content").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 2500);
  if (!title) return NextResponse.json({ error: "Post has no title" }, { status: 422 });

  const system = `You are LoktantraVani's Gen-Z social media editor. You turn news articles into Instagram carousel copy that Indian 18-25 year olds actually stop scrolling for. Voice: punchy, casual, confident, desi — light slang and emojis where natural (never forced, max 1 slang word per slide), zero cringe, zero fabrication. Facts stay exact. Return ONLY valid JSON.`;

  const user = `ARTICLE:
Title: ${title}
Summary: ${summary}
Body: ${content}

Write the carousel package. Return ONLY JSON:
{
  "hook": "cover slide hook — max 8 words, ALL the intrigue, no clickbait lies",
  "hookSub": "one-line sub for the cover, max 12 words",
  "points": [
    { "emoji": "one relevant emoji", "title": "punchy 3-5 word slide title", "text": "the point in max 25 words, Gen-Z casual but factual" }
  ],
  "cta": "last-slide line inviting follow/save, max 12 words",
  "imagePrompt": "vivid, specific scene for the cover illustration of THIS story — subjects, setting, mood, symbolic props. No text in image.",
  "caption": "Instagram caption: 2-3 casual sentences + line break + question to drive comments, max 80 words",
  "hashtags": ["8-10 relevant hashtags without #, mix of big and niche, include LoktantraVani"]
}
Rules: exactly 4 or 5 points. Every number/name from the article must stay accurate.`;

  const raw = await writeCopy(system, user);
  const parsed = raw ? parseJSON(raw) : null;
  if (!parsed || !parsed.hook || !Array.isArray(parsed.points) || parsed.points.length < 3) {
    return NextResponse.json({ error: "AI carousel generation failed — try again" }, { status: 502 });
  }

  // Groq wrote the scene; Gemini paints it (best-effort — slides fall back
  // to the article photo when image generation is unavailable)
  const coverImage = await generateCoverArt(
    String(parsed.imagePrompt || `${title} — dramatic news illustration`),
    id
  );

  const carousel: CarouselData = {
    coverImage,
    hook: String(parsed.hook),
    hookSub: String(parsed.hookSub || ""),
    points: (parsed.points as CarouselData["points"]).slice(0, 5).map(p => ({
      emoji: String(p.emoji || "📌").slice(0, 8),
      title: String(p.title || "").slice(0, 60),
      text: String(p.text || "").slice(0, 220),
    })),
    cta: String(parsed.cta || "Follow @loktantravani for daily news drops"),
    caption: String(parsed.caption || ""),
    hashtags: Array.isArray(parsed.hashtags) ? (parsed.hashtags as string[]).slice(0, 12).map(h => String(h).replace(/^#/, "")) : ["LoktantraVani", "IndiaNews"],
  };

  // Cache on the post (best-effort)
  try { await setDoc(`posts/${id}`, { instaCarousel: JSON.stringify(carousel) }); } catch { /* */ }

  return NextResponse.json({ carousel, cached: false });
}
