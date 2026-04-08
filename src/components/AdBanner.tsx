"use client";

import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  brand: string;
  imageUrl: string;
  link: string;
  priority: number;
}

let cachedAds: Ad[] | null = null;

export default function AdBanner({ placement = "between-articles" }: { placement?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    async function load() {
      if (!cachedAds) {
        try {
          const res = await fetch("/api/admin/ads");
          const data = await res.json();
          cachedAds = (data.ads || []).filter((a: Ad & { active: boolean; placement: string }) =>
            a.active && (a.placement === placement || a.placement === "all")
          );
        } catch {
          cachedAds = [];
        }
      }
      if (cachedAds && cachedAds.length > 0) {
        // Pick random ad weighted by priority
        const pick = cachedAds[Math.floor(Math.random() * cachedAds.length)];
        setAd(pick);
      }
    }
    load();
  }, [placement]);

  if (!ad) return null;

  const inner = (
    <div className="bg-[#f5f0e8] border border-[#d4c9b8] py-2 px-4 text-center">
      <p className="text-[7px] font-inter uppercase tracking-[3px] text-[#999] mb-1">Advertisement</p>
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} className="max-h-24 mx-auto object-contain mb-1" />
      )}
      <p className="text-[11px] font-inter font-bold text-[#333]">
        {ad.brand ? `${ad.brand} — ` : ""}{ad.title}
      </p>
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
