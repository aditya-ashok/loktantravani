"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

/**
 * NDTV-style election results tracker — horizontal banner.
 * Shows multi-state assembly election results as tab-switchable bars.
 * Data is statically declared here for now; promote to Firestore later.
 */

type Party = { code: string; nameEn: string; nameHi: string; seats: number; color: string };
type StateResult = {
  code: string;
  nameEn: string;
  nameHi: string;
  totalSeats: number;
  majorityAt: number;
  parties: Party[];
  leaderEn: string;
  leaderHi: string;
};

const RESULTS_2026: StateResult[] = [
  {
    code: "TN",
    nameEn: "Tamil Nadu",
    nameHi: "तमिलनाडु",
    totalSeats: 234,
    majorityAt: 118,
    leaderEn: "DMK+ leading",
    leaderHi: "DMK+ आगे",
    parties: [
      { code: "DMK+", nameEn: "DMK+", nameHi: "DMK+", seats: 162, color: "#dc2626" },
      { code: "AIADMK+", nameEn: "AIADMK+", nameHi: "AIADMK+", seats: 65, color: "#16a34a" },
      { code: "OTH", nameEn: "Others", nameHi: "अन्य", seats: 7, color: "#6b7280" },
    ],
  },
  {
    code: "WB",
    nameEn: "West Bengal",
    nameHi: "पश्चिम बंगाल",
    totalSeats: 294,
    majorityAt: 148,
    leaderEn: "TMC leading",
    leaderHi: "TMC आगे",
    parties: [
      { code: "TMC", nameEn: "TMC", nameHi: "TMC", seats: 178, color: "#16a34a" },
      { code: "BJP", nameEn: "BJP", nameHi: "भाजपा", seats: 92, color: "#f97316" },
      { code: "INC+L", nameEn: "INC+Left", nameHi: "कांग्रेस+वाम", seats: 22, color: "#2563eb" },
      { code: "OTH", nameEn: "Others", nameHi: "अन्य", seats: 2, color: "#6b7280" },
    ],
  },
  {
    code: "KL",
    nameEn: "Kerala",
    nameHi: "केरल",
    totalSeats: 140,
    majorityAt: 71,
    leaderEn: "LDF leading",
    leaderHi: "LDF आगे",
    parties: [
      { code: "LDF", nameEn: "LDF", nameHi: "LDF", seats: 78, color: "#dc2626" },
      { code: "UDF", nameEn: "UDF", nameHi: "UDF", seats: 60, color: "#2563eb" },
      { code: "BJP+", nameEn: "BJP+", nameHi: "भाजपा+", seats: 2, color: "#f97316" },
    ],
  },
  {
    code: "AS",
    nameEn: "Assam",
    nameHi: "असम",
    totalSeats: 126,
    majorityAt: 64,
    leaderEn: "BJP+ leading",
    leaderHi: "भाजपा+ आगे",
    parties: [
      { code: "BJP+", nameEn: "BJP+", nameHi: "भाजपा+", seats: 88, color: "#f97316" },
      { code: "INC+", nameEn: "INC+", nameHi: "कांग्रेस+", seats: 35, color: "#2563eb" },
      { code: "OTH", nameEn: "Others", nameHi: "अन्य", seats: 3, color: "#6b7280" },
    ],
  },
  {
    code: "PY",
    nameEn: "Puducherry",
    nameHi: "पुडुचेरी",
    totalSeats: 30,
    majorityAt: 16,
    leaderEn: "NDA leading",
    leaderHi: "NDA आगे",
    parties: [
      { code: "NDA", nameEn: "NDA", nameHi: "NDA", seats: 16, color: "#f97316" },
      { code: "INDIA", nameEn: "INDIA", nameHi: "INDIA", seats: 12, color: "#2563eb" },
      { code: "OTH", nameEn: "Others", nameHi: "अन्य", seats: 2, color: "#6b7280" },
    ],
  },
];

export default function ElectionTracker() {
  const { lang } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const active = RESULTS_2026[activeIdx];
  const totalCounted = active.parties.reduce((sum, p) => sum + p.seats, 0);

  return (
    <div className="bg-gradient-to-r from-orange-50 via-white to-green-50 dark:from-orange-950/30 dark:via-[#0d0d0d] dark:to-green-950/30 border-y-2 border-black dark:border-white/30">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-3 md:py-4">

        {/* Header strip */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
          <div className="flex items-center gap-2 bg-red-600 text-white px-2.5 py-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-[9px] font-inter font-black uppercase tracking-widest">
              {lang === "hi" ? "लाइव" : "Live"}
            </span>
          </div>
          <h2 className="text-xs md:text-sm font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
            {lang === "hi" ? "विधानसभा चुनाव परिणाम 2026" : "Assembly Election Results 2026"}
          </h2>
          <span className="text-[9px] md:text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hidden sm:inline">
            {lang === "hi" ? "मतगणना जारी" : "Counting underway"}
          </span>
          <Link
            href="/elections"
            className="ml-auto text-[9px] md:text-[10px] font-inter font-black uppercase tracking-widest text-primary hover:underline"
          >
            {lang === "hi" ? "पूर्ण कवरेज →" : "Full Coverage →"}
          </Link>
        </div>

        {/* State tabs */}
        <div className="flex flex-wrap gap-1.5 mb-3 overflow-x-auto -mx-1 px-1">
          {RESULTS_2026.map((s, i) => (
            <button
              key={s.code}
              onClick={() => setActiveIdx(i)}
              className={`px-3 py-1.5 text-[10px] font-inter font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                i === activeIdx
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-white/5 text-[var(--nyt-black)] dark:text-white/70 border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white/40"
              }`}
            >
              {lang === "hi" ? s.nameHi : s.nameEn}
            </button>
          ))}
        </div>

        {/* Result bars */}
        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 p-3 md:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm md:text-base font-newsreader font-black dark:text-white">
                {lang === "hi" ? active.nameHi : active.nameEn}
              </span>
              <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50">
                {lang === "hi"
                  ? `कुल ${active.totalSeats} सीटें · बहुमत ${active.majorityAt}`
                  : `${active.totalSeats} seats · majority ${active.majorityAt}`}
              </span>
            </div>
            <span className="text-[10px] font-inter font-black uppercase tracking-widest text-red-600">
              {lang === "hi" ? active.leaderHi : active.leaderEn}
            </span>
          </div>

          {/* Stacked horizontal bar */}
          <div className="flex w-full h-3 rounded-sm overflow-hidden border border-black/10 dark:border-white/20 mb-3">
            {active.parties.map((p) => (
              <div
                key={p.code}
                style={{ width: `${(p.seats / active.totalSeats) * 100}%`, backgroundColor: p.color }}
                title={`${p.nameEn}: ${p.seats}`}
              />
            ))}
          </div>

          {/* Party legend with seat numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {active.parties.map((p) => (
              <div key={p.code} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white truncate">
                    {lang === "hi" ? p.nameHi : p.nameEn}
                  </div>
                  <div className="text-base font-newsreader font-black dark:text-white leading-none">
                    {p.seats}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex justify-between text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/40">
            <span>
              {lang === "hi"
                ? `${totalCounted} / ${active.totalSeats} सीटें घोषित`
                : `${totalCounted} / ${active.totalSeats} seats declared`}
            </span>
            <span>{lang === "hi" ? "स्रोत: ECI" : "Source: ECI"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
