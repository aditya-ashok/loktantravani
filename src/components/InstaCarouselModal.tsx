"use client";

/**
 * Gen-Z Instagram carousel generator — 1080×1080 slides built from an
 * article: hook cover → point slides → CTA. Preview, swipe, download
 * each slide (or all) as PNGs ready to post.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { X, ChevronLeft, ChevronRight, Download, Copy, Loader2, RefreshCw, Instagram } from "lucide-react";

type CarouselData = {
  hook: string;
  hookSub: string;
  points: { emoji: string; title: string; text: string }[];
  cta: string;
  caption: string;
  hashtags: string[];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post: { id?: string; title: string; category: string; imageUrl?: string; slug?: string };
}

const SIZE = 540; // rendered at 540, captured at 2x → 1080

export default function InstaCarouselModal({ isOpen, onClose, post }: Props) {
  const [data, setData] = useState<CarouselData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  // Gen-Z display fonts (skill guidance: bold editorial pairing)
  useEffect(() => {
    if (!document.getElementById("lv-insta-fonts")) {
      const link = document.createElement("link");
      link.id = "lv-insta-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const generate = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/insta-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, slug: post.slug, regenerate }),
      });
      const json = await res.json();
      if (!res.ok || !json.carousel) throw new Error(json.error || "Generation failed");
      setData(json.carousel);
      setSlide(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [post.id, post.slug]);

  useEffect(() => {
    if (isOpen && !data && !loading) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSlides = data ? data.points.length + 2 : 0;

  const downloadSlide = async (idx: number): Promise<void> => {
    setSlide(idx);
    await new Promise(r => setTimeout(r, 450));
    const node = slideRef.current;
    if (!node) return;
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      width: SIZE,
      height: SIZE,
      backgroundColor: "#151312",
    });
    const a = document.createElement("a");
    a.download = `${(post.slug || "loktantravani").slice(0, 50)}-slide-${idx + 1}.png`;
    a.href = dataUrl;
    a.click();
  };

  const downloadAll = async () => {
    setDownloading(true);
    try {
      for (let i = 0; i < totalSlides; i++) {
        await downloadSlide(i);
        await new Promise(r => setTimeout(r, 350));
      }
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    if (!data) return;
    const text = `${data.caption}\n\n${data.hashtags.map(h => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const grain: React.CSSProperties = {
    position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
  };

  const dots = (active: number) => (
    <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 7 }}>
      {Array.from({ length: totalSlides }).map((_, i) => (
        <span key={i} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 4, background: i === active ? "#FF9933" : "rgba(255,255,255,0.35)", transition: "all .2s" }} />
      ))}
    </div>
  );

  const handleBar = (dark: boolean) => (
    <div style={{ position: "absolute", top: 22, left: 28, right: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: dark ? "#151312" : "#fff" }}>
        LOKTANTRA<span style={{ color: "#FF9933" }}>VANI</span>
      </span>
      <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 500, fontSize: 11, color: dark ? "rgba(21,19,18,0.55)" : "rgba(255,255,255,0.65)" }}>
        {slide + 1}/{totalSlides}
      </span>
    </div>
  );

  const renderSlide = (idx: number) => {
    if (!data) return null;

    // ── Cover ──
    if (idx === 0) {
      return (
        <div style={{ width: SIZE, height: SIZE, position: "relative", overflow: "hidden", background: "linear-gradient(150deg, #1a0f00 0%, #3d1e00 45%, #7a2d00 100%)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {post.imageUrl && (
            <div style={{
              position: "absolute", inset: 0, opacity: 0.38,
              backgroundImage: `url('${post.imageUrl.startsWith("/") ? post.imageUrl : `/api/proxy-image?url=${encodeURIComponent(post.imageUrl)}`}')`,
              backgroundSize: "cover", backgroundPosition: "center 25%", filter: "saturate(0.4) contrast(1.1)",
            }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(10deg, rgba(20,10,0,0.92) 18%, rgba(20,10,0,0.15) 65%)" }} />
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,153,51,0.5), transparent 70%)" }} />
          <div style={grain} />
          {handleBar(false)}
          <div style={{ position: "absolute", left: 34, right: 34, bottom: 92 }}>
            <span style={{ display: "inline-block", fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 12, letterSpacing: 3, color: "#151312", background: "#FF9933", padding: "6px 14px", borderRadius: 999, marginBottom: 18, textTransform: "uppercase" }}>
              {post.category} · news drop
            </span>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 52, lineHeight: 1.04, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5, margin: 0, textShadow: "0 3px 24px rgba(0,0,0,0.4)" }}>
              {data.hook}
            </h2>
            {data.hookSub && (
              <p style={{ fontFamily: "'Space Grotesk'", fontWeight: 500, fontSize: 17, color: "rgba(255,255,255,0.85)", marginTop: 14 }}>
                {data.hookSub}
              </p>
            )}
            <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 13, color: "#FF9933", letterSpacing: 2 }}>
              SWIPE <span style={{ fontSize: 18 }}>→</span>
            </div>
          </div>
          {dots(0)}
        </div>
      );
    }

    // ── CTA ──
    if (idx === totalSlides - 1) {
      return (
        <div style={{ width: SIZE, height: SIZE, position: "relative", overflow: "hidden", background: "#151312", fontFamily: "'Space Grotesk', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 44 }}>
          <div style={{ position: "absolute", bottom: -120, left: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,153,51,0.35), transparent 70%)" }} />
          <div style={{ position: "absolute", top: -90, right: -70, width: 280, height: 280, borderRadius: "50%", border: "2px solid rgba(255,153,51,0.25)" }} />
          <div style={grain} />
          {handleBar(false)}
          <div style={{ fontSize: 46, marginBottom: 18 }}>🗞️</div>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 40, lineHeight: 1.1, color: "#fff", textTransform: "uppercase", margin: 0, maxWidth: 420 }}>
            {data.cta}
          </h2>
          <div style={{ marginTop: 26, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20, color: "#FF9933" }}>
            @loktantravani
          </div>
          <div style={{ marginTop: 8, fontFamily: "'Space Grotesk'", fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.55)", letterSpacing: 1.5 }}>
            loktantravani.in · India&apos;s 1st AI newspaper
          </div>
          {dots(idx)}
        </div>
      );
    }

    // ── Point slides — alternate cream / dark ──
    const p = data.points[idx - 1];
    const darkSlide = idx % 2 === 0;
    const bg = darkSlide ? "#151312" : "#f6ecdd";
    const fg = darkSlide ? "#ffffff" : "#151312";
    const sub = darkSlide ? "rgba(255,255,255,0.8)" : "rgba(21,19,18,0.75)";
    return (
      <div style={{ width: SIZE, height: SIZE, position: "relative", overflow: "hidden", background: bg, fontFamily: "'Space Grotesk', sans-serif", padding: "0 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,153,51,0.16)" }} />
        <div style={grain} />
        {handleBar(!darkSlide)}
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 88, color: "rgba(255,153,51,0.9)", lineHeight: 1 }}>
          {String(idx).padStart(2, "0")}
        </div>
        <div style={{ fontSize: 40, margin: "10px 0 6px" }}>{p.emoji}</div>
        <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, lineHeight: 1.1, color: fg, textTransform: "uppercase", margin: "0 0 14px" }}>
          {p.title}
        </h3>
        <p style={{ fontFamily: "'Space Grotesk'", fontWeight: 500, fontSize: 21, lineHeight: 1.45, color: sub, margin: 0, maxWidth: 440 }}>
          {p.text}
        </p>
        {dots(idx)}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#111] w-full max-w-4xl rounded-sm overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-black text-white">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-[#FF9933]" />
            <span className="text-xs font-inter font-black uppercase tracking-widest">Insta Carousel — Gen-Z Drop</span>
          </div>
          <button onClick={onClose} className="hover:text-[#FF9933]"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 flex flex-col md:flex-row gap-6">
          {/* Slide preview */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm font-inter opacity-60 dark:text-white">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                Writing your carousel…
              </div>
            )}
            {error && !loading && (
              <div className="py-16 text-center">
                <p className="text-sm font-inter text-red-600 mb-4">{error}</p>
                <button onClick={() => generate(true)} className="px-6 py-2.5 bg-black text-white text-[10px] font-inter font-black uppercase tracking-widest">Retry</button>
              </div>
            )}
            {data && !loading && (
              <>
                <div style={{ width: SIZE, maxWidth: "100%", overflow: "hidden" }} className="shadow-2xl">
                  <div ref={slideRef}>{renderSlide(slide)}</div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0} className="p-2 border border-black/20 dark:border-white/20 disabled:opacity-30 dark:text-white"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-[10px] font-inter font-black uppercase tracking-widest dark:text-white">Slide {slide + 1} / {totalSlides}</span>
                  <button onClick={() => setSlide(s => Math.min(totalSlides - 1, s + 1))} disabled={slide === totalSlides - 1} className="p-2 border border-black/20 dark:border-white/20 disabled:opacity-30 dark:text-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </>
            )}
          </div>

          {/* Actions + caption */}
          {data && !loading && (
            <div className="w-full md:w-64 flex-shrink-0 space-y-3">
              <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-50 dark:text-white/50">Actions</p>
              <button onClick={downloadAll} disabled={downloading} className="w-full py-3 bg-[#FF9933] text-black text-[10px] font-inter font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "Rendering…" : `Download all ${totalSlides} slides`}
              </button>
              <button onClick={() => downloadSlide(slide)} className="w-full py-2.5 border border-black/20 dark:border-white/30 text-[10px] font-inter font-black uppercase tracking-widest dark:text-white hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2">
                <Download className="w-3.5 h-3.5" /> This slide only
              </button>
              <button onClick={() => generate(true)} className="w-full py-2.5 border border-black/20 dark:border-white/30 text-[10px] font-inter font-black uppercase tracking-widest dark:text-white hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Rewrite copy
              </button>

              <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-50 pt-2 dark:text-white/50">Caption</p>
              <div className="text-[11px] font-inter leading-relaxed bg-black/5 dark:bg-white/10 dark:text-white/80 p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {data.caption}
                {"\n\n"}
                <span className="opacity-60">{data.hashtags.map(h => `#${h}`).join(" ")}</span>
              </div>
              <button onClick={copyCaption} className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-inter font-black uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2">
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy caption + tags"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
