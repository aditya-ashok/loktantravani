"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import { HouseAd } from "@/components/GoogleAd";
import { useLanguage } from "@/lib/language-context";
import { getAuthorHiName } from "@/lib/authors";
import { timeAgo } from "@/lib/utils";
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
  const latestPosts = allPosts.slice(1, 5);

  if (!featuredPost) return null;

  const featuredAuthor = lang === "hi" ? getAuthorHiName(featuredPost.author) : featuredPost.author;

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        {/* Compact hero — image beside text instead of a full-width banner */}
        <Link
          href={`/${featuredPost.category.toLowerCase().replace(/\s+/g, "-")}/${featuredPost.slug}`}
          className="group grid md:grid-cols-[0.45fr_0.55fr] rounded-2xl border border-[var(--nyt-border)] bg-white/95 dark:bg-[#111] overflow-hidden shadow-[0_20px_60px_-45px_rgba(0,0,0,0.35)] transition hover:shadow-[0_28px_80px_-55px_rgba(0,0,0,0.4)] mb-8"
        >
          {featuredPost.imageUrl && (
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[260px] overflow-hidden">
              <Image
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
                unoptimized
              />
            </div>
          )}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary mb-2">
              {featuredPost.category}
            </p>
            <h2 className="font-newsreader text-2xl md:text-3xl font-black leading-tight tracking-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors">
              {lang === "hi" && featuredPost.titleHi ? featuredPost.titleHi : featuredPost.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--nyt-gray)] dark:text-white/70 line-clamp-3">
              {lang === "hi" && featuredPost.summaryHi ? featuredPost.summaryHi : featuredPost.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--nyt-gray)] dark:text-white/50">
              <span>{featuredAuthor}</span>
              <span>·</span>
              <span>{timeAgo(featuredPost.createdAt as Date)}</span>
              <span>·</span>
              <span>{featuredPost.readingTimeMin} {t("min read", "मिनट पढ़ें")}</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Latest headlines strip */}
        {latestPosts.length > 0 && (
          <div className="pb-8 border-b border-[var(--nyt-border)]">
            <SectionHeader en="Latest Headlines" hi="ताज़ा खबरें" href="/blog" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {latestPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}

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
