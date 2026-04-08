"use client";

import { useEffect, useRef } from "react";

// ── Single source of truth ──────────────────────────────────
const PUB_ID = "ca-pub-9021821912868122";

interface GoogleAdProps {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
  layout?: "in-article" | "";
  className?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
}

export default function GoogleAd({
  slot,
  format = "auto",
  layout,
  className = "",
  responsive = true,
  style,
}: GoogleAdProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !PUB_ID) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded or ad-blocker active
    }
  }, []);

  // Don't render anything if AdSense not configured — show HouseAd instead
  if (!PUB_ID) return <HouseAd />;

  return (
    <div className={`ad-container my-6 text-center ${className}`}>
      <p className="text-[7px] font-inter uppercase tracking-[3px] text-[#999] mb-1">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

// ── In-Article Ad — placed between paragraphs ───────────────
export function InArticleAd() {
  return (
    <GoogleAd
      format="fluid"
      layout="in-article"
      style={{ textAlign: "center" }}
    />
  );
}

// ── Leaderboard — top of page or between sections ───────────
export function LeaderboardAd({ className = "" }: { className?: string }) {
  return (
    <GoogleAd
      format="horizontal"
      className={className}
      style={{ minHeight: 90 }}
    />
  );
}

// ── House Ad — shown when AdSense is not yet configured ─────
export function HouseAd({ placement = "between" }: { placement?: string }) {
  return (
    <div className="my-8 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-6 text-center">
      <p className="text-[7px] font-inter uppercase tracking-[3px] text-purple-400 mb-2">From LoktantraVani</p>
      <h3 className="text-lg font-newsreader font-bold text-purple-900 dark:text-purple-200 mb-2">
        ⚡ Go Ultra — Ad-Free Reading
      </h3>
      <p className="text-xs font-inter text-purple-700 dark:text-purple-300 mb-3 max-w-md mx-auto">
        Support independent AI journalism. Get exclusive analysis, West Asia data, market predictions, and zero ads for just ₹99/month.
      </p>
      <a
        href="/premium"
        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-black px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-purple-500/20"
      >
        ⚡ Go Ultra — ₹99/mo
      </a>
    </div>
  );
}
