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
 *   - openai/gpt-oss-120b : default (override with GROQ_MODEL). Reasoning model —
 *     run at low reasoning effort so thinking doesn't eat the max_tokens budget.
 *   - GROQ_WEB_MODEL      : the same model with the built-in browser_search tool.
 * The Llama models and groq/compound were retired from our account (Oct 2026).
 */

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GroqOpts {
  model?: string;
  jsonMode?: boolean;
  /** Let the model search the web. Groq can't combine this with JSON mode, so
   *  jsonMode is ignored and the prompt itself must ask for JSON. */
  webSearch?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export const GROQ_DEFAULT_MODEL = (process.env.GROQ_MODEL || "openai/gpt-oss-120b").trim();
/** Pseudo model id: the default model plus web search (see callGroq). */
export const GROQ_WEB_MODEL = "web-search";

/** Call Groq chat completions and return the assistant message text. */
export async function callGroq(messages: GroqMessage[], opts: GroqOpts = {}): Promise<string> {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const webSearch = opts.webSearch || opts.model === GROQ_WEB_MODEL;
  const model = !opts.model || opts.model === GROQ_WEB_MODEL ? GROQ_DEFAULT_MODEL : opts.model;
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 8192,
  };
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "low";
  if (webSearch) body.tools = [{ type: "browser_search" }];
  else if (opts.jsonMode) body.response_format = { type: "json_object" };

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
