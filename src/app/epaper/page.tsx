"use client";

import { useState } from "react";
import Link from "next/link";
import { Newspaper, ChevronLeft, ChevronRight, Download, Cpu, Zap, Globe, Sparkles } from "lucide-react";

export default function EpaperPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split("T")[0]);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const shortDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", month: "short", day: "numeric",
    });

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= today) setSelectedDate(d.toISOString().split("T")[0]);
  };

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="min-h-screen bg-white">
      {/* ── AI Futuristic Header ────────────────────── */}
      <header className="relative overflow-hidden bg-white border-b border-black/5">
        {/* Subtle circuit grid bg */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 49px, #000 49px, #000 50px),
                           repeating-linear-gradient(90deg, transparent, transparent 49px, #000 49px, #000 50px)`,
          backgroundSize: "50px 50px",
        }} />
        {/* Gradient accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-[10px] font-inter font-black uppercase tracking-[3px] text-black/40 hover:text-primary transition-colors">
                ← Home
              </Link>
              <div className="h-4 w-px bg-black/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-inter font-black uppercase tracking-[4px] text-black/60">AI-Powered</span>
                  <span className="text-xl font-newsreader font-black ml-2">E-Paper</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Link href="/" className="text-3xl font-newsreader font-black tracking-tight">
                Loktantra<span className="text-primary">Vani</span>
              </Link>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-inter font-black uppercase tracking-[3px] text-black/30">
                  India&apos;s First AI Newspaper
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Date Navigation — Futuristic ────────────── */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={prevDay} className="group flex items-center gap-2 px-4 py-2 border border-black/10 hover:border-primary hover:text-primary transition-all">
              <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[9px] font-inter font-black uppercase tracking-[2px]">Prev</span>
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-black/10" />
                <Globe className="w-3.5 h-3.5 text-primary/60" />
                <p className="text-lg font-newsreader font-black">{formatDate(selectedDate)}</p>
                <Zap className="w-3.5 h-3.5 text-primary/60" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-black/10" />
              </div>
              <p className="text-[8px] font-inter uppercase tracking-[4px] text-black/25">
                Autonomous Edition · Generated at 07:00 IST
              </p>
            </div>

            <button
              onClick={nextDay}
              disabled={selectedDate === today.toISOString().split("T")[0]}
              className="group flex items-center gap-2 px-4 py-2 border border-black/10 hover:border-primary hover:text-primary transition-all disabled:opacity-20 disabled:hover:border-black/10"
            >
              <span className="text-[9px] font-inter font-black uppercase tracking-[2px]">Next</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Date Picker — Pill Style ─────────── */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
          {recentDays.map((d, idx) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-1.5 text-[9px] font-inter font-black uppercase tracking-[2px] whitespace-nowrap transition-all rounded-full ${
                selectedDate === d
                  ? "bg-black text-white shadow-md"
                  : idx === 0
                    ? "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10"
                    : "bg-black/[0.02] text-black/40 hover:bg-black/5 hover:text-black"
              }`}
            >
              {idx === 0 ? "Today" : shortDate(d)}
            </button>
          ))}
        </div>
      </div>

      {/* ── E-Paper Viewer ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-inter font-black uppercase tracking-[2px] text-black/30">Live Edition</span>
            </div>
            <span className="text-[9px] font-inter text-black/20">|</span>
            <span className="text-[9px] font-inter text-black/30">12 Pages · 10 Sections · AI Curated</span>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/admin/epaper-pdf?date=${selectedDate}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-black text-white text-[9px] font-inter font-black uppercase tracking-[2px] hover:bg-primary transition-colors flex items-center gap-2 rounded"
            >
              <Newspaper className="w-3.5 h-3.5" /> View Full
            </a>
            <a
              href={`/api/admin/epaper-pdf?date=${selectedDate}&download=true`}
              className="px-4 py-2 border border-black/15 text-[9px] font-inter font-black uppercase tracking-[2px] hover:bg-black hover:text-white transition-colors flex items-center gap-2 rounded"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
          </div>
        </div>

        {/* Viewer Frame — Clean white with subtle shadow */}
        <div className="bg-white rounded-lg border border-black/5 shadow-[0_4px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Thin top accent */}
          <div className="h-[1px] bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 bg-black/[0.015]">
            <div className="flex items-center gap-3">
              <Cpu className="w-3.5 h-3.5 text-primary/50" />
              <span className="text-[9px] font-inter font-black uppercase tracking-[3px] text-black/30">
                LoktantraVani · AI Edition · {shortDate(selectedDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-inter uppercase tracking-[2px] text-black/20">Powered by</span>
              <span className="text-[8px] font-inter font-black uppercase tracking-[2px] text-primary/50">Gemini + Claude</span>
            </div>
          </div>

          {/* Iframe */}
          <iframe
            src={`/api/admin/epaper-pdf?date=${selectedDate}`}
            className="w-full border-0"
            style={{ height: "calc(100vh - 320px)", minHeight: "650px" }}
            title="E-Paper"
          />
        </div>
      </div>

      {/* ── Footer — Minimal ───────────────────────── */}
      <div className="pb-12 pt-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent mb-6" />
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-3 h-3 text-primary/30" />
            <p className="text-[8px] font-inter uppercase tracking-[4px] text-black/20">
              LoktantraVani E-Paper · Autonomously generated · AI-curated edition · Updated daily at 07:00 IST
            </p>
            <Sparkles className="w-3 h-3 text-primary/30" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
