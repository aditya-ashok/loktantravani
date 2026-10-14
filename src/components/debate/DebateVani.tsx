"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Send, RotateCcw, Trophy, Bot, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { SUGGESTED_MOTIONS, debateApi } from "./shared";

type Turn = { role: "user" | "assistant"; content: string };
type Side = "for" | "against";
type Feedback = {
  scores: { evidence: number; logic: number; clarity: number; civility: number };
  strongest: string;
  missed: string;
  tip: string;
  verdict: string;
};

const MAX_ROUNDS = 5;

export default function DebateVani() {
  const { lang, t } = useLanguage();
  const [topic, setTopic] = useState("");
  const [side, setSide] = useState<Side>("for");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const rounds = messages.filter((m) => m.role === "user").length;
  const finished = rounds >= MAX_ROUNDS && !loading;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading, feedback]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || rounds >= MAX_ROUNDS) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const reply = await debateApi<string>({ action: "spar", topic, side, language: lang, messages: next });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const getFeedback = async () => {
    setLoading(true);
    setJudging(true);
    setError("");
    try {
      setFeedback(await debateApi<Feedback>({ action: "feedback", topic, side, language: lang, messages }));
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
    setJudging(false);
  };

  const reset = () => {
    setStarted(false);
    setMessages([]);
    setFeedback(null);
    setError("");
  };

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
            {t("Pick a motion", "प्रस्ताव चुनें")}
          </label>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            {SUGGESTED_MOTIONS.map((m) => {
              const label = lang === "hi" ? m.hi : m.en;
              return (
                <button
                  key={m.en}
                  onClick={() => setTopic(label)}
                  className={`text-left text-sm p-3 rounded border transition-colors ${
                    topic === label ? "border-orange-500 bg-orange-500/10" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={300}
            placeholder={t("…or write your own motion", "…या अपना प्रस्ताव लिखें")}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
            {t("Your side", "आपका पक्ष")}
          </label>
          <div className="flex gap-2">
            {(["for", "against"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 p-3 rounded border font-bold text-sm transition-colors ${
                  side === s
                    ? s === "for" ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {s === "for" ? t("FOR the motion", "प्रस्ताव के पक्ष में") : t("AGAINST the motion", "प्रस्ताव के विपक्ष में")}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-2">
            {t(`Debate Vani will argue the other side. ${MAX_ROUNDS} rounds, then you get scored.`, `डिबेट वाणी दूसरा पक्ष रखेगी। ${MAX_ROUNDS} राउंड, फिर आपका स्कोर।`)}
          </p>
        </div>

        <button
          disabled={!topic.trim()}
          onClick={() => setStarted(true)}
          className="w-full bg-gradient-to-r from-[#FF9933] to-orange-600 disabled:opacity-40 text-black font-black uppercase tracking-widest py-3 rounded"
        >
          {t("Start debate", "बहस शुरू करें")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 p-4 rounded border border-white/10 bg-white/5">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{t("Motion", "प्रस्ताव")}</p>
          <p className="font-bold">{topic}</p>
          <p className="text-xs mt-1 text-white/50">
            {t("You:", "आप:")}{" "}
            <span className={side === "for" ? "text-green-400" : "text-red-400"}>
              {side === "for" ? t("FOR", "पक्ष") : t("AGAINST", "विपक्ष")}
            </span>{" "}
            · {t("Round", "राउंड")} {Math.min(rounds + (loading ? 0 : 1), MAX_ROUNDS)}/{MAX_ROUNDS}
          </p>
        </div>
        <button onClick={reset} className="text-white/50 hover:text-white flex items-center gap-1 text-xs shrink-0">
          <RotateCcw className="w-3 h-3" /> {t("New", "नई")}
        </button>
      </div>

      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-center text-white/40 text-sm py-10">
            {t("Make your opening argument.", "अपना शुरुआती तर्क रखें।")}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-white/10" : "bg-orange-500/20 text-orange-400"}`}>
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-3 rounded text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-white/10" : "bg-orange-500/10 border border-orange-500/20"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {judging ? t("Judging…", "मूल्यांकन…") : t("Debate Vani is thinking…", "डिबेट वाणी सोच रही है…")}
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div ref={endRef} />
      </div>

      {feedback ? (
        <FeedbackCard feedback={feedback} />
      ) : finished ? (
        <button
          onClick={getFeedback}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9933] to-orange-600 text-black font-black uppercase tracking-widest py-3 rounded"
        >
          <Trophy className="w-4 h-4" /> {t("Get my score", "मेरा स्कोर देखें")}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
              maxLength={1500}
              placeholder={t("Your argument…", "आपका तर्क…")}
              className="flex-1 bg-white/5 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label={t("Send", "भेजें")}
              className="px-4 bg-orange-500 disabled:opacity-40 text-black rounded"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {rounds >= 2 && (
            <button onClick={getFeedback} disabled={loading} className="text-xs text-white/50 hover:text-orange-400">
              {t("End early and get scored →", "अभी समाप्त करें और स्कोर पाएं →")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const { t } = useLanguage();
  const labels: Record<keyof Feedback["scores"], string> = {
    evidence: t("Evidence", "प्रमाण"),
    logic: t("Logic", "तर्क"),
    clarity: t("Clarity", "स्पष्टता"),
    civility: t("Civility", "शालीनता"),
  };
  const scores = feedback.scores || ({} as Feedback["scores"]);
  const values = Object.values(scores).map(Number).filter((n) => !Number.isNaN(n));
  const total = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 10)) * 100) : 0;

  return (
    <div className="p-5 rounded border border-orange-500/30 bg-orange-500/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> {t("Your score", "आपका स्कोर")}
        </h3>
        <span className="text-3xl font-black">{total}<span className="text-base text-white/40">/100</span></span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(labels) as (keyof Feedback["scores"])[]).map((k) => (
          <div key={k}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/60">{labels[k]}</span>
              <span className="font-bold">{scores[k] ?? "–"}/10</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded">
              <div className="h-full bg-orange-500 rounded" style={{ width: `${Math.min(10, Number(scores[k]) || 0) * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="text-green-400 font-bold text-xs uppercase">{t("Strongest point", "सबसे मज़बूत तर्क")}</dt><dd>{feedback.strongest}</dd></div>
        <div><dt className="text-red-400 font-bold text-xs uppercase">{t("What you missed", "जो छूट गया")}</dt><dd>{feedback.missed}</dd></div>
        <div><dt className="text-orange-400 font-bold text-xs uppercase">{t("Tip", "सुझाव")}</dt><dd>{feedback.tip}</dd></div>
        <div><dt className="text-white/50 font-bold text-xs uppercase">{t("Verdict", "निर्णय")}</dt><dd>{feedback.verdict}</dd></div>
      </dl>
    </div>
  );
}
