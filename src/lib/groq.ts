/**
 * Groq LLM client (OpenAI-compatible chat completions).
 *
 * Groq is the PRIMARY text-generation backend for LoktantraVani. It's fast,
 * has a generous quota, and supports guaranteed-JSON output — which is more
 * reliable than free-form parsing.
 *
 * NOTE: Groq is TEXT-ONLY. Image generation (caricatures, article covers)
 * still runs on Gemini (see generateImage in ai-generator.ts).
 *
 * Models (see https://console.groq.com/docs/models):
 *   - llama-3.3-70b-versatile : default — strong quality, good Hindi/Devanagari
 *   - groq/compound           : agentic, has built-in WEB SEARCH (for URL topics)
 *   - llama-3.1-8b-instant    : fast/cheap fallback
 */

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GroqOpts {
  model?: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_WEB_MODEL = "groq/compound"; // has built-in web search / URL fetch

/** Call Groq chat completions and return the assistant message text. */
export async function callGroq(messages: GroqMessage[], opts: GroqOpts = {}): Promise<string> {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: opts.model || GROQ_DEFAULT_MODEL,
    messages,
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 8192,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  // Retry transient 429/503; surface Groq's real message so failures are actionable.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return (data?.choices?.[0]?.message?.content as string) || "";
    }

    const errText = await res.text().catch(() => "");
    let msg = "";
    try { msg = (JSON.parse(errText)?.error?.message as string) || ""; } catch { /* non-JSON body */ }

    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const retryAfter = Number(res.headers.get("retry-after")) || 0;
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 3000; // 3s, 6s
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(`Groq API error ${res.status}: ${msg || errText.slice(0, 200)}`);
  }
  throw new Error("Groq API: max retries exceeded");
}
