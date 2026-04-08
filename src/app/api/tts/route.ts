/**
 * POST /api/tts
 * Text-to-Speech using Gemini TTS API
 * Returns audio as base64 WAV
 * Body: { text: string, lang?: "en" | "hi" }
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { text, lang = "en" } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  // Trim to ~4000 chars to stay within limits
  const trimmedText = text.slice(0, 4000);

  // Use Gemini 2.5 Flash with audio output for TTS
  const voiceName = lang === "hi" ? "Puck" : "Kore"; // Indian-friendly voices

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Read this news article aloud in a professional Indian news anchor tone. Clear pronunciation, moderate pace, authoritative yet warm:\n\n${trimmedText}` }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              }
            }
          }
        },
      }),
    });

    const data = await response.json();

    // Extract audio from response
    const candidates = data.candidates as Array<{ content: { parts: Array<{ inlineData?: { mimeType: string; data: string } }> } }> | undefined;
    const audioPart = candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (audioPart?.inlineData) {
      return NextResponse.json({
        success: true,
        audio: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType || "audio/wav",
      });
    }

    // Fallback: Try regular Gemini with audio modality
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Read this text aloud naturally like an Indian news anchor:\n\n${trimmedText}` }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
      }),
    });

    const fallbackData = await fallbackRes.json();
    const fbCandidates = fallbackData.candidates as Array<{ content: { parts: Array<{ inlineData?: { mimeType: string; data: string } }> } }> | undefined;
    const fbAudio = fbCandidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (fbAudio?.inlineData) {
      return NextResponse.json({
        success: true,
        audio: fbAudio.inlineData.data,
        mimeType: fbAudio.inlineData.mimeType || "audio/wav",
      });
    }

    return NextResponse.json({ error: "TTS generation failed — no audio in response", fallback: "browser" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err), fallback: "browser" }, { status: 200 });
  }
}
