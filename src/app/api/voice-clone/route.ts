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
  openvoice: "https://myshell-ai-openvoicev2.hf.space",
  fishSpeech: "https://fishaudio-fish-speech-1.hf.space",
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

// ── HuggingFace Gradio API: OpenVoice V2 ──
async function openVoiceTTS(text: string, referenceAudioUrl: string, language = "English"): Promise<Buffer> {
  // Step 1: Download reference audio
  const refAudio = await downloadAudio(referenceAudioUrl);
  const refBase64 = refAudio.toString("base64");

  // Step 2: Call OpenVoice V2 Gradio API
  // Gradio API format: /api/predict with data array
  const langMap: Record<string, string> = {
    english: "EN_NEWEST", hindi: "EN_NEWEST", // OpenVoice uses EN for Indian English
    en: "EN_NEWEST", hi: "EN_NEWEST",
  };
  const langCode = langMap[language.toLowerCase()] || "EN_NEWEST";

  // Try the queue-based Gradio API
  const res = await fetch(`${HF_SPACES.openvoice}/run/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        text.slice(0, 3000),
        langCode,
        1.0, // speed
        { data: `data:audio/wav;base64,${refBase64}`, name: "reference.wav" },
      ],
    }),
  });

  if (!res.ok) {
    // Try alternative endpoint format
    const res2 = await fetch(`${HF_SPACES.openvoice}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fn_index: 0,
        data: [
          text.slice(0, 3000),
          langCode,
          1.0,
          { data: `data:audio/wav;base64,${refBase64}`, name: "reference.wav" },
        ],
      }),
    });
    if (!res2.ok) throw new Error(`OpenVoice API error: ${res2.status}`);
    const data2 = await res2.json();
    return extractAudioFromGradioResponse(data2);
  }

  const data = await res.json();
  return extractAudioFromGradioResponse(data);
}

// ── Extract audio from Gradio response ──
function extractAudioFromGradioResponse(data: Record<string, unknown>): Buffer {
  // Gradio returns audio as base64 in data array or as file path
  const result = (data.data as unknown[]) || [];

  for (const item of result) {
    if (typeof item === "string") {
      // Could be a base64 data URL or a file URL
      if (item.startsWith("data:audio")) {
        const base64 = item.split(",")[1];
        return Buffer.from(base64, "base64");
      }
      if (item.startsWith("http") || item.startsWith("/")) {
        // It's a URL to the generated file on the HF Space
        // We'll need to download it
        throw new Error(`REDIRECT:${item}`);
      }
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (obj.data && typeof obj.data === "string" && (obj.data as string).startsWith("data:audio")) {
        const base64 = (obj.data as string).split(",")[1];
        return Buffer.from(base64, "base64");
      }
      if (obj.url && typeof obj.url === "string") {
        throw new Error(`REDIRECT:${obj.url}`);
      }
    }
  }

  throw new Error("No audio in OpenVoice response");
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
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) return Buffer.from(audioData, "base64");
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
      let source = "openvoice";

      // Try OpenVoice V2 on HuggingFace
      try {
        audioBuffer = await openVoiceTTS(text, voice.referenceUrl, language);
      } catch (err) {
        const errMsg = String(err);
        // Handle redirect (file URL from Gradio)
        if (errMsg.includes("REDIRECT:")) {
          const fileUrl = errMsg.replace("Error: REDIRECT:", "");
          const fullUrl = fileUrl.startsWith("http") ? fileUrl : `${HF_SPACES.openvoice}${fileUrl.startsWith("/") ? "" : "/file="}${fileUrl}`;
          audioBuffer = await downloadAudio(fullUrl);
        } else {
          console.error("OpenVoice failed:", errMsg);
        }
      }

      // Fallback: Gemini TTS (no cloning, but at least generates audio)
      if (!audioBuffer) {
        source = "gemini-fallback";
        audioBuffer = await geminiCloneTTS(text);
      }

      if (!audioBuffer) {
        return NextResponse.json({
          error: "Voice cloning services unavailable. Both OpenVoice (HuggingFace) and Gemini TTS failed.",
          tip: "The HuggingFace Space may be sleeping. Visit https://huggingface.co/spaces/myshell-ai/OpenVoiceV2 to wake it up.",
        }, { status: 503 });
      }

      // Upload generated audio
      const slug = `cloned-${Date.now()}`;
      const filename = `voice-clones/${voiceId}/output/${slug}.mp3`;
      const audioUrl = await uploadToStorage(audioBuffer, filename, "audio/mpeg");

      return NextResponse.json({
        success: true,
        audioUrl,
        source,
        size: audioBuffer.length,
        message: source === "openvoice"
          ? "Audio generated with your cloned voice!"
          : "Generated with Gemini TTS (OpenVoice was unavailable). Try again later for cloned voice.",
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
