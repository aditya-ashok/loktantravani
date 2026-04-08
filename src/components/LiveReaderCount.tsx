"use client";

import { Eye } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface LiveReaderCountProps {
  postId?: string;
  compact?: boolean;
  viewCount?: number;
}

export default function LiveReaderCount({ compact = false, viewCount = 0 }: LiveReaderCountProps) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-inter font-bold">
        <Eye className="w-3.5 h-3.5 opacity-40" />
        <span className="dark:text-white/60">
          <span className="font-black">{viewCount}</span> {t("views", "दृश्य")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-black/10 dark:border-white/10">
      <Eye className="w-4 h-4 opacity-40" />
      <span className="text-sm font-inter dark:text-white">
        <span className="font-black text-lg">{viewCount.toLocaleString()}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-60 ml-2">
          {t("views", "दृश्य")}
        </span>
      </span>
    </div>
  );
}
