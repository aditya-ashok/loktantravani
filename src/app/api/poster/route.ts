/**
 * POST /api/poster  — Generate a BJP-style political poster using Gemini image generation
 * GET  /api/poster  — Get today's event suggestions via Gemini + Google Search grounding
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();

// ── Types ──

interface PosterRequest {
  type: "foundation-day" | "jayanti" | "event" | "achievement" | "custom";
  title: string;
  subtitle?: string;
  description?: string;
  authorName?: string;
  authorDesignation?: string;
  date?: string;
  style?: "saffron" | "tricolor" | "lotus" | "dark";
}

// ── Style mappings ──

function styleDirective(style: PosterRequest["style"]): string {
  switch (style) {
    case "tricolor":
      return "Indian tricolor theme with saffron (#FF9933), white, and green (#138808) gradients. Ashoka Chakra navy blue (#000080) accents.";
    case "lotus":
      return "Prominent lotus flower motif as the central design element. Saffron (#FF9933) and white palette with subtle gold highlights.";
    case "dark":
      return "Dark navy/black background with saffron (#FF9933) and gold accents. Elegant, premium feel. Glowing lotus watermark.";
    case "saffron":
    default:
      return "Bold saffron (#FF9933) gradient background with white and gold accents. Warm, energetic tone.";
  }
}

// ── Build the image generation prompt ──

function buildPrompt(body: PosterRequest): string {
  // Imagen 4 is best at generating illustrations, NOT text/layouts.
  // Generate ONLY the central illustration — text overlay is done in the HTML preview.
  const sceneByType: Record<string, string> = {
    jayanti: `A dignified, realistic painted portrait illustration of an Indian historical leader or freedom fighter related to "${body.title}". The person is shown in traditional Indian attire, in a heroic dignified pose. Warm golden light with a soft halo glow behind them. Background has subtle Indian architectural elements like parliament, monuments. Oil painting style, rich warm colors, golden tones. No text.`,
    "foundation-day": `A grand patriotic Indian scene: a large saffron lotus flower blooming, Indian tricolor flags waving, crowds of supporters silhouetted against a golden sunset sky. Iconic Indian architecture (Parliament House, India Gate) in the background. Warm saffron and gold tones. Artistic painted style. No text.`,
    event: `A colorful modern 3D illustration for "${body.title}". Show relevant thematic symbols and icons (globe, stethoscope for health, books for education, tree for environment, etc). Clean, vibrant, cheerful design with light blue and white tones. Professional social media illustration style. No text.`,
    achievement: `A futuristic illustration of modern India's development: bullet trains, highways, solar panels, satellites, smart cities, digital infrastructure. Tricolor (saffron, white, green) color palette. Aspirational, progressive feel. Painted illustration style. No text.`,
    custom: `An artistic illustration related to "${body.title}". Indian cultural context, warm colors, professional quality. No text.`,
  };

  return sceneByType[body.type] || sceneByType.custom;
}

// ── POST: Generate poster image ──

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PosterRequest;

    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const key = GEMINI_KEY();
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const prompt = buildPrompt(body);

    // Use Imagen 4.0 (predict API)
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`;
    const res = await fetch(imagenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "3:4",
          personGeneration: "allow_adult",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Imagen 4 error:", errText);
      return NextResponse.json(
        { error: "Image generation failed: " + errText.slice(0, 200) },
        { status: 500 },
      );
    }

    const data = await res.json();
    const predictions = data.predictions as Array<{
      mimeType?: string;
      bytesBase64Encoded?: string;
    }> | undefined;

    if (!predictions?.[0]?.bytesBase64Encoded) {
      return NextResponse.json(
        { error: "No image generated — try a different prompt" },
        { status: 500 },
      );
    }

    const imageBase64 = predictions[0].bytesBase64Encoded;
    const mimeType = predictions[0].mimeType || "image/png";

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    return NextResponse.json({
      image: dataUrl,
      mimeType,
      text: undefined,
      meta: {
        type: body.type,
        title: body.title,
        subtitle: body.subtitle,
        description: body.description,
        style: body.style || "saffron",
      },
    });
  } catch (err) {
    console.error("Poster generation error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── GET: Today's event suggestions via Gemini + Google Search grounding ──

export async function GET() {
  try {
    const key = GEMINI_KEY();
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const todayIST = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const prompt = [
      `Today's date is ${todayIST}.`,
      `List all notable Indian political, national, and cultural events for today's date (any year).`,
      `Include: BJP/RSS foundation days, birth/death anniversaries of Indian leaders (PM, CM, freedom fighters),`,
      `national days, Hindu/Sikh/Buddhist/Jain festivals falling on this date this year, and any major government achievements announced today.`,
      ``,
      `Return ONLY valid JSON (no markdown fences) in this exact format:`,
      `{"events":[{"title":"...","subtitle":"...","description":"...","type":"foundation-day|jayanti|event|achievement"}]}`,
      ``,
      `type must be one of: "foundation-day", "jayanti", "event", "achievement".`,
      `Use "jayanti" for birth anniversaries, "foundation-day" for party/org founding, "event" for festivals/national days, "achievement" for government milestones.`,
      `Return at least 2 and at most 8 events. Be factually accurate.`,
    ].join("\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4000 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini search error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch today's events" },
        { status: 500 },
      );
    }

    const data = await res.json();
    const candidates = data.candidates as
      | Array<{ content: { parts: Array<{ text?: string }> } }>
      | undefined;
    const raw =
      candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";

    // Parse JSON from the response (strip markdown fences if present)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { events: [], raw },
        { status: 200 },
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        events: Array<{
          title: string;
          subtitle: string;
          description: string;
          type: string;
        }>;
      };
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ events: [], raw }, { status: 200 });
    }
  } catch (err) {
    console.error("Today's events error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
