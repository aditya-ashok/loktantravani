"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import { HouseAd } from "@/components/GoogleAd";
import { useLanguage } from "@/lib/language-context";
import ForYouFeed from "@/components/ForYouFeed";
import type { Post } from "@/lib/types";

function SectionHeader({ en, hi, href }: { en: string; hi: string; href?: string }) {
  const { t } = useLanguage();
  return (
    <div className="nyt-section-header mb-4 flex items-baseline justify-between">
      <h2 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
        {t(en, hi)}
      </h2>
      {href && (
        <Link href={href} className="text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
          {t("More", "और")} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function LandingContent({ allPosts }: { allPosts: Post[] }) {
  const { lang, t } = useLanguage();

  const breakingNews = useMemo(() => 
    allPosts.filter(p => p.isBreaking).map(p => p.title),
    [allPosts]
  );

  const geoPosts    = allPosts.filter(p => ["Geopolitics","IR","World"].includes(p.category));
  const politicsPosts = allPosts.filter(p => p.category === "Politics");
  const indiaPosts = allPosts.filter(p => p.category === "India");
  const economyPosts = allPosts.filter(p => p.category === "Economy");
  const sportsPosts = allPosts.filter(p => p.category === "Sports");
  const techPosts = allPosts.filter(p => p.category === "Tech");
  const defencePosts = allPosts.filter(p => ["Defence","Cities","Culture","Ancient India"].includes(p.category));
  const opinionPosts = allPosts.filter(p => p.category === "Opinion");
  const cartoonPosts = allPosts.filter(p => p.category === "Lok Post");
  const featuredPost = allPosts[0];
  const col1Posts   = allPosts.slice(1, 3);
  const col3Posts   = allPosts.slice(3, 6);

  if (!featuredPost) return null;

  return (
    <>
      {/* ── Breaking News Ticker ───────────── */}
      {breakingNews.length > 0 && (
        <div className="border-b border-[var(--nyt-border)] bg-red-50 dark:bg-red-950/30">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-1.5 flex items-center gap-4 overflow-hidden">
            <span className="bg-red-600 text-white text-[8px] font-inter font-black uppercase tracking-widest px-2 py-1 shrink-0 animate-pulse">
              {t("Breaking", "ब्रेकिंग")}
            </span>
            <div className="overflow-hidden relative flex-1">
              <div className="flex gap-12 text-xs font-inter text-red-800 dark:text-red-300 whitespace-nowrap animate-[marquee_40s_linear_infinite]">
                {breakingNews.map((headline, i) => (
                  <React.Fragment key={i}>
                    <span className="font-bold">{headline}</span>
                    {i < breakingNews.length - 1 && <span className="text-red-400">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-12 gap-0 pt-0 pb-6 border-b border-[var(--nyt-border)]">
          <div className="hidden lg:block col-span-3 pr-6 border-r border-[var(--nyt-border)] space-y-0">
            {col1Posts.map((post, i) => (
              <div key={post.slug} className={i < col1Posts.length - 1 ? "pb-5 mb-5 border-b border-[var(--nyt-border)]" : ""}>
                <BlogCard post={post} noImage />
              </div>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-6 lg:px-6">
            <BlogCard post={featuredPost} featured />
          </div>

          <div className="hidden lg:block col-span-3 pl-6 border-l border-[var(--nyt-border)]">
             <SectionHeader en="Latest Headlines" hi="ताज़ा खबरें" />
             <div className="space-y-4">
              {col3Posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group border-b border-[var(--nyt-border)] pb-4 last:border-0">
                   <h4 className="text-xs font-newsreader font-bold group-hover:text-primary transition-colors line-clamp-2 dark:text-white">
                     {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                   </h4>
                   <p className="text-[10px] font-inter text-gray-400 mt-1 uppercase tracking-tighter">
                     {post.author}
                   </p>
                </Link>
              ))}
             </div>
          </div>
        </div>

        {/* Mobile-only: show side stories below the featured post */}
        <div className="lg:hidden py-6 border-b border-[var(--nyt-border)]">
          <SectionHeader en="Latest Headlines" hi="ताज़ा खबरें" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...col1Posts, ...col3Posts].slice(0, 4).map((post) => (
              <BlogCard key={post.slug} post={post} horizontal />
            ))}
          </div>
        </div>

        <ForYouFeed />

        {/* Politics */}
        {politicsPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Politics" hi="राजनीति" href="/category/Politics" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {politicsPosts.slice(0, 4).map(post => <BlogCard key={post.slug} post={post} />)}
            </div>
          </div>
        )}

        {/* Ad Placement 1 — between Politics and Global */}
        <HouseAd placement="between-sections" />

        {/* Global Impact */}
        {geoPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Global Impact" hi="वैश्विक प्रभाव" href="/category/Geopolitics" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {geoPosts.slice(0, 6).map(post => <BlogCard key={post.slug} post={post} horizontal />)}
            </div>
          </div>
        )}

        {/* India */}
        {indiaPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="India" hi="भारत" href="/category/India" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {indiaPosts.slice(0, 8).map(post => <BlogCard key={post.slug} post={post} />)}
            </div>
          </div>
        )}

        {/* Economy */}
        {economyPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Economy" hi="अर्थव्यवस्था" href="/category/Economy" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {economyPosts.slice(0, 6).map(post => <BlogCard key={post.slug} post={post} horizontal />)}
            </div>
          </div>
        )}

        {/* Ad Placement 2 — between Economy and Sports */}
        <HouseAd placement="between-sections" />

        {/* Sports */}
        {sportsPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Sports" hi="खेल" href="/category/Sports" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sportsPosts.slice(0, 4).map(post => <BlogCard key={post.slug} post={post} />)}
            </div>
          </div>
        )}

        {/* Tech */}
        {techPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Technology" hi="तकनीक" href="/category/Tech" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {techPosts.slice(0, 3).map(post => <BlogCard key={post.slug} post={post} horizontal />)}
            </div>
          </div>
        )}

        {/* Defence */}
        {defencePosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Defence & Cities" hi="रक्षा एवं शहर" href="/category/Defence" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {defencePosts.slice(0, 4).map(post => <BlogCard key={post.slug} post={post} />)}
            </div>
          </div>
        )}

        {/* Opinion */}
        {opinionPosts.length > 0 && (
          <div className="py-12 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Opinion" hi="विचार" href="/category/Opinion" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {opinionPosts.slice(0, 3).map(post => <BlogCard key={post.slug} post={post} horizontal />)}
            </div>
          </div>
        )}

        {/* Lok Post — Cartoons & Satire */}
        {cartoonPosts.length > 0 && (
          <div className="py-12">
            <div className="nyt-section-header mb-6 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                <h2 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
                  {t("Lok Post — Cartoons & Satire", "लोक पोस्ट — कार्टून एवं व्यंग्य")}
                </h2>
              </div>
              <Link href="/lok-post" className="text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                {t("More", "और")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {cartoonPosts.slice(0, 8).map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <div className="border-2 border-black dark:border-white/20 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    {post.imageUrl && (
                      <div className="aspect-square overflow-hidden relative">
                        <Image src={post.imageUrl} alt={post.title} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-3 bg-white dark:bg-[#1a1a1a]">
                      <span className="text-[8px] font-inter font-black uppercase tracking-widest text-primary">Lok Post</span>
                      <h3 className="text-sm font-newsreader font-bold mt-1 leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
