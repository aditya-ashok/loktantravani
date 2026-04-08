"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX, Languages, Sparkles, Loader2, Pause, Play, MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleAIBarProps {
  title: string;
  content: string; // HTML content
  summary: string;
  lang: string;
  postId: string;
  category: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

const DANGEROUS_TAGS = [
  "script", "iframe", "object", "embed", "form", "input", "textarea",
  "button", "link", "style", "meta", "base", "applet",
];

function sanitizeHtml(html: string): string {
  // Remove dangerous tags and their contents (for script/style/applet which have meaningful content to strip)
  for (const tag of ["script", "style", "applet"]) {
    const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    html = html.replace(re, "");
  }

  // Remove dangerous self-closing or open/close tags
  for (const tag of DANGEROUS_TAGS) {
    const openClose = new RegExp(`</?${tag}(\\s[^>]*)?>`, "gi");
    html = html.replace(openClose, "");
  }

  // Remove all on* event attributes (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove javascript: URLs from href and src attributes
  html = html.replace(/(href|src)\s*=\s*["']\s*javascript\s*:[^"']*["']/gi, "");
  html = html.replace(/(href|src)\s*=\s*javascript\s*:[^\s>]*/gi, "");

  // Remove data: URLs from src attributes (except data:image/)
  html = html.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, "");
  html = html.replace(/src\s*=\s*data:(?!image\/)[^\s>]*/gi, "");

  return html;
}

export default function ArticleAIBar({ title, content, summary, lang, postId, category }: ArticleAIBarProps) {
  // ── Voice Narration State ──
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── TL;DR State ──
  const [tldr, setTldr] = useState<string[] | null>(null);
  const [tldrLoading, setTldrLoading] = useState(false);
  const [showTldr, setShowTldr] = useState(false);

  // ── Translation State ──
  const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // ── Track reading history ──
  useEffect(() => {
    if (!postId) return;
    try {
      const history = JSON.parse(localStorage.getItem("lv_read_history") || "[]") as { id: string; cat: string; ts: number }[];
      // Remove duplicate
      const filtered = history.filter(h => h.id !== postId);
      filtered.unshift({ id: postId, cat: category, ts: Date.now() });
      // Keep last 100
      localStorage.setItem("lv_read_history", JSON.stringify(filtered.slice(0, 100)));
    } catch { /* ignore */ }
  }, [postId, category]);

  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Voice Narration (Gemini TTS → Browser fallback) ──
  const handleListen = useCallback(async () => {
    // If already playing with audio element
    if (playing && audioRef.current) {
      if (paused) { audioRef.current.play(); setPaused(false); }
      else { audioRef.current.pause(); setPaused(true); }
      return;
    }

    // If playing with browser TTS
    if (playing && !audioRef.current) {
      if (paused) { speechSynthesis.resume(); setPaused(false); }
      else { speechSynthesis.pause(); setPaused(true); }
      return;
    }

    // Start new — try Gemini TTS first
    setTtsLoading(true);
    setPlaying(true);
    setPaused(false);

    const plainText = `${title}. ${stripHtml(content).slice(0, 3500)}`;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText, lang }),
      });
      const data = await res.json();

      if (data.audio) {
        // Play Gemini TTS audio
        const audioSrc = `data:${data.mimeType || "audio/wav"};base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => { setPlaying(false); setPaused(false); audioRef.current = null; };
        audio.onerror = () => { setPlaying(false); setPaused(false); audioRef.current = null; };
        audioRef.current = audio;
        setTtsLoading(false);
        audio.play();
        return;
      }
    } catch { /* fallback */ }

    setTtsLoading(false);

    // Fallback: Browser Speech API
    if (!("speechSynthesis" in window)) {
      setPlaying(false);
      alert("Voice narration unavailable.");
      return;
    }

    speechSynthesis.cancel();
    const chunks = plainText.match(/.{1,3000}[.!?\s]|.{1,3000}/g) || [plainText];
    let chunkIdx = 0;
    const speakNext = () => {
      if (chunkIdx >= chunks.length) { setPlaying(false); setPaused(false); return; }
      const utter = new SpeechSynthesisUtterance(chunks[chunkIdx]);
      utter.lang = lang === "hi" ? "hi-IN" : "en-IN";
      utter.rate = 0.95;
      const voices = speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes(lang === "hi" ? "hi" : "en-IN"));
      if (indianVoice) utter.voice = indianVoice;
      utter.onend = () => { chunkIdx++; speakNext(); };
      utter.onerror = () => { setPlaying(false); setPaused(false); };
      utteranceRef.current = utter;
      speechSynthesis.speak(utter);
    };
    speakNext();
  }, [playing, paused, title, content, lang]);

  const handleStop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  }, []);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); speechSynthesis.cancel(); };
  }, []);

  // ── TL;DR Generation ──
  const handleTldr = async () => {
    if (tldr) { setShowTldr(!showTldr); return; }
    setTldrLoading(true);
    setShowTldr(true);
    try {
      const res = await fetch("/api/lok-post/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          action: "generateContent",
          body: {
            contents: [{ parts: [{ text: `Summarize this news article in exactly 3 bullet points. Each bullet should be one concise sentence (max 20 words). Return ONLY a JSON array of 3 strings, no markdown.\n\nTitle: ${title}\n\n${stripHtml(content).slice(0, 3000)}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
          },
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      try {
        const arr = JSON.parse(clean);
        if (Array.isArray(arr)) setTldr(arr.slice(0, 3));
        else setTldr(["Could not generate summary."]);
      } catch {
        // Try to extract bullet points from text
        const lines = text.split("\n").filter((l: string) => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().match(/^\d/));
        setTldr(lines.length > 0 ? lines.slice(0, 3).map((l: string) => l.replace(/^[-•\d.)\s]+/, "").trim()) : [text.slice(0, 200)]);
      }
    } catch {
      setTldr(["Summary unavailable — check your connection."]);
    }
    setTldrLoading(false);
  };

  // ── Translation ──
  const handleTranslate = async () => {
    if (translated) { setShowTranslation(!showTranslation); return; }
    setTranslating(true);
    setShowTranslation(true);
    const targetLang = lang === "hi" ? "English" : "Hindi (Devanagari script)";
    try {
      const res = await fetch("/api/lok-post/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          action: "generateContent",
          body: {
            contents: [{ parts: [{ text: `Translate this newspaper article to ${targetLang}. Maintain the HTML tags (<h2>, <p>, <blockquote>). Keep it professional and journalistic.\n\nTitle: ${title}\n\nContent:\n${content.slice(0, 5000)}\n\nReturn ONLY valid JSON:\n{"title":"translated title","content":"translated HTML content"}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 6000 },
          },
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      try {
        const parsed = JSON.parse(clean);
        setTranslated({ title: parsed.title || title, content: parsed.content || content });
      } catch {
        setTranslated({ title: `[${targetLang}] ${title}`, content: `<p>Translation failed. Please try again.</p>` });
      }
    } catch {
      setTranslated({ title: title, content: "<p>Translation unavailable.</p>" });
    }
    setTranslating(false);
  };

  // ── Ask AI Chat State ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const handleAskAI = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      const articleContext = `Title: ${title}\n\nContent: ${stripHtml(content).slice(0, 4000)}`;
      const conversationHistory = chatMessages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
        .join("\n");

      const res = await fetch("/api/lok-post/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          action: "generateContent",
          body: {
            contents: [
              {
                parts: [
                  {
                    text: `You are an AI assistant for LoktantraVani news. Answer the user's question about this article concisely (2-3 sentences max). If the question is unrelated to the article, politely redirect to the article topic.

Article:
${articleContext}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ""}
User question: ${question}

Reply in ${lang === "hi" ? "Hindi" : "English"}:`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
          },
        }),
      });
      const data = await res.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't answer that.";
      setChatMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <>
      {/* AI Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {/* TL;DR */}
        <button
          onClick={handleTldr}
          disabled={tldrLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest border-2 transition-all",
            showTldr && tldr
              ? "border-primary bg-primary text-white"
              : "border-black dark:border-white/30 hover:border-primary hover:text-primary dark:text-white"
          )}
        >
          {tldrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          TL;DR
        </button>

        {/* Listen */}
        <button
          onClick={playing ? (paused ? handleListen : handleStop) : handleListen}
          disabled={ttsLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest border-2 transition-all",
            playing
              ? "border-green-500 bg-green-500 text-white"
              : "border-black dark:border-white/30 hover:border-green-500 hover:text-green-600 dark:text-white"
          )}
        >
          {ttsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : playing ? (
            paused ? <Play className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          {playing ? (paused ? "Resume" : "Stop") : "Listen"}
        </button>

        {/* Translate */}
        <button
          onClick={handleTranslate}
          disabled={translating}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest border-2 transition-all",
            showTranslation && translated
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-black dark:border-white/30 hover:border-blue-500 hover:text-blue-600 dark:text-white"
          )}
        >
          {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
          {lang === "hi" ? "English" : "हिंदी"}
        </button>

        {/* Ask AI */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest border-2 transition-all",
            chatOpen
              ? "border-purple-500 bg-purple-500 text-white"
              : "border-black dark:border-white/30 hover:border-purple-500 hover:text-purple-600 dark:text-white"
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Ask AI
        </button>
      </div>

      {/* TL;DR Panel */}
      {showTldr && (
        <div className="mb-8 p-5 border-2 border-primary bg-primary/5 dark:bg-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-inter font-black uppercase tracking-widest text-primary">AI Summary — TL;DR</span>
          </div>
          {tldrLoading ? (
            <div className="flex items-center gap-2 text-sm font-inter opacity-60">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating summary...
            </div>
          ) : (
            <ul className="space-y-2">
              {tldr?.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm font-inter leading-relaxed dark:text-white">
                  <span className="text-primary font-black shrink-0">→</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Translation Panel */}
      {showTranslation && translated && (
        <div className="mb-8 p-5 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-inter font-black uppercase tracking-widest text-blue-600">
              AI Translation — {lang === "hi" ? "English" : "Hindi"}
            </span>
          </div>
          {translating ? (
            <div className="flex items-center gap-2 text-sm font-inter opacity-60">
              <Loader2 className="w-4 h-4 animate-spin" /> Translating...
            </div>
          ) : (
            <>
              <h3 className="text-xl font-newsreader font-bold mb-3 dark:text-white">{translated.title}</h3>
              <div
                className="prose prose-sm dark:prose-invert max-w-none font-inter"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(translated.content) }}
              />
            </>
          )}
        </div>
      )}

      {/* Ask AI Chat Panel */}
      {chatOpen && (
        <div className="mb-8 border-2 border-purple-500 bg-white dark:bg-[#111] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-purple-500 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px] font-inter font-black uppercase tracking-widest">
                Ask AI About This Article
              </span>
            </div>
            <button onClick={() => setChatOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-xs font-inter opacity-50 text-center py-4 dark:text-white/50">
                {lang === "hi"
                  ? "इस लेख के बारे में कुछ भी पूछें..."
                  : "Ask anything about this article..."}
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 text-sm font-inter",
                    msg.role === "user"
                      ? "bg-purple-500 text-white rounded-l-lg rounded-tr-lg"
                      : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white rounded-r-lg rounded-tl-lg"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-white/10 px-3 py-2 rounded-r-lg rounded-tl-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex border-t border-purple-200 dark:border-purple-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAI()}
              placeholder={lang === "hi" ? "अपना सवाल लिखें..." : "Type your question..."}
              className="flex-1 px-4 py-3 text-sm font-inter bg-transparent dark:text-white outline-none"
            />
            <button
              onClick={handleAskAI}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 text-purple-500 hover:text-purple-700 disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
