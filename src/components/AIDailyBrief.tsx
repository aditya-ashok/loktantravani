import { unstable_cache } from "next/cache";
import AIBriefClient from "./AIBriefClient";
import type { Post } from "@/lib/types";

const GROQ_KEY = () => (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();

type Brief = { en: string; hi: string } | null;

// Cache keyed on the headline list — a new lead story regenerates the brief,
// otherwise at most one Groq call per hour.
const getBrief = unstable_cache(
  async (headlines: string[]): Promise<Brief> => {
    const key = GROQ_KEY();
    if (!key || headlines.length === 0) return null;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 600,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are the morning-brief editor of LoktantraVani, an Indian digital newspaper. Given today's top headlines, write a tight 2-3 sentence editorial brief connecting them — confident, newsy, no fluff, no markdown. Return ONLY JSON: {\"en\": \"English brief\", \"hi\": \"Same brief in Hindi Devanagari\"}",
            },
            { role: "user", content: `Today's top headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}` },
          ],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(text);
      if (typeof parsed.en === "string" && parsed.en.length > 20) {
        return { en: parsed.en, hi: typeof parsed.hi === "string" ? parsed.hi : parsed.en };
      }
      return null;
    } catch {
      return null;
    }
  },
  ["ai-daily-brief"],
  { revalidate: 3600 }
);

export default async function AIDailyBrief({ posts }: { posts: Post[] }) {
  const brief = await getBrief(posts.map(p => p.title).filter(Boolean));
  if (!brief) return null;
  return <AIBriefClient en={brief.en} hi={brief.hi} />;
}
