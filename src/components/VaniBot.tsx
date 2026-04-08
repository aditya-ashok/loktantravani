"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VaniBotProps {
  articleContext?: string;
  articleTitle?: string;
}

export default function VaniBot({ articleContext, articleTitle }: VaniBotProps) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t(
        articleTitle
          ? `Hi! I'm Vani AI. I've read "${articleTitle}". Ask me anything about it or today's news!`
          : `Hi! I'm Vani AI, your editorial assistant. Ask me about any of today's articles or news!`,
        articleTitle
          ? `नमस्ते! मैं वाणी एआई हूँ। मैंने "${articleTitle}" पढ़ लिया है। इसके बारे में या आज की किसी भी खबर के बारे में पूछें!`
          : `नमस्ते! मैं वाणी एआई हूँ। आज के किसी भी लेख या समाचार के बारे में मुझसे पूछें!`
      )
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch recent headlines for broader context
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/list-posts?limit=15");
        const data = await res.json();
        if (data.posts) {
          setHeadlines(data.posts.map((p: { title: string; summary?: string; category?: string }) =>
            `- [${p.category || "News"}] ${p.title}${p.summary ? ` — ${p.summary.slice(0, 100)}` : ""}`
          ).join("\n"));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          messages: [
            {
              role: "system",
              content: `You are Vani AI, a helpful editorial assistant for LoktantraVani — India's First AI Newspaper.
${articleTitle ? `You are currently discussing: "${articleTitle}".
Article context: "${articleContext?.slice(0, 3000)}".` : ""}
${headlines ? `Today's headlines on LoktantraVani:\n${headlines}` : ""}
Be concise, professional, and insightful. Answer questions about any article or news topic.
Answer in the same language as the user's query (Hindi or English).`
            },
            ...messages.slice(-5), // Send last 5 for context
            { role: "user", content: userMsg }
          ]
        }),
      });
      const data = await res.json();
      if (data.result) {
        setMessages(prev => [...prev, { role: "assistant", content: data.result }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-14 h-14 bg-black text-white border-2 border-primary flex items-center justify-center hover:scale-110 transition-all shadow-[8px_8px_0px_0px_rgba(255,153,51,0.3)]",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className={cn(
              "fixed right-6 bottom-6 z-[110] bg-white dark:bg-[#0d0d0d] border-4 border-black dark:border-white shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] flex flex-col",
              isExpanded ? "w-full max-w-2xl h-[80vh]" : "w-80 md:w-96 h-[500px]"
            )}
          >
            {/* Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-newsreader font-black text-lg">V</div>
                <div>
                   <h4 className="text-[10px] font-inter font-black uppercase tracking-widest leading-none">Vani AI Assistant</h4>
                   <p className="text-[8px] font-inter opacity-60 uppercase mt-1 leading-none">Editorial Expert</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="opacity-40 hover:opacity-100 transition-opacity">
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Badge */}
            {articleTitle && (
                <div className="px-4 py-2 bg-primary/5 border-b border-black/5 flex items-center gap-2 overflow-hidden">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[8px] font-inter font-bold uppercase truncate opacity-60">Discussing: {articleTitle}</span>
                </div>
            )}

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 font-inter text-sm"
            >
              {messages.map((m, i) => (
                <div key={i} className={cn(
                    "flex gap-3",
                    m.role === "user" ? "flex-row-reverse" : ""
                )}>
                    <div className={cn(
                        "w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-bold",
                        m.role === "assistant" ? "bg-primary/20 text-primary" : "bg-black text-white"
                    )}>
                        {m.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={cn(
                        "p-3 rounded-none border",
                        m.role === "assistant" ? "bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/5" : "bg-black text-white border-black"
                    )}>
                        {m.content}
                    </div>
                </div>
              ))}
              {loading && (
                  <div className="flex gap-3">
                      <div className="w-6 h-6 bg-primary/20 text-primary flex items-center justify-center">
                          <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                      <div className="p-3 bg-gray-50 border border-black/5 italic text-xs">
                          Thinking...
                      </div>
                  </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t-2 border-black/10 dark:border-white/10 flex gap-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("Ask Vani AI...", "वाणी से पूछें...")}
                className="flex-1 border-2 border-black dark:border-white/50 bg-white dark:bg-[#1a1a1a] p-2.5 text-xs font-inter font-bold outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-black dark:bg-white text-white dark:text-black px-4 font-inter font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
