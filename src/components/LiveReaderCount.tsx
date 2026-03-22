"use client";

import { useState, useEffect } from "react";
import { Eye, Users } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface LiveReaderCountProps {
  postId?: string;
  compact?: boolean;
}

export default function LiveReaderCount({ postId, compact = false }: LiveReaderCountProps) {
  const { t } = useLanguage();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    // Simulate live reader count with realistic variance
    const base = postId ? 12 + Math.floor(Math.random() * 50) : 2400 + Math.floor(Math.random() * 600);
    setLiveCount(base);

    const interval = setInterval(() => {
      setLiveCount((prev) => {
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(1, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [postId]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-inter font-bold">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Eye className="w-3.5 h-3.5 text-primary" />
        <span className="dark:text-white/60">
          <span className="text-primary font-black">{liveCount}</span> {t("reading", "पढ़ रहे")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-black/10 dark:border-white/10">
      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
      <Eye className="w-4 h-4 text-primary" />
      <span className="text-sm font-inter dark:text-white">
        <span className="text-primary font-black text-lg">{liveCount.toLocaleString()}</span>
        <span className="text-[10px] uppercase tracking-widest opacity-60 ml-2">
          {t("reading now", "अभी पढ़ रहे हैं")}
        </span>
      </span>
    </div>
  );
}
