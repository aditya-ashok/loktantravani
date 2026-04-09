/**
 * POST /api/voice-clone
 * Voice Cloning — 2 simple actions:
 *   1. clone-voice   — Upload voice sample → save to Firebase
 *   2. tts-with-clone — Generate audio with cloned voice (XTTS v2 on HuggingFace, ElevenLabs, or Gemini fallback)
 *   + list-voices, delete-voice for management
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 120;

const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const HF_SPACE = "https://nymbo-voice-clone-multilingual.hf.space";

// ── Firebase Storage upload ──
async function uploadToStorage(data: Buffer | Uint8Array, filename: string, contentType: string): Promise<string> {
  const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(data instanceof Buffer ? data : data) });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const r = await res.json();
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(r.name)}?alt=media&token=${r.downloadTokens || ""}`;
}

// ── PCM to WAV ──
function pcmToWav(pcm: Buffer, rate = 24000): Buffer {
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0); wav.writeUInt32LE(36 + pcm.length, 4); wav.write("WAVE", 8);
  wav.write("fmt ", 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44);
  return wav;
}

// ── XTTS v2 Voice Clone (HuggingFace — FREE) ──
async function xttsClone(text: string, refAudioUrl: string): Promise<Buffer> {
  // 1. Download reference audio
  const refRes = await fetch(refAudioUrl);
  if (!refRes.ok) throw new Error("Cannot download reference audio");
  const refBuf = Buffer.from(await refRes.arrayBuffer());
  const header = refBuf.slice(0, 4).toString();
  const mime = header === "OggS" ? "audio/ogg" : header === "RIFF" ? "audio/wav" : "audio/mpeg";
  const ext = header === "OggS" ? "ogg" : header === "RIFF" ? "wav" : "mp3";
  console.log("[Clone] ref:", refBuf.length, "bytes,", header, mime);

  // 2. Upload to HuggingFace Space (Gradio 5.x requires pre-upload)
  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(refBuf)], { type: mime }), `ref.${ext}`);
  const upRes = await fetch(`${HF_SPACE}/upload`, { method: "POST", body: form });
  if (!upRes.ok) throw new Error(`HF upload failed: ${upRes.status}`);
  const upText = await upRes.text();
  let uploadedPath: string;
  try {
    const paths = JSON.parse(upText);
    uploadedPath = paths[0];
  } catch {
    throw new Error(`HF upload bad response: ${upText.slice(0, 100)}`);
  }
  if (!uploadedPath) throw new Error("HF upload returned no path");
  console.log("[Clone] uploaded to HF:", uploadedPath);

  // 3. Call /call/predict
  const callRes = await fetch(`${HF_SPACE}/call/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [text.slice(0, 2000), { path: uploadedPath, orig_name: `ref.${ext}`, meta: { _type: "gradio.FileData" } }, "en"] }),
  });
  if (!callRes.ok) throw new Error(`HF predict failed: ${callRes.status}`);
  const callText = await callRes.text();
  let eventId: string;
  try {
    eventId = JSON.parse(callText).event_id;
  } catch {
    throw new Error(`HF predict bad JSON: ${callText.slice(0, 100)}`);
  }
  if (!eventId) throw new Error("No event_id from HF");
  console.log("[Clone] eventId:", eventId);

  // 4. SSE poll for result
  const sseRes = await fetch(`${HF_SPACE}/call/predict/${eventId}`);
  if (!sseRes.ok) throw new Error(`HF SSE failed: ${sseRes.status}`);
  const sseText = await sseRes.text();

  // Parse SSE — find audio URL
  let audioUrl = "";
  for (const line of sseText.split("\n")) {
    if (line.startsWith("event:") && line.includes("error")) {
      throw new Error("HuggingFace XTTS error — Space may be overloaded. Try again in a minute.");
    }
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "null") continue;
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed) && parsed[0]?.url) {
        audioUrl = parsed[0].url;
      }
    } catch {
      // Not JSON — skip (this is the "An error o..." issue)
      continue;
    }
  }

  if (!audioUrl) throw new Error("XTTS returned no audio");
  console.log("[Clone] audio URL:", audioUrl.slice(0, 80));

  // 5. Download cloned audio
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Audio download failed: ${audioRes.status}`);
  return Buffer.from(await audioRes.arrayBuffer());
}

// ── ElevenLabs TTS (paid, high quality) ──
async function elevenLabsTTS(text: string): Promise<Buffer | null> {
  const key = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB", {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({ text: text.slice(0, 5000), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.75, similarity_boost: 0.8 } }),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

// ── Gemini TTS (free fallback) ──
async function geminiTTS(text: string): Promise<Buffer | null> {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text.slice(0, 4000) }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) return null;
    const raw = Buffer.from(inline.data, "base64");
    const m = inline.mimeType || "";
    if (m.includes("L16") || m.includes("pcm")) {
      const rate = m.match(/rate=(\d+)/);
      return pcmToWav(raw, rate ? parseInt(rate[1]) : 24000);
    }
    return raw;
  } catch { return null; }
}

// ── Firestore helpers ──
async function saveVoice(id: string, name: string, refUrl: string, lang: string) {
  await fetch(`${FIRESTORE_BASE}/voice_profiles/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { name: { stringValue: name }, referenceUrl: { stringValue: refUrl }, createdAt: { stringValue: new Date().toISOString() }, language: { stringValue: lang } } }),
  });
}

async function listVoices() {
  const res = await fetch(`${FIRESTORE_BASE}/voice_profiles?pageSize=50`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc: Record<string, Record<string, Record<string, { stringValue?: string }>>>) => {
    const f = doc.fields as Record<string, { stringValue?: string }>;
    const id = (doc as unknown as { name: string }).name.split("/").pop() || "";
    return { id, name: f.name?.stringValue || "Unnamed", referenceUrl: f.referenceUrl?.stringValue || "", createdAt: f.createdAt?.stringValue || "", language: f.language?.stringValue || "en" };
  });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  const ct = req.headers.get("content-type") || "";

  // ── Step 1: Upload voice sample (multipart) ──
  if (ct.includes("multipart/form-data")) {
    try {
      const form = await req.formData();
      const file = form.get("audio") as File;
      const name = (form.get("name") as string) || "My Voice";
      const lang = (form.get("language") as string) || "english";
      if (!file) return NextResponse.json({ error: "Audio file required" }, { status: 400 });

      const buf = Buffer.from(await file.arrayBuffer());
      const voiceId = `voice_${Date.now()}`;
      const refUrl = await uploadToStorage(buf, `voice-clones/${voiceId}/reference.wav`, file.type || "audio/wav");
      await saveVoice(voiceId, name, refUrl, lang);

      return NextResponse.json({ success: true, voiceId, name, referenceUrl: refUrl, message: "Voice saved! Select it and generate." });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── JSON actions ──
  const body = await req.json();
  const { action } = body;

  if (action === "list-voices") {
    return NextResponse.json({ voices: await listVoices() });
  }

  if (action === "delete-voice") {
    await fetch(`${FIRESTORE_BASE}/voice_profiles/${body.voiceId}`, { method: "DELETE" });
    return NextResponse.json({ success: true });
  }

  // ── Step 2: Generate audio with cloned voice ──
  if (action === "tts-with-clone") {
    const { text, voiceId } = body;
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    if (!voiceId) return NextResponse.json({ error: "voiceId required" }, { status: 400 });

    try {
      const voices = await listVoices();
      const voice = voices.find((v: { id: string }) => v.id === voiceId);
      if (!voice) return NextResponse.json({ error: "Voice not found" }, { status: 404 });

      let audioBuffer: Buffer | null = null;
      let source = "";

      // Try 1: XTTS v2 on HuggingFace (FREE voice cloning)
      try {
        console.log("[Clone] Trying XTTS v2...");
        audioBuffer = await xttsClone(text, voice.referenceUrl);
        source = "xtts-v2";
        console.log("[Clone] XTTS success!", audioBuffer.length, "bytes");
      } catch (err) {
        console.error("[Clone] XTTS failed:", String(err).slice(0, 200));
      }

      // Try 2: ElevenLabs (paid, no cloning but high quality)
      if (!audioBuffer) {
        console.log("[Clone] Trying ElevenLabs...");
        audioBuffer = await elevenLabsTTS(text);
        if (audioBuffer) source = "elevenlabs";
      }

      // Try 3: Gemini TTS (free, no cloning)
      if (!audioBuffer) {
        console.log("[Clone] Trying Gemini TTS...");
        audioBuffer = await geminiTTS(text);
        if (audioBuffer) source = "gemini";
      }

      if (!audioBuffer || audioBuffer.length < 100) {
        return NextResponse.json({ error: "All TTS services failed. Try again in a minute.", tip: "Visit https://huggingface.co/spaces/Nymbo/Voice-Clone-Multilingual to wake the Space." }, { status: 503 });
      }

      // Upload to Firebase
      const isWav = audioBuffer.slice(0, 4).toString() === "RIFF";
      const fname = `voice-clones/${voiceId}/output/clone-${Date.now()}.${isWav ? "wav" : "mp3"}`;
      const audioUrl = await uploadToStorage(audioBuffer, fname, isWav ? "audio/wav" : "audio/mpeg");

      return NextResponse.json({
        success: true, audioUrl, source, size: audioBuffer.length,
        message: source === "xtts-v2" ? "Generated with YOUR cloned voice!" : source === "elevenlabs" ? "Generated with ElevenLabs (not cloned)" : "Generated with Gemini TTS (not cloned)",
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
