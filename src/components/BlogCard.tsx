"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import type { Post } from "@/lib/types";
import { Share2 } from "lucide-react";
import EpaperShareModal from "./EpaperShareModal";
import { getAuthorHiName } from "@/lib/authors";

interface BlogCardProps {
  post: Post;
  featured?: boolean;        // Large hero card (image left, text right)
  horizontal?: boolean;      // Small inline card (image left, text right, compact)
  imageFirst?: boolean;      // Image on top (default NYT style)
  noImage?: boolean;         // Text-only card
}

// Category → Hindi label
const CATEGORY_HI: Record<string, string> = {
  India: "भारत", World: "विश्व", IR: "अंतर्राष्ट्रीय", Politics: "राजनीति",
  Geopolitics: "भू-राजनीति", Economy: "अर्थव्यवस्था", Markets: "बाज़ार",
  Sports: "खेल", Tech: "टेक्नोलॉजी", Culture: "संस्कृति", GenZ: "जेन-ज़ी",
  Opinion: "विचार", "West Asia": "पश्चिम एशिया", Viral: "वायरल",
  "Ancient India": "प्राचीन भारत", "Lok Post": "कार्टून मंडला",
};

export default function BlogCard({
  post,
  featured = false,
  horizontal = false,
  noImage = false,
}: BlogCardProps) {
  const { lang } = useLanguage();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const title = lang === "hi" && post.titleHi ? post.titleHi : post.title;
  const summary = lang === "hi" && post.summaryHi ? post.summaryHi : post.summary;
  const categoryLabel = lang === "hi" ? (CATEGORY_HI[post.category] || post.category) : post.category;
  const authorName = lang === "hi" ? getAuthorHiName(post.author) : post.author;
  const isWestAsia = post.category === "West Asia";

  const renderShareModal = () => (
    <EpaperShareModal 
      isOpen={isShareModalOpen} 
      onClose={() => setIsShareModalOpen(false)} 
      post={{
        ...post,
        url: `https://loktantravani.in/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`
      }} 
    />
  );

  if (featured) {
    return (
      <>
        <Link href={`/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`} className="block group">
          <article className="grid grid-cols-1 md:grid-cols-5 gap-0 nyt-card rounded-lg overflow-hidden">
            <div className="md:col-span-3 overflow-hidden relative h-52 sm:h-64 md:h-[420px]">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width:768px) 100vw, 60vw"
                priority
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="md:col-span-2 md:pl-6 p-4 md:p-0 md:pt-0 flex flex-col justify-between">
              <div>
                {isWestAsia && <span className="breaking-band inline-block mb-3 pulse-glow">⚡ Breaking</span>}
                <p className="nyt-section-label mb-2">{categoryLabel}</p>
                <h2 className={cn(
                    "font-newsreader font-bold leading-[1.08] tracking-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors duration-300",
                    "text-2xl sm:text-3xl md:text-[2.5rem]",
                    lang === "hi" && "hindi"
                  )}>
                  {title}
                </h2>
                <p className="mt-3 text-[0.9rem] leading-[1.7] text-[var(--nyt-gray)] dark:text-white/60 line-clamp-3 font-inter">
                  {summary}
                </p>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[9px] sm:text-[10px] font-inter font-semibold uppercase tracking-wider text-[var(--nyt-gray)] dark:text-white/40">
                  By {authorName} · {timeAgo(post.createdAt as Date)} · {post.readingTimeMin} min read
                </p>
                <button
                  onClick={(e) => { e.preventDefault(); setIsShareModalOpen(true); }}
                  className="flex items-center gap-1.5 text-[10px] font-inter font-black uppercase text-primary hover:underline shrink-0"
                >
                  <Share2 className="w-3 h-3" /> E-Paper
                </button>
              </div>
            </div>
          </article>
        </Link>
        {renderShareModal()}
      </>
    );
  }

  if (horizontal) {
    return (
      <>
        <Link href={`/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`} className="block group">
          <article className="flex gap-3 nyt-card py-3">
            <div className="w-20 h-16 flex-shrink-0 overflow-hidden relative">
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={80}
                height={64}
                sizes="80px"
                className="object-cover group-hover:opacity-90 transition-opacity"
              />
            </div>
            <div className="flex-1">
              <p className="nyt-section-label mb-1">{categoryLabel}</p>
              <h4 className={cn(
                  "text-sm font-newsreader font-bold leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors",
                  lang === "hi" && "hindi"
                )}>
                {title}
              </h4>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] font-inter text-[var(--nyt-gray)] dark:text-white/40">
                  {timeAgo(post.createdAt as Date)}
                </p>
                <button 
                  onClick={(e) => { e.preventDefault(); setIsShareModalOpen(true); }}
                  className="text-primary hover:text-black dark:hover:text-white transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </article>
        </Link>
        {renderShareModal()}
      </>
    );
  }

  if (noImage) {
    return (
      <>
        <Link href={`/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`} className="block group nyt-card py-4">
          <article>
            <p className="nyt-section-label mb-1.5">{categoryLabel}</p>
            <h3 className={cn(
                "font-newsreader font-bold leading-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors text-lg",
                lang === "hi" && "hindi"
              )}>
              {title}
            </h3>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] font-inter text-[var(--nyt-gray)] dark:text-white/40 uppercase tracking-wide">
                By {authorName} · {post.readingTimeMin} min
              </p>
              <button 
                onClick={(e) => { e.preventDefault(); setIsShareModalOpen(true); }}
                className="flex items-center gap-1.5 text-[9px] font-inter font-black uppercase text-primary"
              >
                <Share2 className="w-3 h-3" /> E-Paper
              </button>
            </div>
          </article>
        </Link>
        {renderShareModal()}
      </>
    );
  }

  return (
    <>
      <Link href={`/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`} className="block group">
        <article className="nyt-card transition-all duration-300 hover:translate-y-[-2px]">
          <div className="overflow-hidden mb-3 rounded-sm relative aspect-[3/2]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {isWestAsia && <span className="breaking-band inline-block mb-2 pulse-glow">⚡ Breaking</span>}
          <p className="nyt-section-label mb-1.5">{categoryLabel}</p>
          <h3 className={cn(
              "font-newsreader font-bold leading-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors duration-300",
              "text-xl",
              lang === "hi" && "hindi"
            )}>
            {title}
          </h3>
          <p className="mt-2 text-[0.875rem] leading-[1.65] text-[var(--nyt-gray)] dark:text-white/60 line-clamp-2 font-inter">
            {summary}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-[var(--nyt-gray)] dark:text-white/40">
              By {authorName} · {timeAgo(post.createdAt as Date)}
            </p>
            <button
              onClick={(e) => { e.preventDefault(); setIsShareModalOpen(true); }}
              className="flex items-center gap-1.5 text-[10px] font-inter font-black uppercase text-primary hover:underline"
            >
              <Share2 className="w-3 h-3" /> E-Paper
            </button>
          </div>
        </article>
      </Link>
      {renderShareModal()}
    </>
  );
}
