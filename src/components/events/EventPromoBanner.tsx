"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { EVENTS } from "@/lib/events";

/** Home-page promo for the next open LoktantraVani event. */
export default function EventPromoBanner() {
  const { lang, t } = useLanguage();
  const event = EVENTS.find((e) => e.open);
  if (!event) return null;
  const tr = (v: { en: string; hi: string }) => (lang === "hi" ? v.hi : v.en);
  const when = event.date
    ? new Date(event.date).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : t("Date: to be informed", "तिथि: जल्द घोषित होगी");

  return (
    <section className="max-w-screen-xl mx-auto px-4 md:px-8 pt-4">
      <Link
        href={event.path}
        className="group relative flex items-center gap-4 md:gap-6 overflow-hidden rounded-lg bg-gradient-to-r from-[#0B1B5C] via-[#1E3FD8] to-[#3B6BFF] p-3 md:p-4 text-white shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#FFD600]/20 blur-2xl" aria-hidden="true" />
        <div className="relative shrink-0 w-16 h-20 md:w-24 md:h-[120px] overflow-hidden rounded border-2 border-[#FFD600]">
          <Image src={event.poster} alt={event.guest} fill sizes="96px" className="object-cover object-top" />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-inter font-black uppercase tracking-widest bg-[#FFD600] text-black px-2 py-0.5 rounded-sm">
            <Sparkles className="w-3 h-3" /> {tr(event.show)} · {t("AI-powered", "AI आधारित")}
          </p>
          <h2 className="mt-1.5 text-base md:text-2xl font-black leading-tight">{tr(event.title)}</h2>
          <p className="text-xs md:text-sm text-white/80 truncate">
            {t("with", "अतिथि")} <span className="font-bold text-white">{event.guest}</span>, {tr(event.guestRole)}
          </p>
          {event.panelists.length > 0 && (
            <p className="hidden md:block text-xs text-white/70 truncate">
              {t("Panelists:", "पैनलिस्ट:")} {event.panelists.join(", ")}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-[11px] md:text-xs text-[#FFD600]">
            <CalendarClock className="w-3.5 h-3.5" /> {when}
          </p>
        </div>
        <span className="relative hidden sm:inline-flex shrink-0 items-center gap-2 bg-[#FFD600] text-black text-xs md:text-sm font-black uppercase tracking-widest px-4 py-2.5 rounded group-hover:gap-3 transition-all">
          {t("Register free", "मुफ्त पंजीकरण")} <ArrowRight className="w-4 h-4" />
        </span>
        <ArrowRight className="relative sm:hidden w-5 h-5 text-[#FFD600] shrink-0" />
      </Link>
    </section>
  );
}
