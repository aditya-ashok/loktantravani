"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HouseAd } from "@/components/GoogleAd";
import { motion } from "framer-motion";
import {
  Loader2, Calendar, Copy, CheckCircle2,
  MessageSquare, Share2, Megaphone, Hash,
} from "lucide-react";

interface TalkingPoint {
  title: string;
  point: string;
  data: string;
  counter: string;
  hashtag: string;
}

interface DailyBrief {
  date: string;
  headline: string;
  summary: string;
  points: TalkingPoint[];
  whatsappText: string;
  generatedAt: string;
}

export default function TalkingPointsPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchToday();
  }, []);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/talking-points");
      const data = await res.json();
      if (data.points) setBrief(data);
      else setBrief(null);
    } catch {
      setBrief(null);
    }
    setLoading(false);
  };

  const copyWhatsApp = () => {
    if (!brief?.whatsappText) return;
    navigator.clipboard.writeText(brief.whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!brief?.whatsappText) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(brief.whatsappText)}`, "_blank");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-orange-500/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-[#0a0a0f] to-yellow-950/20" />
          <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-20 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Megaphone className="w-3 h-3" /> Daily BJP Briefing
              </div>
              <h1 className="text-4xl md:text-5xl font-newsreader font-black mb-3">
                Today&apos;s <span className="text-[#FF9933]">5 Points</span>
              </h1>
              <p className="text-base font-inter text-white/50 mb-2">
                Every BJP supporter should know these facts today
              </p>
              <p className="text-sm font-inter text-white/30 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> {todayStr}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          {loading ? (
            <div className="text-center py-24">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-inter text-sm">Loading today&apos;s briefing...</p>
            </div>
          ) : !brief ? (
            <div className="text-center py-24">
              <Megaphone className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-xl font-newsreader italic text-white/30 mb-6">
                Today&apos;s talking points haven&apos;t been published yet. Check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-600/10 to-yellow-600/10 border border-orange-500/20 rounded-xl p-6 mb-8"
              >
                <h2 className="text-2xl md:text-3xl font-newsreader font-black text-white mb-2">
                  {brief.headline}
                </h2>
                <p className="text-sm font-inter text-white/50">{brief.summary}</p>
              </motion.div>

              {/* 5 Points */}
              <div className="space-y-6 mb-10">
                {brief.points.map((tp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#12121a] border border-white/5 rounded-xl p-6 hover:border-orange-500/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number */}
                      <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-newsreader font-black text-white mb-2">
                          {tp.title}
                        </h3>
                        <p className="text-sm font-inter text-white/60 leading-relaxed mb-3">
                          {tp.point}
                        </p>

                        {/* Data */}
                        {tp.data && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2 mb-3">
                            <p className="text-xs font-inter text-blue-300">
                              📊 {tp.data}
                            </p>
                          </div>
                        )}

                        {/* Counter */}
                        {tp.counter && (
                          <div className="bg-green-500/5 border border-green-500/10 rounded-lg px-3 py-2 mb-3">
                            <p className="text-xs font-inter text-green-300">
                              🛡️ Counter: {tp.counter}
                            </p>
                          </div>
                        )}

                        {/* Hashtag */}
                        {tp.hashtag && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-inter font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
                            <Hash className="w-3 h-3" /> {tp.hashtag}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Shareable Visual Card */}
              <div className="mb-10 rounded-xl overflow-hidden shadow-2xl shadow-orange-500/10">
                <div
                  className="p-8 md:p-10"
                  style={{ background: "linear-gradient(135deg, #FF9933 0%, #FF6600 50%, #CC5200 100%)" }}
                >
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-inter font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                      {todayStr}
                    </p>
                    <h3 className="text-3xl md:text-4xl font-newsreader font-black text-white mb-1">
                      Today&apos;s 5 Points
                    </h3>
                    <p className="text-sm font-inter text-white/70">
                      Every BJP supporter should know these facts today
                    </p>
                  </div>
                  <div className="space-y-3">
                    {brief.points.map((tp, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="w-7 h-7 shrink-0 bg-white text-[#FF6600] rounded-full flex items-center justify-center font-black text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-inter font-bold text-white leading-snug">
                            {tp.title}
                          </p>
                          {tp.data && (
                            <p className="text-[11px] font-inter text-white/60 mt-1">
                              📊 {tp.data}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center border-t border-white/20 pt-4">
                    <p className="text-[10px] font-inter font-black uppercase tracking-[0.2em] text-white/50">
                      LoktantraVani — India&apos;s 1st AI Newspaper
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Share Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-600/10 to-green-800/10 border border-green-500/20 rounded-xl p-6 mb-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-newsreader font-black text-green-400 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> WhatsApp Ready Message
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyWhatsApp}
                      className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-white/20"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={shareWhatsApp}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-green-700"
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  </div>
                </div>
                <pre className="text-xs font-inter text-white/50 whitespace-pre-wrap bg-black/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {brief.whatsappText}
                </pre>
              </motion.div>

              {/* Generated timestamp */}
              {brief.generatedAt && (
                <div className="text-center">
                  <p className="text-[10px] font-inter text-white/15 mt-1">
                    Last updated: {new Date(brief.generatedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-12">
            <HouseAd />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
