"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { Post } from "@/lib/types";

/**
 * Featured-stories carousel — auto-advancing hero that cycles through the top
 * articles' summaries. Pauses on hover; arrows + dots for manual control.
 */
export default function SummaryCarousel({ posts }: { posts: Post[] }) {
  const { lang, t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = posts.filter((p) => p.imageUrl).slice(0, 6);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), 5000);
    return () => clearInterval(id);
  }, [n, paused]);

  if (!n) return null;

  const go = (i: number) => setIndex(((i % n) + n) % n);
  const href = (p: Post) => `/${p.category.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`;
  const title = (p: Post) => (lang === "hi" && p.titleHi ? p.titleHi : p.title);
  const summary = (p: Post) => (lang === "hi" && p.summaryHi ? p.summaryHi : p.summary);

  return (
    <section
      className="max-w-screen-xl mx-auto px-4 md:px-8 pt-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t("Featured stories", "प्रमुख खबरें")}
    >
      <div className="relative overflow-hidden rounded-lg border-2 border-black dark:border-white/20 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.12)]">
        {/* track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((p) => (
            <Link
              key={p.slug}
              href={href(p)}
              className="relative w-full flex-shrink-0 h-[360px] sm:h-[440px] block group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
              {/* readability scrim: left-weighted on desktop, bottom-weighted on mobile */}
              <div
                className="absolute inset-0 hidden sm:block"
                style={{ background: "linear-gradient(90deg, rgba(10,10,14,0.92) 0%, rgba(10,10,14,0.66) 42%, rgba(10,10,14,0.15) 72%, transparent 100%)" }}
              />
              <div
                className="absolute inset-0 sm:hidden"
                style={{ background: "linear-gradient(0deg, rgba(10,10,14,0.94) 5%, rgba(10,10,14,0.35) 55%, transparent 100%)" }}
              />
              <div className="relative h-full flex flex-col justify-end sm:justify-center max-w-xl p-6 sm:p-10">
                <span className="inline-flex self-start items-center bg-primary text-white text-[10px] font-inter font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  {p.category}
                </span>
                <h2
                  className="font-newsreader text-2xl sm:text-4xl font-black leading-tight text-white group-hover:text-primary transition-colors"
                  style={{ textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}
                >
                  {title(p)}
                </h2>
                {summary(p) && (
                  <p className="mt-3 font-newsreader italic text-sm sm:text-base text-white/80 line-clamp-2 sm:line-clamp-3 max-w-lg">
                    {summary(p)}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-inter font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">
                  {t("Read Story", "पूरी खबर")} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={t("Previous story", "पिछली खबर")}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t("Next story", "अगली खबर")}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-6 flex gap-1.5 z-10">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${t("Go to story", "खबर पर जाएँ")} ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === index ? 24 : 8, background: i === index ? "#FF9933" : "rgba(255,255,255,0.55)" }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
