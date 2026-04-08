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
async function generateScript(title: string, content: string, category: string, language: string = "en", anchorName: string = ""): Promise<string> {
  const cleanContent = content.replace(/<[^>]*>/g, "").slice(0, 3000);
  const isHindi = language === "hi" || language === "hindi";
  const name = anchorName || "AI Anchor";

  const systemPrompt = isHindi
    ? `Aap LoktantraVani ke professional news anchor hain — "${name}". Aap Bharat ke pehle AI-powered newspaper ke liye Hindi mein samachar padhte hain. Aap vishwaas, adhikaar aur rashtrabhakti ke saath news deliver karte hain.

STYLE:
- Professional, authoritative tone — Republic Bharat / Aaj Tak anchors jaisa
- Start with: "Namaste aur aapka swagat hai LoktantraVani News mein. Main hoon ${name}."
- Tathyon ko vishwaas ke saath prastut karein
- Sarkar ki uplabdhiyon aur vikas ke aankdon ko highlight karein
- Virodhi paksh ke baare mein tathyaatmak counter-narratives prastut karein
- End with: "Jaagrit rahein, deshbhakt rahein. Yeh hai LoktantraVani News. Main ${name}, aapka dhanyavaad."
- Script 800 shabd se kam rakhein (lagbhag 4 minute ka audio)
- BOLI jaane wali delivery ke liye likhein — chhote vaakya, saral Hindi
- Naatak prabhav ke liye "..." se prakritik viram jodein
- Koi HTML nahi, koi markdown nahi, shuddh Hindi text
- Hinglish mat likhein — shuddh Hindi mein likhein (Devanagari nahi, Roman Hindi mein)`
    : `You are a professional Indian news anchor for LoktantraVani, India's premier AI-powered newspaper. Your name is "${name}". You deliver news with confidence, authority, and a clear pro-India nationalist perspective.

STYLE:
- Professional, authoritative tone like Republic TV or Times Now anchors
- Start with: "Namaste and welcome to LoktantraVani News. I'm ${name}, your news anchor."
- Present facts with conviction
- Highlight government achievements and development data
- When covering opposition, present factual counter-narratives
- End with: "Stay informed, stay patriotic. This is LoktantraVani News. I'm ${name}, thank you for listening."
- Keep script under 800 words (about 4 minutes of audio)
- Write for SPOKEN delivery — short sentences, no complex punctuation
- Add natural pauses with "..." for dramatic effect
- NO HTML, NO markdown, pure text`;

  const userPrompt = isHindi
    ? `Is ${category} article ko podcast script mein badlein:

HEADLINE: ${title}

ARTICLE:
${cleanContent}

Ek prabhavshali 3-4 minute ka Hindi news anchor monologue likhein. Engaging, data-driven aur deshbhakti se bhara ho. Roman Hindi mein likhein (Devanagari script nahi).`
    : `Convert this ${category} article into a podcast script:

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

// ── PCM to WAV conversion ──
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const wav = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);

  // fmt sub-chunk
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);           // sub-chunk size
  wav.writeUInt16LE(1, 20);            // PCM format
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  pcmData.copy(wav, headerSize);

  return wav;
}

// ── Fallback: Gemini TTS (free) ──
async function geminiTTS(text: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const key = GEMINI_KEY();
  if (!key) { console.log("[Podcast] No GEMINI_API_KEY"); return null; }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`;
    console.log("[Podcast] Calling Gemini TTS with", text.slice(0, 50), "...");
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

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Podcast] Gemini TTS error:", res.status, errText.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const rawMime = inlineData.mimeType || "";
      console.log("[Podcast] Gemini TTS success, rawMime:", rawMime, "base64Len:", inlineData.data.length);

      let audioBuffer = Buffer.from(inlineData.data, "base64");

      // Gemini returns raw PCM (audio/L16;codec=pcm;rate=24000) — convert to WAV
      if (rawMime.includes("L16") || rawMime.includes("pcm")) {
        const rateMatch = rawMime.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
        console.log("[Podcast] Converting PCM to WAV, sampleRate:", sampleRate, "pcmSize:", audioBuffer.length);
        const wavBuffer = pcmToWav(audioBuffer, sampleRate);
        return { buffer: wavBuffer, mimeType: "audio/wav" };
      }

      return { buffer: audioBuffer, mimeType: rawMime || "audio/wav" };
    }
    console.error("[Podcast] Gemini TTS no audio data in response:", JSON.stringify(data).slice(0, 500));
  } catch (err) {
    console.error("[Podcast] Gemini TTS exception:", err);
  }
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
    const { title, content, category = "India", language = "en", anchorName = "" } = body;
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    try {
      const script = await generateScript(title, content || "", category, language, anchorName);
      return NextResponse.json({ script });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Audio from pre-generated script (fast — no script gen step) ──
  if (action === "generate-audio-from-script") {
    const { script: preScript, title: audioTitle, category: audioCat = "India", voice: audioVoice = "male", postId: audioPid } = body;
    if (!preScript) return NextResponse.json({ error: "script required" }, { status: 400 });

    try {
      let audioBuffer: Buffer | null = null;
      let audioSource = "elevenlabs";
      let audioMimeType = "audio/mpeg";

      const vid = VOICES[audioVoice as keyof typeof VOICES] || VOICES.male;
      try {
        audioBuffer = await textToSpeech(preScript, vid);
      } catch { /* ElevenLabs failed */ }

      // Fallback to Gemini TTS if ElevenLabs returned null or failed
      if (!audioBuffer) {
        audioSource = "gemini";
        const geminiResult = await geminiTTS(preScript);
        if (geminiResult) {
          audioBuffer = geminiResult.buffer;
          audioMimeType = geminiResult.mimeType;
        }
      }

      if (!audioBuffer || audioBuffer.length < 100) {
        return NextResponse.json({ success: true, script: preScript, audioUrl: null, message: "TTS failed. Check API keys." });
      }

      const slug = (audioTitle || "podcast").slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase();
      const ext = audioMimeType.includes("wav") ? "wav" : "mp3";
      const filename = `podcasts/${Date.now()}-${slug}.${ext}`;
      const uploadContentType = audioMimeType.includes("wav") ? "audio/wav" : "audio/mpeg";

      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadContentType },
        body: new Uint8Array(audioBuffer),
      });
      if (!uploadRes.ok) throw new Error("Audio upload failed");
      const uploadData = await uploadRes.json();
      const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(uploadData.name)}?alt=media&token=${uploadData.downloadTokens || ""}`;

      // Save to Firestore
      const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
      const docId = `pod_${Date.now()}`;
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/podcasts/${docId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              title: { stringValue: audioTitle || "Podcast" },
              script: { stringValue: preScript.slice(0, 5000) },
              audioUrl: { stringValue: audioUrl },
              category: { stringValue: audioCat },
              postId: { stringValue: audioPid || "" },
              source: { stringValue: audioSource },
              createdAt: { stringValue: new Date().toISOString() },
              duration: { integerValue: String(Math.ceil(preScript.split(/\s+/).length / 150 * 60)) },
            },
          }),
        }
      );

      return NextResponse.json({ success: true, audioUrl, source: audioSource, episodeId: docId });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Default: Full Audio Podcast Generation ──────────────────────
  const { title, content, category = "India", voice = "male", postId, language = "en", anchorName = "" } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  try {
    // Step 1: Generate podcast script
    const script = await generateScript(title, content, category, language, anchorName);
    if (!script) {
      return NextResponse.json({ error: "Failed to generate podcast script" }, { status: 500 });
    }

    // Step 2: Convert to audio (ElevenLabs primary, Gemini fallback)
    let audioBuffer: Buffer | null = null;
    let audioSource = "elevenlabs";
    let audioMimeType = "audio/mpeg";

    const voiceId = VOICES[voice as keyof typeof VOICES] || VOICES.male;
    try {
      audioBuffer = await textToSpeech(script, voiceId);
      console.log("[Podcast] ElevenLabs success, size:", audioBuffer?.length);
    } catch (elevenErr) {
      console.log("[Podcast] ElevenLabs failed:", String(elevenErr).slice(0, 200));
    }

    // Fallback to Gemini TTS if ElevenLabs returned null or failed
    if (!audioBuffer) {
      console.log("[Podcast] Using Gemini TTS fallback");
      audioSource = "gemini";
      const geminiResult = await geminiTTS(script);
      if (geminiResult) {
        audioBuffer = geminiResult.buffer;
        audioMimeType = geminiResult.mimeType;
      }
    }

    if (!audioBuffer || audioBuffer.length < 100) {
      console.error("[Podcast] No audio generated. Buffer:", audioBuffer?.length);
      return NextResponse.json({
        success: true,
        script,
        audioUrl: null,
        message: "Script generated but TTS failed. Check ELEVENLABS_API_KEY or GEMINI_API_KEY.",
      });
    }

    // Step 3: Upload audio
    const slug = title.slice(0, 30).replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const ext = audioMimeType.includes("wav") ? "wav" : audioMimeType.includes("ogg") ? "ogg" : "mp3";
    const filename = `podcasts/${Date.now()}-${slug}.${ext}`;
    const uploadContentType = audioMimeType.includes("wav") ? "audio/wav" : audioMimeType.includes("ogg") ? "audio/ogg" : "audio/mpeg";

    // Upload with correct content type
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": uploadContentType },
      body: new Uint8Array(audioBuffer),
    });
    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      console.error("[Podcast] Upload failed:", uploadErr.slice(0, 300));
      return NextResponse.json({ error: "Audio upload failed: " + uploadErr.slice(0, 100) }, { status: 500 });
    }
    const uploadData = await uploadRes.json();
    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(uploadData.name)}?alt=media&token=${uploadData.downloadTokens || ""}`;

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
