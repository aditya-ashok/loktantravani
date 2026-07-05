"use client";

import { useEffect, useState } from "react";
import { HouseAd } from "@/components/GoogleAd";

interface Ad {
  id: string;
  title: string;
  brand: string;
  content: string;
  imageUrl: string;
  link: string;
  priority: number;
}

let cachedAds: (Ad & { active: boolean; placement: string })[] | null = null;

/** Pick a random ad weighted by priority (1-10) */
function weightedPick(ads: Ad[]): Ad {
  const total = ads.reduce((s, a) => s + Math.max(1, a.priority || 5), 0);
  let roll = Math.random() * total;
  for (const a of ads) {
    roll -= Math.max(1, a.priority || 5);
    if (roll <= 0) return a;
  }
  return ads[0];
}

/**
 * Renders a sponsor ad from the admin Advertisements panel (Firestore `ads`
 * collection), filtered by placement. Falls back to the house ad when no
 * campaign matches and `houseFallback` is set.
 */
export default function AdBanner({ placement = "between-articles", houseFallback = false }: { placement?: string; houseFallback?: boolean }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!cachedAds) {
        try {
          const res = await fetch("/api/admin/ads");
          const data = await res.json();
          cachedAds = data.ads || [];
        } catch {
          cachedAds = [];
        }
      }
      const eligible = (cachedAds || []).filter(a => a.active && (a.placement === placement || a.placement === "all"));
      if (eligible.length > 0) setAd(weightedPick(eligible));
      setLoaded(true);
    }
    load();
  }, [placement]);

  if (!loaded) return null;
  if (!ad) return houseFallback ? <HouseAd placement={placement} /> : null;

  const monogram = (ad.brand || ad.title || "A").charAt(0).toUpperCase();

  const inner = (
    <div className="group border border-[var(--nyt-border)] bg-[#faf8f3] dark:bg-[#15130e] dark:border-white/10 px-5 py-4">
      <p className="text-[7px] font-inter font-bold uppercase tracking-[3px] text-black/30 dark:text-white/30 mb-2.5">
        Sponsored
      </p>
      <div className="flex items-center gap-4">
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt={ad.brand || ad.title} className="w-16 h-16 object-contain shrink-0" />
        ) : (
          <div className="w-12 h-12 shrink-0 rounded-full bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-newsreader font-black text-xl">{monogram}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {ad.brand && (
            <p className="text-[9px] font-inter font-black uppercase tracking-[2px] text-primary mb-0.5">{ad.brand}</p>
          )}
          <p className="font-newsreader font-black text-base leading-snug text-[var(--nyt-black)] dark:text-white">
            {ad.title}
          </p>
          {ad.content && (
            <p className="text-xs font-inter text-black/55 dark:text-white/55 mt-1 leading-relaxed line-clamp-2">{ad.content}</p>
          )}
        </div>
        {ad.link && (
          <span className="hidden sm:inline-flex shrink-0 items-center px-4 py-2 border border-black dark:border-white text-[9px] font-inter font-black uppercase tracking-[2px] text-[var(--nyt-black)] dark:text-white group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
            Visit →
          </span>
        )}
      </div>
    </div>
  );

  if (ad.link) {
    return (
      <a href={ad.link} target="_blank" rel="noopener noreferrer sponsored" className="block my-6">
        {inner}
      </a>
    );
  }
  return <div className="my-6">{inner}</div>;
}
