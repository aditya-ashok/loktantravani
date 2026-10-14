"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Swords, Mic, Ticket } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import DebateVani from "@/components/debate/DebateVani";
import LiveModerator from "@/components/debate/LiveModerator";
import EventRegistration from "@/components/events/EventRegistration";

type Tab = "spar" | "live" | "register";

export default function DebatePage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("spar");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[80px] md:pt-[108px] bg-[#0a0a0f] text-white">
        <section className="relative overflow-hidden border-b border-orange-500/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-[#0a0a0f] to-green-950/20" />
          <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-5">
              <Swords className="w-3 h-3" /> {t("Loktantra Debate", "लोकतंत्र बहस")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              {t("Argue. Listen. Think.", "तर्क करें। सुनें। सोचें।")}
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              {t(
                "Spar with Debate Vani on today's big questions, or run your own live debate with an AI co-moderator that keeps time, fact-checks claims and summarises both sides.",
                "आज के बड़े सवालों पर डिबेट वाणी से बहस करें, या AI सह-संचालक के साथ अपनी लाइव बहस चलाएं — जो समय रखता है, दावों की जांच करता है और दोनों पक्षों का सार देता है।",
              )}
            </p>
            <p className="text-white/40 text-xs mt-3">
              {t("The AI is non-partisan: it judges arguments, never ideologies.", "AI निष्पक्ष है: यह तर्कों को परखता है, विचारधाराओं को नहीं।")}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto" role="tablist">
            {([
              ["spar", Swords, t("Debate Vani", "डिबेट वाणी")],
              ["live", Mic, t("Live Moderator", "लाइव संचालक")],
              ["register", Ticket, t("Register: AI Show", "पंजीकरण: AI शो")],
            ] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                  tab === key ? "border-orange-500 text-orange-400" : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
                {key === "register" && (
                  <span className="text-[9px] font-black bg-[#FFD600] text-black px-1.5 py-0.5 rounded-sm">{t("NEW", "नया")}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "spar" && <DebateVani />}
          {tab === "live" && <LiveModerator />}
          {tab === "register" && <EventRegistration slug="ai-public-policy" />}
        </div>
      </main>
      <Footer />
    </>
  );
}
