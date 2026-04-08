"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAd, { HouseAd } from "@/components/GoogleAd";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Shield, TrendingUp, XCircle,
  BarChart3, Target,
  Loader2, Filter, Calendar,
} from "lucide-react";

const PARTIES = [
  { id: "all", label: "All Parties", color: "#FF9933" },
  { id: "congress", label: "Congress (INC)", color: "#00BFFF" },
  { id: "aap", label: "AAP", color: "#0066FF" },
  { id: "tmc", label: "TMC", color: "#2E8B57" },
  { id: "sp", label: "SP", color: "#FF0000" },
  { id: "dmk", label: "DMK", color: "#CC0000" },
  { id: "jdu", label: "JD(U)", color: "#006400" },
];

interface FactCheck {
  id: string;
  slug: string;
  title: string;
  claim: string;
  claimBy: string;
  verdict: "false" | "misleading" | "half-true" | "out-of-context";
  rebuttal: string;
  data: string;
  bjpCounter: string;
  source: string;
  createdAt: string;
  imageUrl?: string;
  category: string;
}

const VERDICT_CONFIG = {
  false: { label: "FALSE", color: "#ef4444", icon: XCircle, bg: "bg-red-500/10" },
  misleading: { label: "MISLEADING", color: "#f59e0b", icon: AlertTriangle, bg: "bg-amber-500/10" },
  "half-true": { label: "HALF TRUE", color: "#eab308", icon: AlertTriangle, bg: "bg-yellow-500/10" },
  "out-of-context": { label: "OUT OF CONTEXT", color: "#8b5cf6", icon: Target, bg: "bg-purple-500/10" },
};

export default function OppositionTrackerPage() {
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState("all");

  useEffect(() => {
    fetchFactChecks();
  }, []);

  const fetchFactChecks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/opposition-tracker");
      const data = await res.json();
      setFactChecks(data.articles || []);
    } catch {
      setFactChecks([]);
    }
    setLoading(false);
  };

  const filtered = factChecks.filter(
    fc => selectedParty === "all" || fc.claimBy?.toLowerCase().includes(selectedParty)
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-red-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-[#0a0a0f] to-orange-950/20" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,0,0,0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Target className="w-3 h-3" /> AI-Powered Verification
              </div>
              <h1 className="text-4xl md:text-6xl font-newsreader font-black mb-4">
                Fact <span className="text-red-500">Checker</span>
              </h1>
              <p className="text-lg font-inter text-white/50 max-w-2xl mx-auto mb-8">
                AI-powered fact-checking of opposition claims. Every statement verified with data,
                official sources, and government records. No propaganda — just facts.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-inter text-white/60">Data-Verified</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-inter text-white/60">Official Sources</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-inter text-white/60">Real-time Monitoring</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Controls */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Filter className="w-4 h-4 text-white/40" />
            {PARTIES.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedParty(p.id)}
                className="px-4 py-2 text-xs font-inter font-bold uppercase tracking-widest rounded-lg border transition-all"
                style={{
                  borderColor: selectedParty === p.id ? p.color : "rgba(255,255,255,0.1)",
                  background: selectedParty === p.id ? `${p.color}20` : "transparent",
                  color: selectedParty === p.id ? p.color : "rgba(255,255,255,0.5)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

        </section>

        {/* Fact Check Cards */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          {loading ? (
            <div className="text-center py-24">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-inter text-sm">Loading fact checks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Target className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-xl font-newsreader italic text-white/30">No fact checks available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence>
                {filtered.map((fc, i) => {
                  const verdict = VERDICT_CONFIG[fc.verdict] || VERDICT_CONFIG["misleading"];
                  return (
                    <motion.article
                      key={fc.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden hover:border-red-500/20 transition-all group"
                    >
                      <div className="p-6 md:p-8">
                        {/* Verdict Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                            style={{ background: `${verdict.color}15`, color: verdict.color, border: `1px solid ${verdict.color}30` }}
                          >
                            <verdict.icon className="w-3 h-3" />
                            {verdict.label}
                          </div>
                          {fc.claimBy && (
                            <span className="text-[10px] font-inter text-white/30 uppercase tracking-widest">
                              {fc.claimBy}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link href={fc.slug ? `/blog/${fc.slug}` : "#"}>
                          <h2 className="text-xl md:text-2xl font-newsreader font-black text-white group-hover:text-red-400 transition-colors mb-4 leading-tight">
                            {fc.title}
                          </h2>
                        </Link>

                        {/* Claim vs Reality */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                            <p className="text-[10px] font-inter font-black text-red-400 uppercase tracking-widest mb-2">
                              ❌ Opposition Claim
                            </p>
                            <p className="text-sm font-inter text-white/70 leading-relaxed">
                              {fc.claim}
                            </p>
                          </div>
                          <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                            <p className="text-[10px] font-inter font-black text-green-400 uppercase tracking-widest mb-2">
                              ✅ Facts & Data
                            </p>
                            <p className="text-sm font-inter text-white/70 leading-relaxed">
                              {fc.bjpCounter || fc.rebuttal}
                            </p>
                          </div>
                        </div>

                        {/* Data Point */}
                        {fc.data && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 mb-4">
                            <p className="text-xs font-inter text-blue-300">
                              📊 <strong>Key Data:</strong> {fc.data}
                            </p>
                          </div>
                        )}

                        {/* Source & Date */}
                        <div className="flex items-center justify-between text-[10px] font-inter text-white/20 uppercase tracking-widest">
                          {fc.source && <span>Source: {fc.source}</span>}
                          {fc.createdAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(fc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
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
