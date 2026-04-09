/**
 * POST /api/voice-clone
 * Free Voice Cloning Pipeline using HuggingFace Spaces
 *
 * Actions:
 *   clone-voice     — Upload reference audio → OpenVoice V2 clones it → saves profile
 *   list-voices     — List saved cloned voice profiles from Firestore
 *   delete-voice    — Delete a cloned voice profile
 *   tts-with-clone  — Generate speech using a cloned voice (OpenVoice V2 on HF)
 *
 * Pipeline:
 *   1. User uploads 10-30s audio sample of their voice
 *   2. We store the reference audio in Firebase Storage
 *   3. When generating TTS, we send text + reference audio to HuggingFace Space
 *   4. The Space returns cloned audio — we store it in Firebase Storage
 *
 * HuggingFace Spaces used (FREE, Gradio API):
 *   - OpenVoice V2: myshell-ai/OpenVoiceV2
 *   - Fallback: fish-audio/fish-speech-1 (if OpenVoice is down)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 180; // Voice cloning can take time

const STORAGE_BUCKET = (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app").trim();
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// HuggingFace Space endpoints (Gradio API)
const HF_SPACES = {
  // Nymbo/Voice-Clone-Multilingual — uses Coqui XTTS v2, Gradio 5.x, /call/predict
  voiceClone: "https://nymbo-voice-clone-multilingual.hf.space",
  // OpenVoice V2 fallback (Gradio 3.x, often broken)
  openvoice: "https://myshell-ai-openvoicev2.hf.space",
};

// ── Upload to Firebase Storage ──
async function uploadToStorage(data: Buffer | Uint8Array, filename: string, contentType: string): Promise<string> {
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: new Uint8Array(data instanceof Buffer ? data : data),
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const result = await res.json();
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(result.name)}?alt=media&token=${result.downloadTokens || ""}`;
}

// ── Download audio from URL ──
async function downloadAudio(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Voice Clone TTS via HuggingFace (Nymbo/Voice-Clone-Multilingual — XTTS v2) ──
// Gradio 5.x /call/predict API
// Params: [text, speaker_wav (FileData), language]
// Returns: [output audio FileData with url]
async function voiceCloneTTS(text: string, referenceAudioUrl: string, language = "english"): Promise<Buffer> {
  // Step 1: Download reference audio and detect format
  const refAudio = await downloadAudio(referenceAudioUrl);
  const header = refAudio.slice(0, 4).toString();
  const isOgg = header === "OggS";
  const isWavFile = header === "RIFF";
  const mimeType = isOgg ? "audio/ogg" : isWavFile ? "audio/wav" : "audio/mpeg";
  const ext = isOgg ? "ogg" : isWavFile ? "wav" : "mp3";
  const refBase64 = refAudio.toString("base64");

  console.log("[VoiceClone] Ref audio:", refAudio.length, "bytes, format:", header, "mime:", mimeType);

  // Step 2: Map language
  const langMap: Record<string, string> = {
    english: "en", hindi: "en", en: "en", hi: "en", // XTTS doesn't support Hindi, use English
    spanish: "es", french: "fr", german: "de", japanese: "ja", chinese: "zh-cn",
    korean: "ko", italian: "it", portuguese: "pt", russian: "ru", arabic: "ar",
  };
  const lang = langMap[language.toLowerCase()] || "en";

  console.log("[VoiceClone] Calling XTTS v2, lang:", lang, "textLen:", text.length, "refSize:", refAudio.length, "format:", header);

  // Step 3: Upload reference audio to HuggingFace Space first (required by Gradio 5.x)
  const uploadForm = new FormData();
  uploadForm.append("files", new Blob([new Uint8Array(refAudio)], { type: mimeType }), `reference.${ext}`);

  const uploadRes = await fetch(`${HF_SPACES.voiceClone}/upload`, {
    method: "POST",
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    throw new Error(`HF upload failed: ${uploadRes.status}`);
  }

  const uploadPaths = await uploadRes.json() as string[];
  const uploadedPath = uploadPaths?.[0];
  if (!uploadedPath) throw new Error("HF upload returned no file path");

  console.log("[VoiceClone] Uploaded reference to HF:", uploadedPath);

  // Step 4: Call /call/predict with uploaded file path
  const callRes = await fetch(`${HF_SPACES.voiceClone}/call/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        text.slice(0, 3000),
        { path: uploadedPath, orig_name: `reference.${ext}`, meta: { _type: "gradio.FileData" } },
        lang,
      ],
    }),
  });

  if (!callRes.ok) {
    const errText = await callRes.text();
    throw new Error(`Voice Clone API call failed ${callRes.status}: ${errText.slice(0, 200)}`);
  }

  const callData = await callRes.json();
  const eventId = callData.event_id;
  if (!eventId) throw new Error("No event_id from Voice Clone API");

  console.log("[VoiceClone] Queued, eventId:", eventId, "— waiting for result...");

  // Step 4: Poll for result via SSE
  const resultRes = await fetch(`${HF_SPACES.voiceClone}/call/predict/${eventId}`);
  if (!resultRes.ok) throw new Error(`Voice Clone result fetch failed: ${resultRes.status}`);

  const resultText = await resultRes.text();
  const lines = resultText.split("\n");

  // Find the last data line with actual content
  let audioUrl = "";
  let sseError = "";
  for (const line of lines) {
    // Check for event: error
    if (line.startsWith("event:") && line.includes("error")) {
      sseError = "HuggingFace Space returned an error";
    }
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (payload === "null" || !payload) continue;

    try {
      const parsed = JSON.parse(payload);
      // Check if it's an error string
      if (typeof parsed === "string" && sseError) {
        sseError = parsed;
        continue;
      }
      // Response is an array — first element is the output audio FileData
      if (Array.isArray(parsed) && parsed.length > 0) {
        const audioFile = parsed[0];
        if (audioFile?.url) {
          audioUrl = audioFile.url;
          console.log("[VoiceClone] Got audio URL:", audioUrl.slice(0, 100));
        }
      }
    } catch { continue; }
  }

  if (sseError && !audioUrl) {
    throw new Error(`XTTS v2 error: ${sseError}`);
  }

  if (!audioUrl) {
    throw new Error("No audio URL in Voice Clone response. Raw: " + resultText.slice(0, 300));
  }

  // Step 5: Download the generated audio from the Space
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Failed to download cloned audio: ${audioRes.status}`);
  return Buffer.from(await audioRes.arrayBuffer());
}

// ── PCM to WAV conversion ──
function pcmToWav(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  pcmData.copy(wav, 44);
  return wav;
}

// ── Fallback: Gemini TTS with style transfer ──
async function geminiCloneTTS(text: string): Promise<Buffer | null> {
  const key = (process.env.GEMINI_API_KEY || "").trim();
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
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const rawBuf = Buffer.from(inlineData.data, "base64");
      const mime = inlineData.mimeType || "";
      if (mime.includes("L16") || mime.includes("pcm")) {
        const rateMatch = mime.match(/rate=(\d+)/);
        return pcmToWav(rawBuf, rateMatch ? parseInt(rateMatch[1]) : 24000);
      }
      return rawBuf;
    }
  } catch { /* */ }
  return null;
}

// ── Save voice profile to Firestore ──
async function saveVoiceProfile(profile: {
  id: string;
  name: string;
  referenceUrl: string;
  createdAt: string;
  language: string;
  duration: number;
}) {
  await fetch(`${FIRESTORE_BASE}/voice_profiles/${profile.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        name: { stringValue: profile.name },
        referenceUrl: { stringValue: profile.referenceUrl },
        createdAt: { stringValue: profile.createdAt },
        language: { stringValue: profile.language },
        duration: { integerValue: String(profile.duration) },
      },
    }),
  });
}

// ── List voice profiles ──
async function listVoiceProfiles(): Promise<Array<{ id: string; name: string; referenceUrl: string; createdAt: string; language: string }>> {
  const res = await fetch(`${FIRESTORE_BASE}/voice_profiles?pageSize=50`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc: Record<string, Record<string, Record<string, { stringValue?: string }>>>) => {
    const f = doc.fields as Record<string, { stringValue?: string }>;
    const id = (doc as unknown as { name: string }).name.split("/").pop() || "";
    return {
      id,
      name: f.name?.stringValue || "Unnamed",
      referenceUrl: f.referenceUrl?.stringValue || "",
      createdAt: f.createdAt?.stringValue || "",
      language: f.language?.stringValue || "en",
    };
  });
}

// ── Delete voice profile ──
async function deleteVoiceProfile(id: string) {
  await fetch(`${FIRESTORE_BASE}/voice_profiles/${id}`, { method: "DELETE" });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  const contentType = req.headers.get("content-type") || "";

  // Handle multipart form data (audio upload)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const action = formData.get("action") as string;

      if (action === "clone-voice") {
        const audioFile = formData.get("audio") as File;
        const voiceName = (formData.get("name") as string) || "My Voice";
        const language = (formData.get("language") as string) || "english";

        if (!audioFile) {
          return NextResponse.json({ error: "Audio file required" }, { status: 400 });
        }

        // Upload reference audio to Firebase Storage
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        const voiceId = `voice_${Date.now()}`;
        const filename = `voice-clones/${voiceId}/reference.wav`;
        const referenceUrl = await uploadToStorage(audioBuffer, filename, audioFile.type || "audio/wav");

        // Save voice profile
        await saveVoiceProfile({
          id: voiceId,
          name: voiceName,
          referenceUrl,
          createdAt: new Date().toISOString(),
          language,
          duration: Math.ceil(audioBuffer.length / (16000 * 2)), // rough estimate
        });

        return NextResponse.json({
          success: true,
          voiceId,
          name: voiceName,
          referenceUrl,
          message: "Voice profile saved! You can now use it to generate podcasts.",
        });
      }

      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // Handle JSON requests
  const body = await req.json();
  const { action } = body;

  // ── List voices ──
  if (action === "list-voices") {
    try {
      const voices = await listVoiceProfiles();
      return NextResponse.json({ voices });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Delete voice ──
  if (action === "delete-voice") {
    const { voiceId } = body;
    if (!voiceId) return NextResponse.json({ error: "voiceId required" }, { status: 400 });
    try {
      await deleteVoiceProfile(voiceId);
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── TTS with cloned voice ──
  if (action === "tts-with-clone") {
    const { text, voiceId, language = "english" } = body;
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    if (!voiceId) return NextResponse.json({ error: "voiceId required" }, { status: 400 });

    try {
      // Get voice profile
      const voices = await listVoiceProfiles();
      const voice = voices.find(v => v.id === voiceId);
      if (!voice) return NextResponse.json({ error: "Voice not found" }, { status: 404 });

      let audioBuffer: Buffer | null = null;
      let source = "xtts-v2";

      // Try XTTS v2 voice cloning via HuggingFace
      try {
        audioBuffer = await voiceCloneTTS(text, voice.referenceUrl, language);
      } catch (err) {
        console.error("[VoiceClone] XTTS v2 failed:", String(err).slice(0, 300));
      }

      // Fallback: Gemini TTS (no cloning, but at least generates audio)
      if (!audioBuffer) {
        source = "gemini-fallback";
        audioBuffer = await geminiCloneTTS(text);
      }

      if (!audioBuffer) {
        return NextResponse.json({
          error: "Voice cloning services unavailable. Both XTTS v2 (HuggingFace) and Gemini TTS failed.",
          tip: "The HuggingFace Space may be sleeping. Visit https://huggingface.co/spaces/Nymbo/Voice-Clone-Multilingual to wake it up.",
        }, { status: 503 });
      }

      // Upload generated audio (detect format from buffer header)
      const slug = `cloned-${Date.now()}`;
      const isWav = audioBuffer.length > 4 && audioBuffer.slice(0, 4).toString() === "RIFF";
      const ext = isWav ? "wav" : "mp3";
      const mime = isWav ? "audio/wav" : "audio/mpeg";
      const filename = `voice-clones/${voiceId}/output/${slug}.${ext}`;
      const audioUrl = await uploadToStorage(audioBuffer, filename, mime);

      return NextResponse.json({
        success: true,
        audioUrl,
        source,
        size: audioBuffer.length,
        message: source === "xtts-v2"
          ? "Audio generated with your cloned voice via XTTS v2!"
          : "Generated with Gemini TTS (XTTS was unavailable). Try again later for cloned voice.",
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // ── Generate full podcast with cloned voice ──
  if (action === "podcast-with-clone") {
    const { title, content, category = "India", voiceId: cloneVoiceId, postId } = body;
    if (!title || !content) return NextResponse.json({ error: "title and content required" }, { status: 400 });
    if (!cloneVoiceId) return NextResponse.json({ error: "voiceId required for cloned podcast" }, { status: 400 });

    try {
      // Step 1: Generate script (reuse from podcast route)
      const scriptRes = await fetch(new URL("/api/podcast", req.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
          authorization: req.headers.get("authorization") || "",
        },
        body: JSON.stringify({ action: "generate-script-only", title, content, category }),
      });
      const scriptData = await scriptRes.json();
      if (!scriptRes.ok) throw new Error(scriptData.error);
      const script = scriptData.script;

      // Step 2: Generate cloned voice audio
      const ttsRes = await fetch(new URL("/api/voice-clone", req.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
          authorization: req.headers.get("authorization") || "",
        },
        body: JSON.stringify({ action: "tts-with-clone", text: script, voiceId: cloneVoiceId }),
      });
      const ttsData = await ttsRes.json();

      // Step 3: Save to Firestore
      const docId = `pod_${Date.now()}`;
      await fetch(`${FIRESTORE_BASE}/podcasts/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            title: { stringValue: title },
            script: { stringValue: script.slice(0, 5000) },
            audioUrl: { stringValue: ttsData.audioUrl || "" },
            category: { stringValue: category },
            postId: { stringValue: postId || "" },
            source: { stringValue: `voice-clone:${ttsData.source || "unknown"}` },
            voiceProfileId: { stringValue: cloneVoiceId },
            createdAt: { stringValue: new Date().toISOString() },
            duration: { integerValue: String(Math.ceil(script.split(/\s+/).length / 150 * 60)) },
          },
        }),
      });

      return NextResponse.json({
        success: true,
        script: script.slice(0, 500) + "...",
        audioUrl: ttsData.audioUrl,
        source: `voice-clone:${ttsData.source}`,
        episodeId: docId,
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
