/**
 * POST /api/video-gen
 * Free AI Video Generation Pipeline
 *
 * TESTED RESULTS (April 2026):
 * ✅ Pollinations.ai images — instant, 100% reliable, no API key
 * ✅ Self-Forcing Wan 2.1 prompt enhancement — reliable
 * ✅ Self-Forcing Wan 2.1 video — works when GPU available (uses queue/join + queue/data)
 * ✅ Wan Official t2v — works when GPU available (uses /call/ pattern)
 *
 * Actions:
 * - "generate-scenes"  — AI breaks podcast script into visual scene descriptions
 * - "enhance-prompt"   — Enhance a scene prompt for better video quality
 * - "generate-video"   — Submit video generation (returns eventId for polling)
 * - "check-status"     — Poll video generation progress (returns progress %)
 * - "generate-image"   — Instant image from scene prompt (Pollinations.ai)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export const maxDuration = 120;

const GEMINI_KEY = () => (process.env.GEMINI_API_KEY || "").trim();
const ANTHROPIC_KEY = () => (process.env.ANTHROPIC_API_KEY || "").trim();
const REPLICATE_TOKEN = () => (process.env.REPLICATE_API_TOKEN || "").trim();
const FAL_KEY = () => (process.env.FAL_KEY || "").trim();
const KLING_ACCESS_KEY = () => (process.env.KLING_ACCESS_KEY || "").trim();
const KLING_SECRET_KEY = () => (process.env.KLING_SECRET_KEY || "").trim();

// ── HuggingFace Spaces (tested & working) ──
const SELF_FORCING = "https://multimodalart-self-forcing.hf.space/gradio_api";
const WAN_OFFICIAL = "https://wan-ai-wan2-1.hf.space/gradio_api";

// Generate random session hash for Gradio
function randomSessionHash(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// ── Self-Forcing: Submit video via queue/join (correct Gradio 5.x pattern) ──
async function submitVideoSelfForcing(prompt: string): Promise<{ eventId: string; sessionHash: string }> {
  const sessionHash = randomSessionHash();

  const res = await fetch(`${SELF_FORCING}/queue/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [prompt, -1, 15], // prompt, seed (-1=random), fps (15)
      fn_index: 0,
      session_hash: sessionHash,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Self-Forcing queue join failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const { event_id } = await res.json();
  if (!event_id) throw new Error("No event_id returned");

  return { eventId: event_id, sessionHash };
}

// ── Self-Forcing: Enhance prompt ──
async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const res = await fetch(`${SELF_FORCING}/call/enhance_prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [prompt] }),
    });
    if (!res.ok) return prompt;

    const { event_id } = await res.json();
    const sseRes = await fetch(`${SELF_FORCING}/call/enhance_prompt/${event_id}`);
    if (!sseRes.ok) return prompt;

    const text = await sseRes.text();
    for (const line of text.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6).trim());
          if (Array.isArray(data) && typeof data[0] === "string" && data[0].length > 20) {
            return data[0];
          }
        } catch { /* skip */ }
      }
    }
    return prompt;
  } catch {
    return prompt;
  }
}

// ── Check video progress via queue/data SSE stream ──
async function checkSelfForcingProgress(sessionHash: string): Promise<{
  status: string;
  progress?: number;
  streamUrl?: string;
  videoUrl?: string;
  message?: string;
}> {
  try {
    const res = await fetch(`${SELF_FORCING}/queue/data?session_hash=${sessionHash}`, {
      headers: { Accept: "text/event-stream" },
    });
    if (!res.ok || !res.body) return { status: "pending" };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let lastProgress = 0;
    let lastStreamUrl = "";
    let videoUrl = "";
    let lastStatus = "processing";
    const startTime = Date.now();

    while (Date.now() - startTime < 15000) { // 15s quick check
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const d = JSON.parse(line.slice(5).trim());
          const msg = d.msg || "";

          if (msg === "estimation") {
            const rank = d.rank;
            const eta = d.rank_eta;
            lastStatus = "queued";
            return {
              status: "queued",
              message: `Queue position: ${rank}${eta ? `, ETA: ${Math.round(eta)}s` : ""}`,
            };
          }

          if (msg === "process_starts") {
            lastStatus = "processing";
          }

          if (msg === "process_generating") {
            lastStatus = "processing";
            const out = d.output?.data || [];
            // Extract stream URL
            if (out[0]?.video?.url) {
              lastStreamUrl = out[0].video.url;
            }
            // Extract progress from HTML status
            if (typeof out[1] === "string") {
              const progressMatch = out[1].match(/width:\s*([\d.]+)%/);
              if (progressMatch) lastProgress = parseFloat(progressMatch[1]);
              const blockMatch = out[1].match(/Block (\d+)\/(\d+)/);
              const frameMatch = out[1].match(/Frame (\d+)/);
              if (blockMatch && frameMatch) {
                return {
                  status: "processing",
                  progress: lastProgress,
                  streamUrl: lastStreamUrl || undefined,
                  message: `Block ${blockMatch[1]}/${blockMatch[2]}, Frame ${frameMatch[1]} (${lastProgress.toFixed(1)}%)`,
                };
              }
            }
          }

          if (msg === "process_completed") {
            const out = d.output?.data || [];
            if (out[0]?.video?.url) videoUrl = out[0].video.url;
            if (out[0]?.url) videoUrl = out[0].url;
            reader.cancel();
            return {
              status: "complete",
              progress: 100,
              videoUrl: videoUrl || lastStreamUrl || undefined,
              streamUrl: lastStreamUrl || undefined,
            };
          }

          if (msg === "close_stream") {
            reader.cancel();
            if (lastProgress > 90 || videoUrl || lastStreamUrl) {
              return {
                status: "complete",
                progress: 100,
                videoUrl: videoUrl || undefined,
                streamUrl: lastStreamUrl || undefined,
              };
            }
            return { status: "complete", progress: 100, streamUrl: lastStreamUrl || undefined };
          }
        } catch { /* skip unparseable */ }
      }
    }

    reader.cancel();

    if (lastProgress > 0) {
      return {
        status: "processing",
        progress: lastProgress,
        streamUrl: lastStreamUrl || undefined,
      };
    }

    return { status: lastStatus };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Check failed" };
  }
}

// ── Wan Official: Submit video ──
async function submitVideoWanOfficial(prompt: string): Promise<{ eventId: string; sessionHash: string }> {
  const sessionHash = randomSessionHash();

  const res = await fetch(`${WAN_OFFICIAL}/queue/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [prompt, "480P", false, -1],
      fn_index: 3, // t2v_generation_async
      session_hash: sessionHash,
    }),
  });

  if (!res.ok) {
    throw new Error(`Wan Official submit failed (${res.status})`);
  }

  const { event_id } = await res.json();
  return { eventId: event_id, sessionHash };
}

// ── Kling AI: Generate JWT token for authentication ──
function generateKlingJWT(): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: KLING_ACCESS_KEY(),
    exp: now + 1800, // 30 minutes
    nbf: now - 5,
    iat: now,
  };

  const b64url = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64url");

  const headerB64 = b64url(header);
  const payloadB64 = b64url(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  // HMAC-SHA256 signature
  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", KLING_SECRET_KEY())
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

const KLING_BASE = "https://api.klingai.com";

// ── Kling AI: Submit text-to-video task ──
async function submitKlingVideo(prompt: string, duration = "5", model = "kling-v2-master"): Promise<{ taskId: string }> {
  if (!KLING_ACCESS_KEY() || !KLING_SECRET_KEY()) throw new Error("KLING_ACCESS_KEY/KLING_SECRET_KEY not set");

  const token = generateKlingJWT();

  const res = await fetch(`${KLING_BASE}/v1/videos/text2video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_name: model,
      prompt,
      negative_prompt: "low quality, blurry, distorted, watermark, text overlay",
      duration,
      cfg_scale: 0.5,
      mode: "std",
      aspect_ratio: "16:9",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Kling API failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.code !== 0) throw new Error(`Kling error: ${data.message || JSON.stringify(data)}`);

  const taskId = data.data?.task_id;
  if (!taskId) throw new Error("No task_id returned from Kling");
  return { taskId };
}

// ── Kling AI: Check task status ──
async function checkKlingStatus(taskId: string): Promise<{ status: string; videoUrl?: string; progress?: number }> {
  if (!KLING_ACCESS_KEY() || !KLING_SECRET_KEY()) throw new Error("Kling keys not set");

  const token = generateKlingJWT();

  const res = await fetch(`${KLING_BASE}/v1/videos/text2video/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return { status: "error" };
  }

  const data = await res.json();
  if (data.code !== 0) return { status: "error" };

  const taskStatus = data.data?.task_status;
  const taskResult = data.data?.task_result;

  if (taskStatus === "succeed" && taskResult?.videos?.[0]?.url) {
    return { status: "complete", videoUrl: taskResult.videos[0].url, progress: 100 };
  }
  if (taskStatus === "failed") {
    return { status: "error" };
  }
  // processing/submitted
  return { status: "processing", progress: taskStatus === "processing" ? 50 : 10 };
}

// ── Kling AI: Submit and poll until done (up to 90s) ──
async function generateVideoKling(prompt: string): Promise<{ videoUrl?: string; taskId: string; status: string }> {
  const { taskId } = await submitKlingVideo(prompt);

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < 90000) {
    await new Promise(r => setTimeout(r, 5000));
    const result = await checkKlingStatus(taskId);
    if (result.status === "complete") {
      return { videoUrl: result.videoUrl, taskId, status: "complete" };
    }
    if (result.status === "error") {
      return { taskId, status: "error" };
    }
  }

  return { taskId, status: "processing" };
}

// ── Replicate: Generate video via API ──
async function generateVideoReplicate(prompt: string): Promise<{ videoUrl?: string; predictionId?: string; status: string }> {
  if (!REPLICATE_TOKEN()) throw new Error("REPLICATE_API_TOKEN not set");

  // Create prediction using the models endpoint (correct format)
  const res = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${REPLICATE_TOKEN()}`,
    },
    body: JSON.stringify({
      input: { prompt },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Replicate failed (${res.status}): ${err.slice(0, 200)}`);
  }

  const prediction = await res.json();
  const predictionId = prediction.id;

  // Poll for completion (up to 90s)
  const startTime = Date.now();
  while (Date.now() - startTime < 90000) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN()}` },
    });
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();

    if (statusData.status === "succeeded") {
      const output = statusData.output;
      const videoUrl = typeof output === "string" ? output : Array.isArray(output) ? output[0] : output?.url;
      return { videoUrl, predictionId, status: "complete" };
    }
    if (statusData.status === "failed" || statusData.status === "canceled") {
      throw new Error(`Replicate prediction ${statusData.status}: ${statusData.error || ""}`);
    }
  }

  return { predictionId, status: "processing" };
}

// ── fal.ai: Generate video (free credits on signup) ──
async function generateVideoFal(prompt: string): Promise<{ videoUrl?: string; requestId?: string; status: string }> {
  if (!FAL_KEY()) throw new Error("FAL_KEY not set");

  const res = await fetch("https://queue.fal.run/fal-ai/minimax/video-01", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY()}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`fal.ai failed (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const requestId = data.request_id;

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < 90000) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://queue.fal.run/fal-ai/minimax/video-01/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY()}` },
    });
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(`https://queue.fal.run/fal-ai/minimax/video-01/requests/${requestId}`, {
        headers: { Authorization: `Key ${FAL_KEY()}` },
      });
      if (resultRes.ok) {
        const result = await resultRes.json();
        return { videoUrl: result.video?.url, requestId, status: "complete" };
      }
    }
    if (statusData.status === "FAILED") {
      throw new Error("fal.ai video generation failed");
    }
  }

  return { requestId, status: "processing" };
}

// ── Free image via Pollinations.ai (TESTED ✅ — instant, reliable) ──
function getPollinationsImageUrl(prompt: string, width = 1280, height = 720): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true`;
}

// ── Scene breakdown using AI ──
async function breakdownScenes(script: string, numScenes: number = 5): Promise<Array<{ scene: number; description: string; visualPrompt: string; duration: number }>> {
  const systemPrompt = `You are a video director for a professional Indian news channel. Break the following podcast script into ${numScenes} visual scenes for video production.

For each scene, provide:
1. A brief description of what's happening
2. A detailed visual prompt for AI video generation (cinematic, photorealistic)
3. Duration in seconds (total ~60-90 seconds)

Visual prompt rules:
- Cinematic language: "4K cinematic", "professional broadcast lighting"
- Composition: "medium shot", "wide establishing shot", "close-up"
- Mood: "dramatic lighting", "modern sleek studio"
- Motion: "camera slowly panning", "tracking shot", "zoom into"
- NEVER include text/titles in prompts
- Keep prompts under 80 words — concise but vivid

Return ONLY valid JSON array:
[{"scene": 1, "description": "Opening", "visualPrompt": "4K cinematic...", "duration": 15}]`;

  const userPrompt = `Break this podcast script into ${numScenes} visual scenes:\n\n${script.slice(0, 3000)}`;

  // Try Claude first
  if (ANTHROPIC_KEY()) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY(),
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
        const text = data.content?.[0]?.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch {}
  }

  // Gemini fallback
  if (GEMINI_KEY()) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error("No AI API available. Set GEMINI_API_KEY or ANTHROPIC_API_KEY.");
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { action } = body;

    // ── Generate scenes from script ──
    if (action === "generate-scenes") {
      const { script, numScenes = 5 } = body;
      if (!script) return NextResponse.json({ error: "Script is required" }, { status: 400 });

      const scenes = await breakdownScenes(script, numScenes);
      const scenesWithImages = scenes.map(s => ({
        ...s,
        imageUrl: getPollinationsImageUrl(s.visualPrompt),
      }));

      return NextResponse.json({ scenes: scenesWithImages });
    }

    // ── Enhance prompt for better video ──
    if (action === "enhance-prompt") {
      const { prompt } = body;
      if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
      const enhanced = await enhancePrompt(prompt);
      return NextResponse.json({ original: prompt, enhanced });
    }

    // ── Submit video generation (non-blocking) ──
    if (action === "generate-video") {
      const { prompt, enhance = true, provider } = body;
      if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

      const finalPrompt = enhance ? await enhancePrompt(prompt) : prompt;

      // Smart provider chain: Kling (best, 66 free/day) → Replicate → fal.ai → HuggingFace
      // User can force a specific provider with the "provider" param
      if (provider === "kling" || (!provider && KLING_ACCESS_KEY())) {
        try {
          const result = await generateVideoKling(finalPrompt);
          if (result.status === "complete" && result.videoUrl) {
            return NextResponse.json({ ...result, provider: "kling", prompt: finalPrompt });
          }
          // Still processing — return taskId for polling
          return NextResponse.json({
            status: "processing",
            provider: "kling",
            taskId: result.taskId,
            prompt: finalPrompt,
            message: "Kling AI video generating... Use check-status to poll.",
          });
        } catch (err) {
          console.error("Kling failed:", err);
          if (provider === "kling") {
            return NextResponse.json({ error: err instanceof Error ? err.message : "Kling failed" }, { status: 500 });
          }
        }
      }

      if (provider === "replicate" || (!provider && REPLICATE_TOKEN())) {
        try {
          const result = await generateVideoReplicate(finalPrompt);
          return NextResponse.json({ ...result, provider: "replicate", prompt: finalPrompt });
        } catch (err) {
          console.error("Replicate failed:", err);
          if (provider === "replicate") {
            return NextResponse.json({ error: err instanceof Error ? err.message : "Replicate failed" }, { status: 500 });
          }
        }
      }

      if (provider === "fal" || (!provider && FAL_KEY())) {
        try {
          const result = await generateVideoFal(finalPrompt);
          return NextResponse.json({ ...result, provider: "fal", prompt: finalPrompt });
        } catch (err) {
          console.error("fal.ai failed:", err);
          if (provider === "fal") {
            return NextResponse.json({ error: err instanceof Error ? err.message : "fal.ai failed" }, { status: 500 });
          }
        }
      }

      // Free HuggingFace fallback
      const hfProviders = [
        { name: "self-forcing", fn: () => submitVideoSelfForcing(finalPrompt) },
        { name: "wan-official", fn: () => submitVideoWanOfficial(finalPrompt) },
      ];

      for (const p of hfProviders) {
        try {
          const result = await p.fn();
          return NextResponse.json({
            status: "submitted",
            provider: p.name,
            eventId: result.eventId,
            sessionHash: result.sessionHash,
            prompt: finalPrompt,
            message: `Video queued on ${p.name}. Use check-status to poll progress.`,
          });
        } catch (err) {
          console.error(`${p.name} failed:`, err);
          continue;
        }
      }

      return NextResponse.json({
        error: "All video providers busy. Free HuggingFace GPU quota resets every few hours.",
        tip: "Set REPLICATE_API_TOKEN (free trial runs) or use Kling AI manually at https://app.klingai.com (66 free credits/day)",
        manualLinks: {
          kling: "https://app.klingai.com",
          selfForcing: "https://huggingface.co/spaces/multimodalart/self-forcing",
          wanOfficial: "https://huggingface.co/spaces/Wan-AI/Wan2.1",
        },
        prompt: finalPrompt,
      }, { status: 503 });
    }

    // ── Check video generation progress ──
    if (action === "check-status") {
      const { sessionHash, taskId, provider = "self-forcing" } = body;

      // Kling status check
      if (provider === "kling" && taskId) {
        const result = await checkKlingStatus(taskId);
        return NextResponse.json(result);
      }

      if (!sessionHash && !taskId) return NextResponse.json({ error: "sessionHash or taskId is required" }, { status: 400 });

      if (provider === "self-forcing") {
        const result = await checkSelfForcingProgress(sessionHash);
        return NextResponse.json(result);
      }

      // Wan Official — use same queue/data pattern
      try {
        const res = await fetch(`${WAN_OFFICIAL}/queue/data?session_hash=${sessionHash}`, {
          headers: { Accept: "text/event-stream" },
        });
        if (!res.ok) return NextResponse.json({ status: "pending" });
        const text = await res.text();

        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.msg === "process_completed") {
              const out = d.output?.data || [];
              return NextResponse.json({ status: "complete", videoUrl: out[0]?.url || out[0]?.video?.url });
            }
          } catch {}
        }
        return NextResponse.json({ status: "processing" });
      } catch {
        return NextResponse.json({ status: "error" });
      }
    }

    // ── Generate still image (instant, always works) ──
    if (action === "generate-image") {
      const { prompt, width = 1280, height = 720 } = body;
      if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
      return NextResponse.json({ imageUrl: getPollinationsImageUrl(prompt, width, height) });
    }

    return NextResponse.json({
      error: "Unknown action",
      available: ["generate-scenes", "enhance-prompt", "generate-video", "check-status", "generate-image"],
    }, { status: 400 });
  } catch (err) {
    console.error("Video gen error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Video generation failed" },
      { status: 500 }
    );
  }
}
