"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

interface BreakingItem {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  slug: string;
  breakingAt: string;
}

export default function BreakingNews() {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const { lang } = useLanguage();

  useEffect(() => {
    fetch("/api/admin/breaking")
      .then((r) => r.json())
      .then((d) => setItems(d.breaking || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-red-700 text-white relative overflow-hidden">
      <div className="max-w-screen-xl mx-auto flex items-center">
        {/* Badge */}
        <div className="bg-white text-red-700 px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0 z-10">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-inter font-black uppercase tracking-widest">Breaking</span>
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <div className="flex animate-marquee whitespace-nowrap py-2 px-4">
            {[...items, ...items].map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                href={`/${item.category.toLowerCase().replace(/\s+/g, "-")}/${item.slug}`}
                className="inline-flex items-center gap-3 mx-6 hover:underline"
              >
                <span className="text-[10px] font-inter font-black uppercase tracking-wider text-red-200">
                  {item.category}
                </span>
                <span className="text-xs font-newsreader font-bold">
                  {lang === "hi" && item.titleHi ? item.titleHi : item.title}
                </span>
                <span className="text-[9px] text-red-300 font-inter">
                  {timeAgoShort(item.breakingAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgoShort(dateStr: string): string {
  if (!dateStr) return "";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
