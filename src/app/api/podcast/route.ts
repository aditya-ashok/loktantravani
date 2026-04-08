/**
 * POST /api/podcast
 * Generate AI podcast episodes using ElevenLabs TTS
 *
 * Env vars: ELEVENLABS_API_KEY
 * Free tier: 10,000 chars/month
 *
 * Flow:
 * 1. Takes article title + content
 * 2. Claude/Gemini creates a podcast script (news anchor monologue)
 * 3. ElevenLabs converts script to professional audio
 * 4. Uploads audio to Firebase Storage
 * 5. Saves podcast episode to Firestore
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 120;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const ELEVENLABS_KEY = () => (process.env.ELEVENLABS_API_KEY || "").trim();
const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();

// ElevenLabs voice IDs — Indian English male voices work best for news
const VOICES = {
  male: "pNInz6obpgDQGcFmaJgB",     // Adam — deep professional
  female: "21m00Tcm4TlvDq8ikWAM",    // Rachel — professional female
  indian: "ErXwobaYiN019PkySvjV",    // Antoni — clear professional
};

// ── Generate podcast script from article ──
async function generateScript(title: string, content: string, category: string): Promise<string> {
  const cleanContent = content.replace(/<[^>]*>/g, "").slice(0, 3000);

  const systemPrompt = `You are a professional Indian news anchor for LoktantraVani, India's premier AI-powered newspaper. You deliver news with confidence, authority, and a clear pro-India nationalist perspective.

STYLE:
- Professional, authoritative tone like Republic TV or Times Now anchors
- Start with: "Namaste and welcome to LoktantraVani News. I'm your AI anchor."
- Present facts with conviction
- Highlight government achievements and development data
- When covering opposition, present factual counter-narratives
- End with: "Stay informed, stay patriotic. This is LoktantraVani News."
- Keep script under 800 words (about 4 minutes of audio)
- Write for SPOKEN delivery — short sentences, no complex punctuation
- Add natural pauses with "..." for dramatic effect
- NO HTML, NO markdown, pure text`;

  const userPrompt = `Convert this ${category} article into a podcast script:

HEADLINE: ${title}

ARTICLE:
${cleanContent}

Write a compelling 3-4 minute news anchor monologue. Make it engaging, data-driven, and patriotic.`;

  // Try Claude first
  const anthropicKey = ANTHROPIC_KEY();
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text;
        if (text) return text;
      }
    } catch { /* fall through */ }
  }

  // Fallback: Gemini
  const geminiKey = GEMINI_KEY();
  if (!geminiKey) throw new Error("No AI API key available");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── ElevenLabs TTS ──
async function textToSpeech(text: string, voiceId: string): Promise<Buffer | null> {
  const key = ELEVENLABS_KEY();
  if (!key) return null;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": key,
    },
    body: JSON.stringify({
      text: text.slice(0, 5000), // ElevenLabs limit
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.80,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${err.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Fallback: Gemini TTS (free) ──
async function geminiTTS(text: string): Promise<Buffer | null> {
  const key = GEMINI_KEY();
  if (!key) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text.slice(0, 4000) }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) return Buffer.from(audioData, "base64");
  } catch { /* */ }
  return null;
}

// ── Upload audio to Firebase Storage ──
async function uploadAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg" },
    body: new Uint8Array(audioBuffer),
  });

  if (!res.ok) throw new Error("Audio upload failed");
  const data = await res.json();
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`;
}

// ── HeyGen Video Generation ──
const HEYGEN_KEY = () => (process.env.HEYGEN_API_KEY || "").trim();

async function createHeygenVideo(script: string, avatarId: string, voiceId: string): Promise<{ videoId: string }> {
  const key = HEYGEN_KEY();
  if (!key) throw new Error("HEYGEN_API_KEY not configured");

  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId,
          speed: 1.0,
        },
        background: {
          type: "color",
          value: "#0d0d0d",
        },
      }],
      dimension: { width: 1920, height: 1080 },
      aspect_ratio: "16:9",
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || data.message || `HeyGen error ${res.status}`);
  }
  return { videoId: data.data?.video_id };
}

async function checkHeygenStatus(videoId: string): Promise<{ status: string; videoUrl?: string; thumbnail?: string; duration?: number }> {
  const key = HEYGEN_KEY();
  if (!key) throw new Error("HEYGEN_API_KEY not set");

  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": key },
  });
  const data = await res.json();
  return {
    status: data.data?.status || "unknown",
    videoUrl: data.data?.video_url,
    thumbnail: data.data?.thumbnail_url,
    duration: data.data?.duration,
  };
}

async function listHeygenAvatars(): Promise<unknown[]> {
  const key = HEYGEN_KEY();
  if (!key) throw new Error("HEYGEN_API_KEY not set");

  const res = await fetch("https://api.heygen.com/v2/avatars", {
    headers: { "X-Api-Key": key },
  });
  const data = await res.json();
  return data.data?.avatars || [];
}

async function listHeygenVoices(): Promise<unknown[]> {
  const key = HEYGEN_KEY();
  if (!key) throw new Error("HEYGEN_API_KEY not set");

  const res = await fetch("https://api.heygen.com/v2/voices", {
    headers: { "X-Api-Key": key },
  });
  const data = await res.json();
  return data.data?.voices || [];
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  const body = await req.json();
  const { action } = body;

  // ── HeyGen Actions ──────────────────────────────────────────────
  if (action === "heygen-list-avatars") {
    try {
      const avatars = await listHeygenAvatars();
      return NextResponse.json({ avatars });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "heygen-list-voices") {
    try {
      const voices = await listHeygenVoices();
      return NextResponse.json({ voices });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "heygen-create-video") {
    const { script, avatarId, voiceId } = body;
    if (!script || !avatarId) {
      return NextResponse.json({ error: "script and avatarId required" }, { status: 400 });
    }
    try {
      const result = await createHeygenVideo(script, avatarId, voiceId || "");
      return NextResponse.json({ ...result, status: "processing", message: "Video generating — check status in 2-5 minutes" });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "heygen-video-status") {
    const { videoId } = body;
    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });
    try {
      const result = await checkHeygenStatus(videoId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "generate-script-only") {
    const { title, content, category = "India" } = body;
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    try {
      const script = await generateScript(title, content || "", category);
      return NextResponse.json({ script });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Default: Full Audio Podcast Generation ──────────────────────
  const { title, content, category = "India", voice = "male", postId } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  try {
    // Step 1: Generate podcast script
    const script = await generateScript(title, content, category);
    if (!script) {
      return NextResponse.json({ error: "Failed to generate podcast script" }, { status: 500 });
    }

    // Step 2: Convert to audio (ElevenLabs primary, Gemini fallback)
    let audioBuffer: Buffer | null = null;
    let audioSource = "elevenlabs";

    const voiceId = VOICES[voice as keyof typeof VOICES] || VOICES.male;
    try {
      audioBuffer = await textToSpeech(script, voiceId);
    } catch {
      // Fallback to Gemini TTS (free)
      audioSource = "gemini";
      audioBuffer = await geminiTTS(script);
    }

    if (!audioBuffer) {
      return NextResponse.json({
        success: true,
        script,
        audioUrl: null,
        message: "Script generated but no TTS API available. Set ELEVENLABS_API_KEY for audio.",
      });
    }

    // Step 3: Upload audio
    const slug = title.slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const filename = `podcasts/${Date.now()}-${slug}.mp3`;
    const audioUrl = await uploadAudio(audioBuffer, filename);

    // Step 4: Save podcast episode to Firestore
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
    const docId = `pod_${Date.now()}`;
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/podcasts/${docId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            title: { stringValue: title },
            script: { stringValue: script.slice(0, 5000) },
            audioUrl: { stringValue: audioUrl },
            category: { stringValue: category },
            postId: { stringValue: postId || "" },
            source: { stringValue: audioSource },
            createdAt: { stringValue: new Date().toISOString() },
            duration: { integerValue: String(Math.ceil(script.split(/\s+/).length / 150 * 60)) },
          },
        }),
      }
    );

    return NextResponse.json({
      success: true,
      script: script.slice(0, 500) + "...",
      audioUrl,
      source: audioSource,
      episodeId: docId,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
