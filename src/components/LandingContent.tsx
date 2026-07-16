"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import AdBanner from "@/components/AdBanner";
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
  const secondWell = allPosts.slice(1, 4);
  const latestRail = allPosts.slice(4, 13);

  if (!featuredPost) return null;

  const featuredAuthor = lang === "hi" ? getAuthorHiName(featuredPost.author) : featuredPost.author;
  const postHref = (p: Post) => `/${p.category.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`;
  const postTitle = (p: Post) => (lang === "hi" && p.titleHi ? p.titleHi : p.title);
  const postSummary = (p: Post) => (lang === "hi" && p.summaryHi ? p.summaryHi : p.summary);

  return (
    <>
      {/* ── HT-style news well: lead | secondary stack | latest rail ── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr_3fr] gap-6 lg:gap-0 pb-8 border-b-2 border-black dark:border-white/40">

          {/* Lead story — headline first, broadsheet style */}
          <Link href={postHref(featuredPost)} className="group lg:pr-7 lg:border-r border-[var(--nyt-border)]">
            <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary mb-2">
              {featuredPost.category}
            </p>
            <h1 className="font-newsreader text-3xl md:text-[2.6rem] font-black leading-[1.05] tracking-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors">
              {postTitle(featuredPost)}
            </h1>
            <p className="mt-3 font-newsreader italic text-base leading-6 text-[var(--nyt-gray)] dark:text-white/70 line-clamp-3">
              {postSummary(featuredPost)}
            </p>
            <div className="mt-3 py-1.5 border-t border-b border-[var(--nyt-border)] flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--nyt-gray)] dark:text-white/50">
              <span className="text-[var(--nyt-black)] dark:text-white font-black">{featuredAuthor}</span>
              <span>·</span>
              {/* Relative time drifts between ISR snapshot and client — an
                  unsuppressed text mismatch here crashes hydration (#418) */}
              <span suppressHydrationWarning>{timeAgo(featuredPost.createdAt as Date)}</span>
              <span>·</span>
              <span>{featuredPost.readingTimeMin} {t("min read", "मिनट पढ़ें")}</span>
            </div>
            {featuredPost.imageUrl && (
              <figure className="mt-4">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                    unoptimized
                  />
                </div>
                <figcaption className="pt-1.5 border-b border-[var(--nyt-border)] pb-1 text-[10px] leading-snug text-[var(--nyt-gray)] dark:text-white/50">
                  {postTitle(featuredPost)}
                </figcaption>
              </figure>
            )}
          </Link>

          {/* Secondary stack — hairline-divided, first with image */}
          <div className="lg:px-7 lg:border-r border-[var(--nyt-border)] divide-y divide-[var(--nyt-border)]">
            {secondWell.map((post, i) => (
              <Link key={post.slug} href={postHref(post)} className="group block py-4 first:pt-0 last:pb-0">
                {i === 0 && post.imageUrl && (
                  <div className="relative aspect-[16/9] overflow-hidden mb-3">
                    <Image src={post.imageUrl} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" unoptimized />
                  </div>
                )}
                <p className="text-[8px] uppercase tracking-[0.25em] font-black text-primary mb-1">{post.category}</p>
                <h2 className="font-newsreader text-lg md:text-xl font-black leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors">
                  {postTitle(post)}
                </h2>
                <p className="mt-1.5 text-[13px] leading-5 text-[var(--nyt-gray)] dark:text-white/60 line-clamp-2">
                  {postSummary(post)}
                </p>
                <p suppressHydrationWarning className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[var(--nyt-gray)] dark:text-white/45">
                  {lang === "hi" ? getAuthorHiName(post.author) : post.author} · {timeAgo(post.createdAt as Date)}
                </p>
              </Link>
            ))}
          </div>

          {/* Latest news rail — HT signature */}
          <div className="lg:pl-7">
            <div className="flex items-center gap-2 border-b-2 border-black dark:border-white/60 pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <h3 className="text-[11px] font-inter font-black uppercase tracking-[0.2em] text-[var(--nyt-black)] dark:text-white">
                {t("Latest News", "ताज़ा खबरें")}
              </h3>
              <Link href="/blog" className="ml-auto text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
                {t("All", "सभी")}
              </Link>
            </div>
            <ul className="divide-y divide-[var(--nyt-border)]">
              {latestRail.map((post) => (
                <li key={post.slug}>
                  <Link href={postHref(post)} className="group block py-2.5">
                    <p suppressHydrationWarning className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-red-600 mb-0.5">
                      {timeAgo(post.createdAt as Date)} · {post.category}
                    </p>
                    <h4 className="font-newsreader text-[15px] font-bold leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors">
                      {postTitle(post)}
                    </h4>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8">

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
        <AdBanner placement="homepage-banner" houseFallback />

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
        <AdBanner placement="homepage-banner" houseFallback />

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
