"use client";

import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function AIBriefClient({ en, hi }: { en: string; hi: string }) {
  const { lang, t } = useLanguage();
  return (
    <div className="border-b border-[var(--nyt-border)] bg-[var(--secondary)] dark:bg-[#111]">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-[9px] font-inter font-black uppercase tracking-[0.3em] text-primary mb-1">
            {t("Vani AI Brief", "वाणी एआई ब्रीफ़")}
          </p>
          <p className="text-sm font-newsreader leading-6 text-[var(--nyt-black)] dark:text-white/85">
            {lang === "hi" ? hi : en}
          </p>
        </div>
      </div>
    </div>
  );
}
