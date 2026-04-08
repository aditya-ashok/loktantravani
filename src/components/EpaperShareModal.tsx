"use client";

import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, X, Loader2, Copy, Check, MessageCircle, Share2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AUTHORS } from "@/lib/authors";

interface EpaperShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    summary: string;
    category: string;
    author: string;
    authorPhoto?: string;
    authorDesignation?: string;
    authorBio?: string;
    imageUrl: string;
    url: string;
    date?: string;
    readingTimeMin?: number;
    content?: string;
    language?: string;
  };
}

type CardTheme = "default" | "bjp";

export default function EpaperShareModal({ isOpen, onClose, post }: EpaperShareModalProps) {
  const { lang } = useLanguage();
  const { userRole } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<CardTheme>("default");

  if (!isOpen) return null;

  const isAdmin = userRole === "admin";
  const siteUrl = "loktantravani.in";
  const hashtags = theme === "bjp"
    ? `#SaffronDispatch #NaMo #NewIndia #LoktantraVani`
    : `#LoktantraVani #${post.category.replace(/\s+/g, "")} #IndiaNews`;
  const shareText = `${post.title}\n\n${post.summary?.slice(0, 100) || ""}...\n\nRead: ${post.url}\n\n${hashtags}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(post.url);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedHashtags = encodeURIComponent(theme === "bjp" ? "SaffronDispatch,NaMo,LoktantraVani" : "LoktantraVani,IndiaNews");

  // Generate PNG — inline images first to avoid CORS, then render
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    const isMobile = window.innerWidth < 768;
    const ratio = isMobile ? 3 : 4;
    try {
      // Convert ALL images to data URLs to avoid CORS canvas tainting
      const imgs = cardRef.current.querySelectorAll("img");
      const origSrcs: { img: HTMLImageElement; src: string }[] = [];
      for (const img of Array.from(imgs)) {
        if (img.src && !img.src.startsWith("data:")) {
          origSrcs.push({ img, src: img.src });
          try {
            // Always proxy external images to avoid CORS; local images fetch directly
            const isLocal = img.src.startsWith(window.location.origin) || img.src.startsWith("/");
            const fetchUrl = isLocal
              ? img.getAttribute("src") || img.src
              : `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
            const r = await fetch(fetchUrl);
            if (r.ok) {
              const blob = await r.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              img.src = dataUrl;
            } else {
              // Proxy failed — replace with a 1x1 transparent pixel so toPng doesn't taint canvas
              img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
              img.style.background = `linear-gradient(135deg, ${accent}, #e8870a)`;
            }
          } catch {
            // Replace with transparent pixel + gradient fallback
            img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
            img.style.background = `linear-gradient(135deg, ${accent}, #e8870a)`;
          }
        }
      }

      // Wait for all images to fully load after src change (critical for mobile)
      await Promise.all(
        origSrcs.map(({ img }) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) { resolve(); return; }
            img.onload = () => resolve();
            img.onerror = () => resolve();
            // Safety timeout — don't block forever
            setTimeout(resolve, 3000);
          })
        )
      );
      // Extra delay for mobile rendering pipeline
      await new Promise(r => setTimeout(r, 300));

      // Render PNG — try multiple times on mobile (first attempt can sometimes fail)
      let dataUrl = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            quality: 1,
            pixelRatio: ratio,
            backgroundColor: "#FFFFFF",
            skipFonts: true,
          });
          // Check if image is not blank (blank PNGs are very small)
          if (dataUrl.length > 5000) break;
        } catch {
          if (attempt === 2) throw new Error("toPng failed after 3 attempts");
        }
        await new Promise(r => setTimeout(r, 500));
      }

      // Restore original image sources
      for (const { img, src } of origSrcs) img.src = src;

      // Mobile: use share API if available, otherwise download
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `${post.title.slice(0, 60).replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-")}.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: post.title });
            return;
          }
        } catch { /* fallback to download */ }
      }

      const link = document.createElement("a");
      link.download = `${post.title.slice(0, 80).replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG generation failed:", err);
      // Restore images — origSrcs not in scope here, so just reload

      // Fallback: try without inlining images
      try {
        if (!cardRef.current) throw new Error("no card ref");
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: ratio, skipFonts: true });
        const link = document.createElement("a");
        link.download = `loktantravani-share.png`;
        link.href = dataUrl;
        link.click();
      } catch (err2) {
        console.error("Fallback PNG also failed:", err2);
        alert("Download failed. Please try taking a screenshot instead.");
      }
    } finally {
      setTimeout(() => setIsGenerating(false), 800);
    }
  };

  const shareTo = (platform: "whatsapp" | "x" | "facebook" | "linkedin") => {
    if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    else if (platform === "x") window.open(`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${encodedHashtags}`, "_blank");
    else if (platform === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
    else if (platform === "linkedin") window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHindi = post.language === "hi" || (post.title && /[\u0900-\u097F]/.test(post.title));
  const gregorianDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  let vikramDisplay = "";
  try {
    const { toVikramSamvat } = require("@/lib/utils");
    const vs = toVikramSamvat(new Date());
    vikramDisplay = isHindi
      ? `${vs.monthHi} ${vs.tithi}, विक्रम संवत ${vs.year}`
      : `${vs.month} ${vs.tithi}, Vikram Samvat ${vs.year}`;
  } catch { /* */ }

  // Theme colors
  const isBjp = theme === "bjp";
  const accent = isBjp ? "#FF6600" : "#FF9933";
  const topBarBg = isBjp ? "linear-gradient(90deg, #FF6600, #FF9933, #138808)" : `linear-gradient(90deg, ${accent}, #e8870a)`;
  const bottomBg = isBjp ? "#121212" : "#121212";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#111] rounded-t-xl sm:rounded-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close handle for mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-black text-white">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#FF9933]" />
            <span className="text-xs font-inter font-black uppercase tracking-widest">Share Article</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme selector — admin only */}
            {isAdmin && (
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme("default")}
                  className={cn("px-2 py-0.5 text-[8px] font-inter font-black uppercase rounded-sm transition-all",
                    theme === "default" ? "bg-[#FF9933] text-white" : "bg-white/10 text-white/50 hover:text-white"
                  )}
                >Default</button>
                <button
                  onClick={() => setTheme("bjp")}
                  className={cn("px-2 py-0.5 text-[8px] font-inter font-black uppercase rounded-sm transition-all",
                    theme === "bjp" ? "bg-[#FF6600] text-white" : "bg-white/10 text-white/50 hover:text-white"
                  )}
                >🪷 Saffron</button>
              </div>
            )}
            <button onClick={onClose} className="hover:text-[#FF9933] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">

          {/* ── CARD PREVIEW — 4:5 ratio ──────────── */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div
              ref={cardRef}
              className="flex flex-col relative overflow-hidden shadow-lg"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                width: 400, minHeight: 480,
                background: "#FFFFFF",
              }}
            >
              {/* BJP Lotus Watermark — text-based to avoid missing image issues */}
              {isBjp && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.06, fontSize: "200px", lineHeight: 1 }}>
                  🪷
                </div>
              )}

              {/* Top accent bar */}
              <div className="h-1.5 flex-shrink-0 relative z-10" style={{ background: topBarBg }} />

              {/* Masthead */}
              <div className="px-3 py-1.5 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: isBjp ? "#FF993330" : "#e5e5e5" }}>
                <div className="flex items-center gap-2">
                  {isBjp && (
                    <div className="text-xl leading-none">🪷</div>
                  )}
                  <div>
                    <h2 className={cn("text-sm font-black tracking-tight leading-none", isBjp && isHindi ? "hindi" : "font-newsreader")} style={{ color: isBjp ? "#121212" : "#121212" }}>
                      {isBjp ? (isHindi ? "केसरिया" : "Saffron") : "Loktantra"}<span style={{ color: accent }}>{isBjp ? (isHindi ? "-संदेश" : "Dispatch") : "Vani"}</span>
                    </h2>
                    <p className="text-[4px] font-inter font-bold uppercase tracking-[0.12em]" style={{ color: isBjp ? "#FF6600" : "#bbb" }}>
                      {isBjp ? (isHindi ? "नये भारत की आवाज़" : "The Voice of New India") : "India's First AI Newspaper"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {vikramDisplay && <p className="text-[7px] font-inter font-bold" style={{ color: isBjp ? "#FF6600" : accent, lineHeight: "1.6" }}>{vikramDisplay}</p>}
                  <p className="text-[7px] font-inter font-black uppercase px-1.5 py-0.5" style={{ color: "#fff", background: isBjp ? "#FF6600" : accent, lineHeight: "1.4", display: "inline-block" }}>{gregorianDate}</p>
                </div>
              </div>

              {/* Hero Image */}
              {post.imageUrl && (
                <div className="w-full overflow-hidden flex-shrink-0" style={{ height: 175 }}>
                  <img src={post.imageUrl} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Content */}
              <div className="px-4 pt-2 flex flex-col min-h-0">
                {/* Category */}
                <span className="text-[6px] font-inter font-black uppercase tracking-[0.15em] mb-1" style={{ color: accent }}>{post.category}</span>

                {/* Headline */}
                <h3 className={cn(
                  "text-[14px] font-newsreader font-black leading-snug mb-1.5",
                  isHindi && "hindi"
                )} style={{ color: "#121212" }}>
                  {post.title}
                </h3>

                {/* Pull Quote — extracted from summary */}
                <div className="my-1.5 px-3 py-2 border-l-[3px] relative" style={{ borderColor: accent, background: isBjp ? "#FF993310" : "#f9f5ef" }}>
                  <span className="absolute -top-1 left-1 text-[20px] leading-none font-newsreader" style={{ color: accent }}>&ldquo;</span>
                  <p className={cn("text-[8px] font-newsreader italic leading-relaxed pl-3", isHindi && "hindi")} style={{ color: "#333" }}>
                    {post.summary}
                  </p>
                  <p className="text-[6px] font-inter font-bold mt-1 pl-3" style={{ color: accent }}>— {post.author}</p>
                </div>

                {/* Author + QR */}
                <div className="flex items-start justify-between pt-2 pb-2 border-t" style={{ borderColor: isBjp ? "#FF993330" : "#eee" }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2" style={{ borderColor: accent }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-newsreader font-bold flex-shrink-0" style={{ background: `${accent}20`, color: accent }}>
                        {post.author.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      {(() => {
                        const ap = AUTHORS.find(a => a.name === post.author);
                        const desg = post.authorDesignation || ap?.designation || "";
                        const bio = post.authorBio || ap?.bio || "";
                        return (
                          <>
                            <p className="font-newsreader font-bold leading-tight" style={{ color: "#121212", fontSize: "8px" }}>{post.author}</p>
                            {desg && (
                              <p className="text-[5.5px] font-inter font-bold uppercase tracking-wider leading-tight" style={{ color: accent }}>{desg}</p>
                            )}
                            {bio && (
                              <p className="text-[5.5px] font-inter leading-snug max-w-[220px] mt-0.5" style={{ color: "#777" }}>
                                {bio}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center flex-shrink-0 ml-2">
                    <div className="p-1.5 rounded-sm" style={{ border: `2px solid ${accent}`, background: "white" }}>
                      <QRCodeCanvas
                        value={post.url}
                        size={55}
                        level="M"
                        fgColor="#121212"
                        bgColor="white"
                      />
                    </div>
                    <span className="font-inter font-bold mt-0.5 uppercase" style={{ color: accent, fontSize: "4px", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      Scan to Read
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="h-6 flex items-center justify-center flex-shrink-0" style={{ background: bottomBg }}>
                <p className="text-[6px] font-inter font-bold uppercase tracking-[0.2em] text-white/60">
                  {siteUrl}
                </p>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR CONTROLS ──────────────────────────── */}
          <div className="w-full md:w-48 flex flex-col gap-3">
            <p className="text-[9px] font-inter font-black uppercase tracking-[0.15em] opacity-40">Actions</p>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full py-3 text-white font-inter font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-colors"
              style={{ background: accent }}
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download PNG
            </button>

            <button
              onClick={handleCopy}
              className="w-full py-3 bg-[#121212] text-white font-inter font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <div className="border-t border-black/10 pt-3 mt-1">
              <p className="text-[9px] font-inter font-black uppercase tracking-[0.15em] opacity-40 mb-2">Share to</p>

              <div className="flex gap-2">
                <button onClick={() => shareTo("whatsapp")} className="flex-1 py-2.5 border border-[#25D366] text-[#25D366] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all rounded-sm">
                  <MessageCircle className="w-3.5 h-3.5" /> WA
                </button>
                <button onClick={() => shareTo("x")} className="flex-1 py-2.5 border border-black text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-black hover:text-white transition-all rounded-sm">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X
                </button>
                <button onClick={() => shareTo("facebook")} className="flex-1 py-2.5 border border-[#1877F2] text-[#1877F2] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-[#1877F2] hover:text-white transition-all rounded-sm">
                  FB
                </button>
              </div>

              <button onClick={() => shareTo("linkedin")} className="w-full mt-2 py-2.5 border border-[#0A66C2] text-[#0A66C2] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1.5 hover:bg-[#0A66C2] hover:text-white transition-all rounded-sm">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
