"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, SkipForward, Mic, MicOff, Loader2, ShieldCheck,
  HelpCircle, FileText, Monitor, X, Copy, CheckCircle2, Trash2,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { SUGGESTED_MOTIONS, RATING_STYLE, debateApi, type FactCheck } from "./shared";

type Side = "FOR" | "AGAINST" | "MOD";
type Entry = { id: number; side: Side; text: string; check?: FactCheck; checking?: boolean };
type Phase = { side: Side; en: string; hi: string; mult: number };
type Questions = { opening: string; questions: { to: string; question: string }[] };
type Summary = { for: string[]; against: string[]; agreement: string[]; unresolved: string[]; headline: string };

// mult scales the per-speech minutes (rebuttals shorter, Q&A longer).
const PHASES: Phase[] = [
  { side: "MOD", en: "Introduction", hi: "परिचय", mult: 0.5 },
  { side: "FOR", en: "Opening — For", hi: "प्रारंभिक वक्तव्य — पक्ष", mult: 1 },
  { side: "AGAINST", en: "Opening — Against", hi: "प्रारंभिक वक्तव्य — विपक्ष", mult: 1 },
  { side: "FOR", en: "Rebuttal — For", hi: "खंडन — पक्ष", mult: 0.6 },
  { side: "AGAINST", en: "Rebuttal — Against", hi: "खंडन — विपक्ष", mult: 0.6 },
  { side: "MOD", en: "Moderator & audience questions", hi: "संचालक व दर्शकों के प्रश्न", mult: 2 },
  { side: "AGAINST", en: "Closing — Against", hi: "समापन — विपक्ष", mult: 0.6 },
  { side: "FOR", en: "Closing — For", hi: "समापन — पक्ष", mult: 0.6 },
];

const SIDE_STYLE: Record<Side, string> = {
  FOR: "text-green-400 border-green-500/40",
  AGAINST: "text-red-400 border-red-500/40",
  MOD: "text-orange-400 border-orange-500/40",
};

const STORAGE_KEY = "lv-debate-moderator";

type Persisted = {
  topic: string; background: string; forName: string; againstName: string;
  minutes: number; phase: number; entries: Entry[];
};

// Minimal Web Speech API typing (not in TS's DOM lib).
type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

// Restore a debate in progress (survives an accidental reload mid-event).
// Safe without a hydration mismatch: this tab only mounts after a client click.
function loadSaved(): Partial<Persisted> {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Persisted | null) || {};
  } catch {
    return {};
  }
}

function fmt(sec: number) {
  const s = Math.abs(sec);
  return `${sec < 0 ? "-" : ""}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function LiveModerator() {
  const { lang, t } = useLanguage();

  const [saved] = useState(loadSaved);
  const [topic, setTopic] = useState(saved.topic || "");
  const [background, setBackground] = useState(saved.background || "");
  const [forName, setForName] = useState(saved.forName || "");
  const [againstName, setAgainstName] = useState(saved.againstName || "");
  const [minutes, setMinutes] = useState(saved.minutes || 3);
  const [phase, setPhase] = useState(Math.min(saved.phase || 0, PHASES.length - 1));
  const [entries, setEntries] = useState<Entry[]>(() => (saved.entries || []).map((e) => ({ ...e, checking: false })));

  const [remaining, setRemaining] = useState(() => Math.round(minutes * PHASES[phase].mult * 60));
  const [running, setRunning] = useState(false);

  const [draft, setDraft] = useState("");
  const [draftSide, setDraftSide] = useState<Side>(PHASES[phase].side);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  const [questions, setQuestions] = useState<Questions | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState<"" | "questions" | "summary">("");
  const [error, setError] = useState("");
  const [projector, setProjector] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = PHASES[phase];
  const phaseSeconds = Math.round(minutes * current.mult * 60);
  const nameFor = (side: Side) =>
    side === "FOR" ? forName || t("For", "पक्ष") : side === "AGAINST" ? againstName || t("Against", "विपक्ष") : t("Moderator", "संचालक");

  useEffect(() => {
    try {
      const data: Persisted = { topic, background, forName, againstName, minutes, phase, entries };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage unavailable */ }
  }, [topic, background, forName, againstName, minutes, phase, entries]);

  // Each phase starts with a fresh, paused clock and its speaker preselected.
  const goToPhase = (next: number) => {
    const i = Math.max(0, Math.min(next, PHASES.length - 1));
    setPhase(i);
    setRemaining(Math.round(minutes * PHASES[i].mult * 60));
    setRunning(false);
    setDraftSide(PHASES[i].side);
  };

  const changeMinutes = (value: number) => {
    setMinutes(value);
    setRemaining(Math.round(value * current.mult * 60));
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const addEntry = useCallback((side: Side, text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setEntries((prev) => [...prev, { id: Date.now() + Math.random(), side, text: clean }]);
  }, []);

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setError(t("Live transcription needs Chrome or Edge. You can still type statements.", "लाइव ट्रांसक्रिप्शन के लिए Chrome या Edge चाहिए। आप टाइप कर सकते हैं।"));
      return;
    }
    const rec = new Ctor();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      }
      if (text.trim()) setDraft((d) => (d ? d + " " : "") + text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => () => recRef.current?.stop(), []);

  const commitDraft = () => {
    addEntry(draftSide, draft);
    setDraft("");
  };

  const factCheck = async (entry: Entry) => {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, checking: true } : e)));
    try {
      const check = await debateApi<FactCheck>({
        action: "factcheck", topic, language: lang, speaker: nameFor(entry.side), statement: entry.text,
      });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, check, checking: false } : e)));
    } catch (err) {
      setError((err as Error).message);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, checking: false } : e)));
    }
  };

  const genQuestions = async () => {
    setBusy("questions");
    setError("");
    try {
      setQuestions(await debateApi<Questions>({ action: "questions", topic, context: background, language: lang }));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy("");
  };

  const transcript = () =>
    entries.map((e) => `${e.side === "MOD" ? "MODERATOR" : `${e.side} (${nameFor(e.side)})`}: ${e.text}`).join("\n\n");

  const genSummary = async () => {
    setBusy("summary");
    setError("");
    try {
      setSummary(await debateApi<Summary>({ action: "summary", topic, language: lang, transcript: transcript() }));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy("");
  };

  const copyArticle = () => {
    if (!summary) return;
    const list = (items: string[]) => items.map((i) => `• ${i}`).join("\n");
    const text = [
      summary.headline,
      "",
      `${t("Motion", "प्रस्ताव")}: ${topic}`,
      `${t("For", "पक्ष")}: ${nameFor("FOR")} · ${t("Against", "विपक्ष")}: ${nameFor("AGAINST")}`,
      "",
      `${t("Case for", "पक्ष के तर्क")}:\n${list(summary.for)}`,
      "",
      `${t("Case against", "विपक्ष के तर्क")}:\n${list(summary.against)}`,
      summary.agreement.length ? `\n${t("Common ground", "सहमति के बिंदु")}:\n${list(summary.agreement)}` : "",
      summary.unresolved.length ? `\n${t("Still unresolved", "अनसुलझे प्रश्न")}:\n${list(summary.unresolved)}` : "",
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    if (!confirm(t("Clear this debate and its transcript?", "यह बहस और उसका ट्रांसक्रिप्ट मिटाएं?"))) return;
    setEntries([]);
    goToPhase(0);
    setQuestions(null);
    setSummary(null);
  };

  const latestCheck = [...entries].reverse().find((e) => e.check?.claims?.length);
  const overtime = remaining < 0;
  const warning = remaining >= 0 && remaining <= 30;

  const timer = (big: boolean) => (
    <div
      className={`font-black tabular-nums ${big ? "text-[22vw] md:text-[16vw] leading-none" : "text-6xl"} ${
        overtime ? "text-red-500 animate-pulse" : warning ? "text-yellow-400" : "text-white"
      }`}
    >
      {fmt(remaining)}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Setup */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">{t("Motion", "प्रस्ताव")}</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            list="lv-motions"
            maxLength={300}
            placeholder={t("e.g. One Nation, One Election is good for Indian democracy", "उदा. एक राष्ट्र, एक चुनाव भारतीय लोकतंत्र के लिए अच्छा है")}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:outline-none focus:border-orange-500"
          />
          <datalist id="lv-motions">
            {SUGGESTED_MOTIONS.map((m) => <option key={m.en} value={lang === "hi" ? m.hi : m.en} />)}
          </datalist>
        </div>
        <input value={forName} onChange={(e) => setForName(e.target.value)} placeholder={t("Speaker FOR (name / team)", "पक्ष वक्ता (नाम / टीम)")}
          className="bg-white/5 border border-green-500/30 rounded p-3 text-sm focus:outline-none focus:border-green-500" />
        <input value={againstName} onChange={(e) => setAgainstName(e.target.value)} placeholder={t("Speaker AGAINST (name / team)", "विपक्ष वक्ता (नाम / टीम)")}
          className="bg-white/5 border border-red-500/30 rounded p-3 text-sm focus:outline-none focus:border-red-500" />
        <textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={2} maxLength={1500}
          placeholder={t("Optional background for the AI (key facts, the news hook)…", "AI के लिए वैकल्पिक पृष्ठभूमि (मुख्य तथ्य, खबर)…")}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:border-orange-500" />
        <label className="flex items-center gap-3 text-sm text-white/60">
          {t("Minutes per opening speech", "प्रति वक्तव्य मिनट")}
          <input type="number" min={1} max={15} value={minutes}
            onChange={(e) => changeMinutes(Math.max(1, Math.min(15, Number(e.target.value) || 3)))}
            className="w-16 bg-white/5 border border-white/10 rounded p-2 text-center" />
        </label>
      </section>

      {error && (
        <p className="text-red-400 text-sm flex items-center justify-between gap-2">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss"><X className="w-4 h-4" /></button>
        </p>
      )}

      {/* Stage: phase + timer */}
      <section className="rounded border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap gap-1.5 mb-5">
          {PHASES.map((p, i) => (
            <button key={i} onClick={() => goToPhase(i)}
              className={`text-[11px] px-2 py-1 rounded border ${i === phase ? `${SIDE_STYLE[p.side]} bg-white/10 font-bold` : "border-white/10 text-white/40 hover:text-white"}`}>
              {i + 1}. {lang === "hi" ? p.hi : p.en}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${SIDE_STYLE[current.side].split(" ")[0]}`}>
              {lang === "hi" ? current.hi : current.en}
            </p>
            <p className="text-2xl font-black mt-1">{nameFor(current.side)}</p>
            {overtime && <p className="text-red-400 text-sm font-bold mt-1">{t("Time is up", "समय समाप्त")}</p>}
          </div>
          {timer(false)}
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={() => setRunning((r) => !r)} className="flex items-center gap-2 px-4 py-2 rounded bg-orange-500 text-black font-bold text-sm">
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {running ? t("Pause", "रोकें") : t("Start", "शुरू")}
          </button>
          <button onClick={() => { setRemaining(phaseSeconds); setRunning(false); }} className="flex items-center gap-2 px-4 py-2 rounded border border-white/20 text-sm">
            <RotateCcw className="w-4 h-4" /> {t("Reset", "रीसेट")}
          </button>
          <button onClick={() => goToPhase(phase + 1)} disabled={phase === PHASES.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded border border-white/20 text-sm disabled:opacity-40">
            <SkipForward className="w-4 h-4" /> {t("Next phase", "अगला चरण")}
          </button>
          <button onClick={() => setProjector(true)} className="flex items-center gap-2 px-4 py-2 rounded border border-white/20 text-sm ml-auto">
            <Monitor className="w-4 h-4" /> {t("Projector view", "प्रोजेक्टर दृश्य")}
          </button>
        </div>
      </section>

      {/* Moderator questions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4 text-orange-400" /> {t("Moderator questions", "संचालक प्रश्न")}</h2>
          <button onClick={genQuestions} disabled={!topic.trim() || busy !== ""} className="text-xs px-3 py-1.5 rounded border border-orange-500/40 text-orange-400 disabled:opacity-40 flex items-center gap-1">
            {busy === "questions" && <Loader2 className="w-3 h-3 animate-spin" />} {questions ? t("Regenerate", "फिर से बनाएं") : t("Generate", "बनाएं")}
          </button>
        </div>
        {questions && (
          <div className="space-y-3 text-sm">
            <p className="p-3 rounded bg-white/5 text-white/80 italic">{questions.opening}</p>
            <ol className="space-y-2">
              {questions.questions?.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border h-fit ${SIDE_STYLE[(q.to === "FOR" || q.to === "AGAINST" ? q.to : "MOD") as Side]}`}>
                    {q.to === "FOR" ? nameFor("FOR") : q.to === "AGAINST" ? nameFor("AGAINST") : t("Both", "दोनों")}
                  </span>
                  <span>{q.question}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Transcript + fact-check */}
      <section>
        <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-orange-400" /> {t("Transcript & fact-check", "ट्रांसक्रिप्ट व तथ्य-जांच")}</h2>
        <div className="rounded border border-white/10 p-3 space-y-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            {(["FOR", "AGAINST", "MOD"] as Side[]).map((s) => (
              <button key={s} onClick={() => setDraftSide(s)}
                className={`text-xs px-2 py-1 rounded border ${draftSide === s ? `${SIDE_STYLE[s]} bg-white/10 font-bold` : "border-white/10 text-white/40"}`}>
                {nameFor(s)}
              </button>
            ))}
          </div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={2000}
            placeholder={t("Type or dictate what the speaker said…", "वक्ता ने जो कहा उसे टाइप करें या बोलें…")}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:border-orange-500" />
          <div className="flex gap-2">
            <button onClick={toggleMic}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm border ${listening ? "border-red-500 text-red-400 animate-pulse" : "border-white/20"}`}>
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {listening ? t("Stop listening", "सुनना बंद") : t("Dictate", "बोलकर लिखें")}
            </button>
            <button onClick={commitDraft} disabled={!draft.trim()} className="px-4 py-2 rounded bg-white/10 text-sm font-bold disabled:opacity-40">
              {t("Add to transcript", "ट्रांसक्रिप्ट में जोड़ें")}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {entries.length === 0 && <p className="text-white/40 text-sm">{t("No statements yet.", "अभी कोई वक्तव्य नहीं।")}</p>}
          {entries.map((e) => (
            <div key={e.id} className={`border-l-2 pl-3 ${SIDE_STYLE[e.side].split(" ")[1]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold ${SIDE_STYLE[e.side].split(" ")[0]}`}>{nameFor(e.side)}</span>
                <div className="flex items-center gap-2">
                  {e.side !== "MOD" && (
                    <button onClick={() => factCheck(e)} disabled={e.checking || !topic.trim()}
                      className="text-[11px] flex items-center gap-1 text-orange-400 disabled:opacity-40">
                      {e.checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} {t("Fact-check", "जांचें")}
                    </button>
                  )}
                  <button onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))} aria-label={t("Remove", "हटाएं")} className="text-white/30 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm mt-1">{e.text}</p>
              {e.check && <FactCheckList check={e.check} />}
            </div>
          ))}
        </div>
      </section>

      {/* Summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> {t("Neutral summary", "निष्पक्ष सारांश")}</h2>
          <button onClick={genSummary} disabled={!entries.length || !topic.trim() || busy !== ""}
            className="text-xs px-3 py-1.5 rounded border border-orange-500/40 text-orange-400 disabled:opacity-40 flex items-center gap-1">
            {busy === "summary" && <Loader2 className="w-3 h-3 animate-spin" />} {t("Summarise debate", "सारांश बनाएं")}
          </button>
        </div>
        {summary && (
          <div className="rounded border border-white/10 p-4 space-y-4 text-sm">
            <p className="font-black text-lg">{summary.headline}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <SummaryList title={`${t("For", "पक्ष")} — ${nameFor("FOR")}`} items={summary.for} cls="text-green-400" />
              <SummaryList title={`${t("Against", "विपक्ष")} — ${nameFor("AGAINST")}`} items={summary.against} cls="text-red-400" />
              <SummaryList title={t("Common ground", "सहमति के बिंदु")} items={summary.agreement} cls="text-orange-400" />
              <SummaryList title={t("Still unresolved", "अनसुलझे प्रश्न")} items={summary.unresolved} cls="text-white/60" />
            </div>
            <button onClick={copyArticle} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-white/10">
              {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} {t("Copy as article draft", "लेख ड्राफ्ट के रूप में कॉपी करें")}
            </button>
          </div>
        )}
      </section>

      <button onClick={resetAll} className="text-xs text-white/40 hover:text-red-400">{t("Clear debate", "बहस मिटाएं")}</button>

      {/* Projector / audience screen */}
      {projector && (
        <div className="fixed inset-0 z-[100] bg-[#0a0a0f] text-white flex flex-col p-6 md:p-12">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="flex items-start justify-between gap-4">
            <p className="text-xl md:text-3xl font-bold text-white/80 max-w-4xl">{topic || t("Loktantra Debate", "लोकतंत्र बहस")}</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setRunning((r) => !r)} aria-label={running ? "Pause" : "Start"} className="p-2 rounded border border-white/20">
                {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={() => goToPhase(phase + 1)} aria-label="Next phase" className="p-2 rounded border border-white/20">
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={() => setProjector(false)} aria-label="Close" className="p-2 rounded border border-white/20"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className={`text-lg md:text-2xl font-bold uppercase tracking-widest ${SIDE_STYLE[current.side].split(" ")[0]}`}>
              {lang === "hi" ? current.hi : current.en}
            </p>
            <p className="text-3xl md:text-6xl font-black mt-2 mb-4">{nameFor(current.side)}</p>
            {timer(true)}
          </div>
          {latestCheck?.check && (
            <div className="max-w-4xl mx-auto w-full">
              <p className="text-xs uppercase tracking-widest text-orange-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {t("AI fact-check", "AI तथ्य-जांच")} — {nameFor(latestCheck.side)}
              </p>
              <FactCheckList check={latestCheck.check} large />
            </div>
          )}
          <p className="text-center text-xs text-white/30 mt-4">LoktantraVani · {t("AI co-moderator — judges arguments, not ideologies", "AI सह-संचालक — तर्कों को परखता है, विचारधाराओं को नहीं")}</p>
        </div>
      )}
    </div>
  );
}

function FactCheckList({ check, large }: { check: FactCheck; large?: boolean }) {
  const { t } = useLanguage();
  const labels: Record<string, string> = {
    accurate: t("Accurate", "सही"),
    misleading: t("Misleading", "भ्रामक"),
    false: t("False", "गलत"),
    unverified: t("Unverified", "अपुष्ट"),
  };
  if (!check.claims?.length) {
    return <p className="text-xs text-white/40 mt-2">{t("No checkable factual claims found.", "जांच योग्य कोई तथ्यात्मक दावा नहीं मिला।")}</p>;
  }
  return (
    <ul className={`mt-2 space-y-2 ${large ? "text-base md:text-lg" : "text-xs"}`}>
      {check.claims.map((c, i) => (
        <li key={i} className="flex gap-2 items-start">
          <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded border ${RATING_STYLE[c.rating] || RATING_STYLE.unverified}`}>
            {labels[c.rating] || labels.unverified}
          </span>
          <span>
            <span className="font-semibold">{c.claim}</span> — <span className="text-white/60">{c.note}</span>
            {c.source && <span className="text-white/40"> ({c.source})</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SummaryList({ title, items, cls }: { title: string; items: string[]; cls: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${cls}`}>{title}</p>
      <ul className="list-disc pl-4 space-y-1 text-white/80">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}
