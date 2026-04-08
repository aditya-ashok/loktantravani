"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoogleAd, { HouseAd } from "@/components/GoogleAd";
import { motion } from "framer-motion";
import {
  TrendingUp, Loader2, Award, Heart, Home,
  Droplets, Smartphone, Factory, Rocket, Wheat, Banknote,
  Train, Shield, ArrowUpRight, Building2, Zap, Star,
  BarChart3, Users,
} from "lucide-react";

const SCHEME_ICONS: Record<string, React.ReactNode> = {
  "Ayushman Bharat": <Heart className="w-6 h-6" />,
  "PM Awas Yojana": <Home className="w-6 h-6" />,
  "Ujjwala Yojana": <Zap className="w-6 h-6" />,
  "Swachh Bharat": <Droplets className="w-6 h-6" />,
  "Jan Dhan Yojana": <Banknote className="w-6 h-6" />,
  "Digital India": <Smartphone className="w-6 h-6" />,
  "Make in India": <Factory className="w-6 h-6" />,
  "Startup India": <Rocket className="w-6 h-6" />,
  "PM Kisan": <Wheat className="w-6 h-6" />,
  "Mudra Yojana": <Banknote className="w-6 h-6" />,
  "Jal Jeevan Mission": <Droplets className="w-6 h-6" />,
  "Vande Bharat Express": <Train className="w-6 h-6" />,
  "National Highways": <Building2 className="w-6 h-6" />,
  "Defence Exports": <Shield className="w-6 h-6" />,
  "UPI Transactions": <Smartphone className="w-6 h-6" />,
};

interface Scheme {
  name: string;
  description: string;
  beneficiaries: string;
  achievement: string;
  growth: string;
  lastUpdated: string;
  source: string;
  icon: string;
}

const NEON_COLORS = ["#FF9933", "#00fff5", "#39ff14", "#ff006e", "#a855f7", "#facc15", "#3b82f6", "#f97316"];

export default function ModiScorecardPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    fetchScorecard();
  }, []);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modi-scorecard");
      const data = await res.json();
      setSchemes(data.schemes || []);
      setLastUpdated(data.lastUpdated || "");
    } catch {
      setSchemes([]);
    }
    setLoading(false);
  };

  // Aggregate stats
  const totalSchemes = schemes.length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-orange-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-[#0a0a0f] to-green-950/20" />
          {/* Tricolor stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Award className="w-3 h-3" /> Government Performance Tracker
              </div>
              <h1 className="text-4xl md:text-6xl font-newsreader font-black mb-4">
                Govt <span className="text-[#FF9933]">Report Card</span>
              </h1>
              <p className="text-lg font-inter text-white/50 max-w-2xl mx-auto mb-6">
                Real-time tracking of NDA government schemes — beneficiary data, growth metrics,
                and milestones from official government sources.
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-newsreader font-black text-[#FF9933]">{totalSchemes}+</p>
                  <p className="text-[10px] font-inter text-white/40 uppercase tracking-widest">Schemes Tracked</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-newsreader font-black text-green-400">2014–2026</p>
                  <p className="text-[10px] font-inter text-white/40 uppercase tracking-widest">NDA Era</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-3xl font-newsreader font-black text-cyan-400">Official</p>
                  <p className="text-[10px] font-inter text-white/40 uppercase tracking-widest">Data Sources</p>
                </div>
              </div>

              {lastUpdated && (
                <p className="text-[10px] font-inter text-white/20 mt-3">
                  Last updated: {new Date(lastUpdated).toLocaleString("en-IN")}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Scheme Cards */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {loading ? (
            <div className="text-center py-24">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-inter text-sm">Loading scorecard data...</p>
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-24">
              <BarChart3 className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <p className="text-xl font-newsreader italic text-white/30 mb-4">
                No scorecard data available yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map((scheme, i) => {
                const color = NEON_COLORS[i % NEON_COLORS.length];
                const IconComponent = SCHEME_ICONS[scheme.name] || <Star className="w-6 h-6" />;
                return (
                  <motion.div
                    key={scheme.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#12121a] border border-white/5 rounded-xl p-6 hover:border-orange-500/20 transition-all group"
                    style={{ boxShadow: `0 0 0 0 ${color}00` }}
                    whileHover={{ boxShadow: `0 0 30px ${color}15` }}
                  >
                    {/* Icon & Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}15`, color }}
                      >
                        {IconComponent}
                      </div>
                      {scheme.growth && (
                        <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                          <ArrowUpRight className="w-3 h-3" />
                          {scheme.growth}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-newsreader font-black text-white mb-1">
                      {scheme.icon} {scheme.name}
                    </h3>
                    <p className="text-xs font-inter text-white/40 mb-4 leading-relaxed">
                      {scheme.description}
                    </p>

                    {/* Key Metric */}
                    <div className="bg-white/5 rounded-lg p-4 mb-3">
                      <p className="text-2xl font-newsreader font-black" style={{ color }}>
                        {scheme.beneficiaries}
                      </p>
                      <p className="text-[10px] font-inter text-white/30 uppercase tracking-widest">
                        Beneficiaries / Scale
                      </p>
                    </div>

                    {/* Achievement */}
                    {scheme.achievement && (
                      <p className="text-xs font-inter text-white/50 mb-3">
                        🏆 {scheme.achievement}
                      </p>
                    )}

                    {/* Source */}
                    <p className="text-[9px] font-inter text-white/15 uppercase tracking-widest">
                      Source: {scheme.source || "Government of India"}
                    </p>
                  </motion.div>
                );
              })}
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
