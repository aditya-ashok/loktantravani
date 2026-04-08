"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HouseAd } from "@/components/GoogleAd";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ArrowRight, BarChart3,
  RefreshCw, Loader2, Swords, ArrowUpRight, ArrowDownRight,
  Building2, Shield, Banknote, Factory, Rocket, Train,
  Globe, Users, Smartphone, Zap,
} from "lucide-react";

interface ComparisonMetric {
  category: string;
  metric: string;
  upa: string;
  nda: string;
  upaPeriod: string;
  ndaPeriod: string;
  growth: string;
  winner: "nda" | "upa" | "tie";
  source: string;
  icon: string;
}

// Hardcoded comparison data (can be refreshed via API)
const DEFAULT_METRICS: ComparisonMetric[] = [
  { category: "Economy", metric: "GDP (Nominal, USD Trillion)", upa: "$1.86T (2014)", nda: "$3.94T (2025)", upaPeriod: "2004-2014", ndaPeriod: "2014-2025", growth: "↑ 112%", winner: "nda", source: "IMF/World Bank", icon: "💰" },
  { category: "Economy", metric: "Forex Reserves (USD Billion)", upa: "$304B (2014)", nda: "$640B+ (2025)", upaPeriod: "2004-2014", ndaPeriod: "2014-2025", growth: "↑ 110%", winner: "nda", source: "RBI", icon: "🏦" },
  { category: "Infrastructure", metric: "National Highways Built (km/day)", upa: "12 km/day", nda: "28 km/day", upaPeriod: "2004-2014", ndaPeriod: "2014-2025", growth: "↑ 133%", winner: "nda", source: "MoRTH", icon: "🛣️" },
  { category: "Infrastructure", metric: "Airport Count", upa: "74", nda: "157", upaPeriod: "2014", ndaPeriod: "2025", growth: "↑ 112%", winner: "nda", source: "AAI", icon: "✈️" },
  { category: "Defence", metric: "Defence Exports (₹ Crore)", upa: "₹1,521 Cr", nda: "₹21,083 Cr", upaPeriod: "2013-14", ndaPeriod: "2023-24", growth: "↑ 1286%", winner: "nda", source: "MoD", icon: "🛡️" },
  { category: "Defence", metric: "Rafale / Modern Jets Inducted", upa: "0", nda: "36 Rafale + Tejas", upaPeriod: "2004-2014", ndaPeriod: "2014-2025", growth: "New", winner: "nda", source: "IAF", icon: "🛩️" },
  { category: "Digital", metric: "Digital Payments (UPI Monthly Txns)", upa: "0 (No UPI)", nda: "16 Billion+/month", upaPeriod: "N/A", ndaPeriod: "2025", growth: "∞", winner: "nda", source: "NPCI", icon: "📱" },
  { category: "Digital", metric: "Broadband Connections", upa: "61 Million", nda: "900 Million+", upaPeriod: "2014", ndaPeriod: "2025", growth: "↑ 1375%", winner: "nda", source: "TRAI", icon: "🌐" },
  { category: "Social Welfare", metric: "Toilets Built (Swachh Bharat)", upa: "N/A", nda: "12 Crore+", upaPeriod: "No mission", ndaPeriod: "2014-2025", growth: "New", winner: "nda", source: "MoDWS", icon: "🚽" },
  { category: "Social Welfare", metric: "LPG Connections (Ujjwala)", upa: "~12 Cr", nda: "~22 Cr (incl. 10 Cr Ujjwala)", upaPeriod: "2014", ndaPeriod: "2025", growth: "↑ 83%", winner: "nda", source: "MoPNG", icon: "🔥" },
  { category: "Social Welfare", metric: "Jan Dhan Accounts", upa: "0", nda: "52 Crore+", upaPeriod: "N/A", ndaPeriod: "2025", growth: "New", winner: "nda", source: "MoF", icon: "🏧" },
  { category: "Social Welfare", metric: "PM Kisan Direct Transfer", upa: "0", nda: "₹3.04 Lakh Crore to 12 Cr farmers", upaPeriod: "N/A", ndaPeriod: "2019-2025", growth: "New", winner: "nda", source: "PM-KISAN Portal", icon: "🌾" },
  { category: "International", metric: "India's Global Ranking (GDP PPP)", upa: "#4", nda: "#3", upaPeriod: "2014", ndaPeriod: "2025", growth: "↑ 1 rank", winner: "nda", source: "IMF", icon: "🌍" },
  { category: "International", metric: "FDI Inflow (USD Billion/yr)", upa: "$36B (2013-14)", nda: "$85B+ (2023-24)", upaPeriod: "2013-14", ndaPeriod: "2023-24", growth: "↑ 136%", winner: "nda", source: "DPIIT", icon: "💼" },
  { category: "Railways", metric: "Vande Bharat Trains", upa: "0", nda: "100+ launched", upaPeriod: "N/A", ndaPeriod: "2025", growth: "New", winner: "nda", source: "Railways", icon: "🚄" },
  { category: "Railways", metric: "Railway Electrification (%)", upa: "33%", nda: "97%+", upaPeriod: "2014", ndaPeriod: "2025", growth: "↑ 194%", winner: "nda", source: "Railways", icon: "⚡" },
  { category: "Corruption", metric: "Major Scams", upa: "2G, Coalgate, CWG, AgustaWestland", nda: "No major scam", upaPeriod: "2004-2014", ndaPeriod: "2014-2025", growth: "Clean", winner: "nda", source: "CAG/Courts", icon: "🔍" },
  { category: "Inflation", metric: "Average Food Inflation", upa: "~10-12%", nda: "~5-6%", upaPeriod: "2009-2014", ndaPeriod: "2014-2025", growth: "↓ 50%", winner: "nda", source: "RBI/CSO", icon: "📉" },
];

const CATEGORIES = [...new Set(DEFAULT_METRICS.map(m => m.category))];

const CAT_COLORS: Record<string, string> = {
  Economy: "#FF9933",
  Infrastructure: "#00fff5",
  Defence: "#ef4444",
  Digital: "#3b82f6",
  "Social Welfare": "#39ff14",
  International: "#a855f7",
  Railways: "#facc15",
  Corruption: "#ff006e",
  Inflation: "#f97316",
};

export default function BJPvsUPAPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [metrics] = useState<ComparisonMetric[]>(DEFAULT_METRICS);

  const filtered = selectedCategory === "all"
    ? metrics
    : metrics.filter(m => m.category === selectedCategory);

  const ndaWins = metrics.filter(m => m.winner === "nda").length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-orange-500/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-[#0a0a0f] to-blue-950/20" />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Swords className="w-3 h-3" /> Data Comparison Engine
              </div>
              <h1 className="text-4xl md:text-6xl font-newsreader font-black mb-4">
                <span className="text-[#FF9933]">NDA</span> vs <span className="text-blue-400">UPA</span>
              </h1>
              <p className="text-lg font-inter text-white/50 max-w-2xl mx-auto mb-8">
                Side-by-side comparison of 10 years of UPA (2004–2014) vs 11 years of NDA (2014–2025).
                All data from official government sources.
              </p>

              {/* Score */}
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-5xl font-newsreader font-black text-[#FF9933]">{ndaWins}</p>
                  <p className="text-[10px] font-inter text-white/40 uppercase tracking-widest">NDA Wins</p>
                </div>
                <div className="text-3xl font-newsreader font-black text-white/20">vs</div>
                <div className="text-center">
                  <p className="text-5xl font-newsreader font-black text-blue-400">{metrics.length - ndaWins}</p>
                  <p className="text-[10px] font-inter text-white/40 uppercase tracking-widest">UPA Wins</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all ${
                selectedCategory === "all"
                  ? "border-[#FF9933] bg-[#FF9933]/20 text-[#FF9933]"
                  : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              All ({metrics.length})
            </button>
            {CATEGORIES.map(cat => {
              const color = CAT_COLORS[cat] || "#FF9933";
              const count = metrics.filter(m => m.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all"
                  style={{
                    borderColor: selectedCategory === cat ? color : "rgba(255,255,255,0.1)",
                    background: selectedCategory === cat ? `${color}20` : "transparent",
                    color: selectedCategory === cat ? color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* Comparison Cards */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <div className="grid gap-4">
            {filtered.map((m, i) => {
              const color = CAT_COLORS[m.category] || "#FF9933";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden hover:border-orange-500/10 transition-all"
                >
                  {/* Header */}
                  <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <h3 className="text-sm font-newsreader font-black text-white">{m.metric}</h3>
                        <span
                          className="text-[9px] font-inter font-bold uppercase tracking-widest"
                          style={{ color }}
                        >
                          {m.category}
                        </span>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                      style={{
                        background: m.winner === "nda" ? "rgba(255,153,51,0.15)" : "rgba(59,130,246,0.15)",
                        color: m.winner === "nda" ? "#FF9933" : "#3b82f6",
                        border: `1px solid ${m.winner === "nda" ? "rgba(255,153,51,0.3)" : "rgba(59,130,246,0.3)"}`,
                      }}
                    >
                      {m.growth}
                    </div>
                  </div>

                  {/* UPA vs NDA */}
                  <div className="grid grid-cols-2">
                    {/* UPA Side */}
                    <div className="px-6 py-4 border-r border-white/5 bg-blue-500/[0.02]">
                      <p className="text-[10px] font-inter font-bold text-blue-400 uppercase tracking-widest mb-1">
                        UPA ({m.upaPeriod})
                      </p>
                      <p className="text-lg font-newsreader font-black text-white/60">
                        {m.upa}
                      </p>
                    </div>
                    {/* NDA Side */}
                    <div className="px-6 py-4 bg-orange-500/[0.02]">
                      <p className="text-[10px] font-inter font-bold text-[#FF9933] uppercase tracking-widest mb-1">
                        NDA ({m.ndaPeriod})
                      </p>
                      <p className="text-lg font-newsreader font-black text-white">
                        {m.nda}
                      </p>
                    </div>
                  </div>

                  {/* Source */}
                  <div className="px-6 py-1.5 border-t border-white/5">
                    <p className="text-[8px] font-inter text-white/15 uppercase tracking-widest">
                      Source: {m.source}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] font-inter text-white/20 max-w-xl mx-auto">
              All data sourced from government records, RBI, IMF, CAG reports, and ministry dashboards.
              Figures are approximate and based on latest available official data.
            </p>
          </div>

          <div className="mt-12">
            <HouseAd />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
