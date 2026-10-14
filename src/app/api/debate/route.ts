/**
 * POST /api/debate — AI for debates (Groq).
 *
 * Actions:
 *   spar      — Debate Vani argues the opposite side against a reader
 *   feedback  — scores the reader's arguments after a spar
 *   questions — balanced moderator questions for a live debate
 *   factcheck — checks claims in a speaker's statement (web-search model)
 *   summary   — neutral round summary from the live transcript
 */

import { NextRequest, NextResponse } from "next/server";
import { callGroq, GROQ_WEB_MODEL, type GroqMessage } from "@/lib/groq";

export const maxDuration = 60;

type Action = "spar" | "feedback" | "questions" | "factcheck" | "summary";
const ACTIONS: Action[] = ["spar", "feedback", "questions", "factcheck", "summary"];

type Turn = { role: "user" | "assistant"; content: string };

const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const requestLog = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < REQUEST_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

const NEUTRALITY = `You are strictly non-partisan. You never endorse a party, leader, or ideology, never tell anyone how to vote, and judge only the quality of arguments: evidence, logic, clarity, and respect. Never invent statistics, quotes, or sources; if unsure of a figure, say "approximately" or "reportedly" or omit it. Avoid personal allegations against named individuals.`;

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function turns(value: unknown, maxTurns: number): Turn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is Turn => !!t && typeof t === "object"
      && ((t as Turn).role === "user" || (t as Turn).role === "assistant")
      && typeof (t as Turn).content === "string" && (t as Turn).content.trim().length > 0)
    .slice(-maxTurns)
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, 1500) }));
}

/** Pull the first JSON object out of a model reply (web model can't use JSON mode). */
function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model reply");
  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action as Action;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const topic = str(body.topic, 300);
  if (!topic) return NextResponse.json({ error: "A debate topic is required." }, { status: 400 });
  const language = body.language === "hi" ? "Hindi (Devanagari script)" : "English";

  try {
    switch (action) {
      case "spar": {
        const userSide = body.side === "against" ? "AGAINST" : "FOR";
        const aiSide = userSide === "FOR" ? "AGAINST" : "FOR";
        const history = turns(body.messages, 10);
        if (!history.length || history[history.length - 1].role !== "user") {
          return NextResponse.json({ error: "Make your argument first." }, { status: 400 });
        }
        const system = `You are Debate Vani, the sparring partner of LoktantraVani, an Indian news publication. Motion: "${topic}". The reader argues ${userSide} the motion; you argue ${aiSide}, firmly but respectfully, as a skilled debater would. ${NEUTRALITY}
Rules: Directly rebut the reader's latest point first, then add at most one new argument of your own. Keep it under 130 words. If the reader is abusive, calmly ask them to keep it civil. End with one sharp question that challenges their position. Reply in ${language}, plain text, no headings.`;
        const reply = await callGroq([{ role: "system", content: system }, ...history] as GroqMessage[], {
          temperature: 0.7,
          maxTokens: 400,
        });
        return NextResponse.json({ result: reply.trim() }, { headers: { "Cache-Control": "no-store" } });
      }

      case "feedback": {
        const userSide = body.side === "against" ? "AGAINST" : "FOR";
        const history = turns(body.messages, 20);
        const transcript = history
          .map((t) => `${t.role === "user" ? "READER" : "DEBATE VANI"}: ${t.content}`)
          .join("\n\n");
        const system = `You are an impartial debate judge. ${NEUTRALITY} Evaluate ONLY the READER's performance (they argued ${userSide} the motion "${topic}"). Reply in ${language} as JSON: {"scores":{"evidence":0-10,"logic":0-10,"clarity":0-10,"civility":0-10},"strongest":"their best point, one sentence","missed":"the strongest counter-argument they left unanswered, one sentence","tip":"one concrete tip to improve","verdict":"two-sentence overall assessment"}`;
        const raw = await callGroq(
          [{ role: "system", content: system }, { role: "user", content: transcript }],
          { jsonMode: true, temperature: 0.3, maxTokens: 600 },
        );
        return NextResponse.json({ result: JSON.parse(raw) });
      }

      case "questions": {
        const context = str(body.context, 1500);
        const system = `You are the moderator of a live political debate in India. ${NEUTRALITY} Reply in ${language} as JSON: {"opening":"a one-paragraph neutral introduction of the motion for the audience","questions":[{"to":"FOR"|"AGAINST"|"BOTH","question":"..."}]}. Give 8 questions, balanced between sides, each probing the weakest part of that side's likely case, plus 2 for BOTH.`;
        const raw = await callGroq(
          [{ role: "system", content: system }, { role: "user", content: `Motion: ${topic}${context ? `\nBackground: ${context}` : ""}` }],
          { jsonMode: true, temperature: 0.6, maxTokens: 1200 },
        );
        return NextResponse.json({ result: JSON.parse(raw) });
      }

      case "factcheck": {
        const statement = str(body.statement, 2000);
        const speaker = str(body.speaker, 60) || "Speaker";
        if (!statement) return NextResponse.json({ error: "Nothing to fact-check." }, { status: 400 });
        const system = `You are a live fact-checker for a debate on "${topic}". ${NEUTRALITY} Search the web as needed. Extract up to 4 checkable factual claims (numbers, dates, events, laws) from the statement — ignore opinions. Reply ONLY with JSON, in ${language}: {"claims":[{"claim":"...","rating":"accurate"|"misleading"|"false"|"unverified","note":"one-sentence neutral context","source":"publication or body name, if known"}]}. Use "unverified" whenever you are not confident.`;
        const raw = await callGroq(
          [{ role: "system", content: system }, { role: "user", content: `${speaker} said: "${statement}"` }],
          { model: GROQ_WEB_MODEL, temperature: 0.1, maxTokens: 1200 },
        );
        return NextResponse.json({ result: parseJson(raw) });
      }

      case "summary": {
        const transcript = str(body.transcript, 12000);
        if (!transcript) return NextResponse.json({ error: "The transcript is empty." }, { status: 400 });
        const system = `You summarise a live debate on "${topic}" for the audience. ${NEUTRALITY} Give equal weight to both sides. Reply in ${language} as JSON: {"for":["2-4 strongest FOR points"],"against":["2-4 strongest AGAINST points"],"agreement":["points both sides accepted, may be empty"],"unresolved":["open questions"],"headline":"a neutral one-line headline for an article on this debate"}`;
        const raw = await callGroq(
          [{ role: "system", content: system }, { role: "user", content: transcript }],
          { jsonMode: true, temperature: 0.3, maxTokens: 1200 },
        );
        return NextResponse.json({ result: JSON.parse(raw) });
      }
    }
  } catch (error) {
    console.error("[debate]", action, error);
    return NextResponse.json({ error: "The AI is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
