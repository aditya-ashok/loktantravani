"use client";

import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, X, Loader2, Copy, Check, Instagram, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

interface InstaShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    summary: string;
    category: string;
    author: string;
    imageUrl: string;
    url: string;
    date?: string;
    language?: string;
  };
}

// Saffron + white theme (dark card). Solid colours only — gradient-clipped text
// renders as an invisible block in html-to-image, so brand text stays solid.
const SAFFRON = "#FF9933";
const SAFF_GRAD = "linear-gradient(90deg, #FF9933, #FFB347)";

const CAT_EMOJI: Record<string, string> = {
  India: "🇮🇳", Economy: "📈", Politics: "🏛️", Tech: "💻", World: "🌍",
  Defence: "🛡️", Cities: "🏙️", Sports: "🏆", Geopolitics: "🌐", Opinion: "💭",
  "Lok Post": "⭐", Culture: "🎭", Viral: "🔥", "West Asia": "🕌", Markets: "📊",
};

const CARD = 400; // rendered square; exported at 1080

export default function InstaShareModal({ isOpen, onClose, post }: InstaShareModalProps) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const emoji = CAT_EMOJI[post.category] || "📰";
  const isHindi = post.language === "hi" || (post.title && /[ऀ-ॿ]/.test(post.title));

  const caption =
    `${post.title}\n\n${(post.summary || "").slice(0, 140)}${post.summary && post.summary.length > 140 ? "…" : ""}` +
    `\n\n🔗 Full story — link in bio` +
    `\n\n#LoktantraVani #${post.category.replace(/\s+/g, "")} #India #News #Bharat #GenZ #Explained`;

  const encodedUrl = encodeURIComponent(post.url);
  const encodedTitle = encodeURIComponent(post.title);
  const waText = encodeURIComponent(`${post.title}\n\n${post.url}\n\n#LoktantraVani #${post.category.replace(/\s+/g, "")} #India`);
  const shareTo = (platform: "whatsapp" | "x" | "facebook" | "linkedin") => {
    const map: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${waText}`,
      x: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=LoktantraVani,India,News`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    window.open(map[platform], "_blank", "noopener,noreferrer");
  };

  // Robust PNG export — inline images via proxy to avoid CORS canvas tainting.
  const render = async (): Promise<string> => {
    if (!cardRef.current) throw new Error("no card");
    const imgs = Array.from(cardRef.current.querySelectorAll("img"));
    const orig: { img: HTMLImageElement; src: string }[] = [];
    for (const img of imgs) {
      if (img.src && !img.src.startsWith("data:")) {
        orig.push({ img, src: img.src });
        try {
          const isLocal = img.src.startsWith(window.location.origin) || img.src.startsWith("/");
          const fetchUrl = isLocal ? (img.getAttribute("src") || img.src) : `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
          const r = await fetch(fetchUrl);
          if (r.ok) {
            const blob = await r.blob();
            img.src = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(blob); });
          } else {
            img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
            img.style.background = SAFF_GRAD;
          }
        } catch {
          img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
          img.style.background = SAFF_GRAD;
        }
      }
    }
    await Promise.all(orig.map(({ img }) => new Promise<void>((res) => {
      if (img.complete && img.naturalWidth > 0) return res();
      img.onload = () => res(); img.onerror = () => res(); setTimeout(res, 3000);
    })));
    await new Promise((r) => setTimeout(r, 250));

    const ratio = 1080 / (cardRef.current.offsetWidth || CARD); // export at 1080px square
    let dataUrl = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        dataUrl = await toPng(cardRef.current, {
          cacheBust: true, quality: 1, pixelRatio: ratio, backgroundColor: "#0C0C11",
          skipFonts: attempt === 2,
          width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight,
        });
        if (dataUrl.length > 5000) break;
      } catch { if (attempt === 2) throw new Error("toPng failed"); }
      await new Promise((r) => setTimeout(r, 500));
    }
    for (const { img, src } of orig) img.src = src;
    return dataUrl;
  };

  const fileName = () => `loktantravani-insta-${post.title.slice(0, 60).replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-").toLowerCase()}.png`;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await render();
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile && navigator.share && (navigator as Navigator).canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], fileName(), { type: "image/png" });
          if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: post.title }); return; }
        } catch { /* fall through to download */ }
      }
      const link = document.createElement("a");
      link.download = fileName();
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Insta card export failed:", e);
      alert("Couldn't generate the card. Try again, or screenshot the preview.");
    } finally {
      setTimeout(() => setIsGenerating(false), 700);
    }
  };

  const handleCopyCaption = async () => {
    try { await navigator.clipboard.writeText(caption); }
    catch {
      const ta = document.createElement("textarea"); ta.value = caption; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const heroSrc = post.imageUrl
    ? (post.imageUrl.startsWith("/") ? post.imageUrl : `/api/proxy-image?url=${encodeURIComponent(post.imageUrl)}`)
    : "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-6 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#111] rounded-t-2xl sm:rounded-xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: "#0C0C11" }}>
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4" style={{ color: SAFFRON }} />
            <span className="text-xs font-inter font-black uppercase tracking-widest">Insta Card</span>
          </div>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">

          {/* ── SQUARE CARD (1:1, exports at 1080) — saffron + white ── */}
          <div className="flex-shrink-0 flex justify-center">
            <div
              ref={cardRef}
              className="relative flex flex-col overflow-hidden"
              style={{ width: CARD, height: CARD, background: "#0C0C11", fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", borderRadius: 0 }}
            >
              {/* saffron → white hairline */}
              <div style={{ height: 4, flexShrink: 0, background: "linear-gradient(90deg, #FF9933, #ffffff)" }} />

              {/* Hero image */}
              <div className="relative flex-shrink-0" style={{ height: 172, background: SAFF_GRAD }}>
                {heroSrc && (
                  <img
                    src={heroSrc} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" style={{ objectPosition: "center 30%" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                {/* top scrim */}
                <div className="absolute inset-x-0 top-0" style={{ height: 70, background: "linear-gradient(180deg, rgba(0,0,0,0.55), transparent)" }} />
                {/* bottom fade into card */}
                <div className="absolute inset-x-0 bottom-0" style={{ height: 90, background: "linear-gradient(180deg, transparent, #0C0C11)" }} />

                {/* category pill */}
                <div className="absolute left-4 top-3.5 flex items-center gap-1.5 rounded-full"
                  style={{ background: SAFF_GRAD, padding: "5px 12px", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" }}>
                  <span style={{ fontSize: 12 }}>{emoji}</span>
                  <span className="font-black uppercase text-white" style={{ fontSize: 10, letterSpacing: "0.12em" }}>{post.category}</span>
                </div>

                {/* wordmark */}
                <div className="absolute right-4 top-3.5 text-right">
                  <p className="font-black leading-none text-white" style={{ fontSize: 15, letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                    Loktantra<span style={{ color: SAFFRON }}>Vani</span>
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 min-h-0 px-5" style={{ paddingTop: 8, paddingBottom: 16 }}>
                {/* accent tick */}
                <div style={{ width: 46, height: 5, borderRadius: 9, background: SAFF_GRAD, marginBottom: 10, flexShrink: 0 }} />

                {/* headline — flexes into available space so the footer is never pushed out */}
                <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                  <h3 className={cn("font-black text-white", isHindi && "hindi")}
                    style={{ fontSize: post.title.length > 96 ? 20 : post.title.length > 70 ? 22 : 25, lineHeight: 1.1, letterSpacing: "-0.015em", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                    {post.title}
                  </h3>
                </div>

                {/* footer — fixed height, protected from clipping */}
                <div className="flex items-end justify-between flex-shrink-0" style={{ paddingTop: 10 }}>
                  <div className="min-w-0">
                    {post.author && !/^loktantravani/i.test(post.author) && (
                      <p className="font-black uppercase text-white" style={{ fontSize: 9, letterSpacing: "0.08em", marginBottom: 3, opacity: 0.95 }}>
                        {t("By", "द्वारा")} {post.author}
                      </p>
                    )}
                    <p className="font-black" style={{ fontSize: 13, color: SAFFRON }}>
                      @loktantravani
                    </p>
                    <p className="font-bold uppercase" style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      India&apos;s First AI Newspaper
                    </p>
                    <div className="flex items-center gap-1" style={{ marginTop: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 9, background: "#FF9933" }} />
                      <span style={{ width: 7, height: 7, borderRadius: 9, background: "#ffffff" }} />
                      <span style={{ width: 7, height: 7, borderRadius: 9, background: "#FF9933" }} />
                      <span className="font-black uppercase" style={{ fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", marginLeft: 6 }}>
                        Scan to read →
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0" style={{ padding: 5, background: "#fff", borderRadius: 10, marginLeft: 10 }}>
                    <QRCodeCanvas value={post.url} size={46} level="M" fgColor="#0C0C11" bgColor="#ffffff" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTROLS ── */}
          <div className="w-full md:w-52 flex flex-col gap-3">
            <p className="text-[9px] font-inter font-black uppercase tracking-[0.15em] opacity-40 dark:text-white/40">{t("Instagram-ready", "इंस्टाग्राम-रेडी")}</p>

            <button onClick={handleDownload} disabled={isGenerating}
              className="w-full py-3 text-white font-inter font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: SAFF_GRAD }}>
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {t("Download / Share", "डाउनलोड / शेयर")}
            </button>

            <button onClick={handleCopyCaption}
              className="w-full py-3 bg-[#0C0C11] text-white font-inter font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg hover:opacity-80 transition-opacity">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t("Copied!", "कॉपी हो गया!") : t("Copy Caption", "कैप्शन कॉपी करें")}
            </button>

            {/* Share the article link to any platform */}
            <div className="border-t border-black/10 dark:border-white/10 pt-3 mt-1">
              <p className="text-[9px] font-inter font-black uppercase tracking-[0.15em] opacity-40 dark:text-white/40 mb-2">{t("Share to", "शेयर करें")}</p>
              <div className="flex gap-2">
                <button onClick={() => shareTo("whatsapp")} title="WhatsApp" className="flex-1 py-2.5 border border-[#25D366] text-[#25D366] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all rounded-md">
                  <MessageCircle className="w-3.5 h-3.5" /> WA
                </button>
                <button onClick={() => shareTo("x")} title="Share on X" className="flex-1 py-2.5 border border-black dark:border-white/60 dark:text-white text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all rounded-md">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> X
                </button>
                <button onClick={() => shareTo("facebook")} title="Share on Facebook" className="flex-1 py-2.5 border border-[#1877F2] text-[#1877F2] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1 hover:bg-[#1877F2] hover:text-white transition-all rounded-md">
                  FB
                </button>
              </div>
              <button onClick={() => shareTo("linkedin")} title="Share on LinkedIn" className="w-full mt-2 py-2.5 border border-[#0A66C2] text-[#0A66C2] text-[9px] font-inter font-black uppercase flex items-center justify-center gap-1.5 hover:bg-[#0A66C2] hover:text-white transition-all rounded-md">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>
                LinkedIn
              </button>
              <p className="text-[9px] font-inter leading-snug opacity-45 dark:text-white/45 mt-2.5">
                {t(
                  "Download the 1080×1080 card for Instagram — or attach it anywhere. The buttons above share the article link.",
                  "इंस्टाग्राम के लिए 1080×1080 कार्ड डाउनलोड करें — या कहीं भी अटैच करें। ऊपर के बटन लेख का लिंक शेयर करते हैं।"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
