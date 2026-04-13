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
  const col1Posts   = allPosts.slice(1, 3);
  const col3Posts   = allPosts.slice(3, 6);

  if (!featuredPost) return null;

  const featuredAuthor = lang === "hi" ? getAuthorHiName(featuredPost.author) : featuredPost.author;
  const featuredCategory = lang === "hi" ? featuredPost.category : featuredPost.category;

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr] mb-6">
          <Link
            href={`/${featuredPost.category.toLowerCase().replace(/\s+/g, "-")}/${featuredPost.slug}`}
            className="group rounded-[2rem] border border-[var(--nyt-border)] bg-white/95 dark:bg-[#111] overflow-hidden shadow-[0_32px_90px_-55px_rgba(0,0,0,0.35)] transition hover:shadow-[0_40px_120px_-70px_rgba(0,0,0,0.35)] flex flex-col"
          >
            {/* Hero image */}
            {featuredPost.imageUrl && (
              <div className="relative w-full aspect-[2/1] overflow-hidden">
                <Image
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  unoptimized
                />
              </div>
            )}
            <div className="p-8">
              <p className="text-[10px] uppercase tracking-[0.35em] font-black text-primary mb-4">
                {t("Featured article", "फ़ीचर्ड लेख")}
              </p>
              <p className="text-[9px] uppercase tracking-[0.28em] font-semibold text-[var(--nyt-gray)] dark:text-white/50 mb-3">
                {featuredCategory}
              </p>
              <h2 className="font-newsreader text-3xl md:text-4xl font-black tracking-tight text-[var(--nyt-black)] dark:text-white">
                {lang === "hi" && featuredPost.titleHi ? featuredPost.titleHi : featuredPost.title}
              </h2>
              <p className="mt-5 max-w-3xl text-[0.98rem] leading-8 text-[var(--nyt-gray)] dark:text-white/70">
                {lang === "hi" && featuredPost.summaryHi ? featuredPost.summaryHi : featuredPost.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--nyt-gray)] dark:text-white/50">
                <span>{featuredAuthor}</span>
                <span>·</span>
                <span>{timeAgo(featuredPost.createdAt as Date)}</span>
                <span>·</span>
                <span>{featuredPost.readingTimeMin} {t("min read", "मिनट पढ़ें")}</span>
              </div>
              <div className="mt-8 inline-flex rounded-full border border-black/10 bg-black text-white px-6 py-3 font-bold uppercase tracking-[0.18em] transition group-hover:bg-primary">
                {t("Read story", "कहानी पढ़ें")}
              </div>
            </div>
          </Link>

          <div className="rounded-[2rem] border border-[var(--nyt-border)] bg-[var(--secondary)] dark:bg-[#111] p-6">
            <p className="text-[9px] uppercase tracking-[0.35em] font-black text-primary mb-4">
              {t("Why it matters", "क्यों महत्वपूर्ण है")}
            </p>
            <p className="text-sm leading-7 text-[var(--nyt-gray)] dark:text-white/70">
              {t(
                "Every day we surface the top headlines, analysis, and opinion that matter most for India and the world.",
                "हम हर दिन भारत और दुनिया के लिए सबसे महत्वपूर्ण शीर्ष कहानियाँ, विश्लेषण और राय प्रस्तुत करते हैं।"
              )}
            </p>
            <div className="mt-6 space-y-4 text-[10px] font-medium text-[var(--nyt-black)] dark:text-white/70">
              <div className="rounded-xl border border-[var(--nyt-border)] bg-white/90 dark:bg-[#090909] p-4">
                <p className="font-black uppercase tracking-[0.25em]">{t("Top category", "शीर्ष श्रेणी")}</p>
                <p className="mt-2">{featuredCategory}</p>
              </div>
              <div className="rounded-xl border border-[var(--nyt-border)] bg-white/90 dark:bg-[#090909] p-4">
                <p className="font-black uppercase tracking-[0.25em]">{t("Editorial note", "संपादकीय नोट")}</p>
                <p className="mt-2">{t("Trusted reporting, concise briefing, and a bold opinion voice.", "विश्वसनीय रिपोर्टिंग, संक्षिप्त ब्रीफिंग, और एक साहसी विचारधारा।")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
