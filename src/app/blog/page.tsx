"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import SearchBar from "@/components/SearchBar";
import { useLanguage } from "@/lib/language-context";
import type { Post, PostCategory } from "@/lib/types";

const CATEGORIES: { label: string; labelHi: string; value: PostCategory | "All" }[] = [
  { label: "All",              labelHi: "सभी",             value: "All" },
  { label: "Bharat Pulse",     labelHi: "भारत पल्स",       value: "India" },
  { label: "Globe Drop",       labelHi: "ग्लोब ड्रॉप",     value: "World" },
  { label: "Neta Watch",       labelHi: "नेता वॉच",        value: "Politics" },
  { label: "Power Moves",      labelHi: "पावर मूव्स",      value: "Geopolitics" },
  { label: "Paisa Talk",       labelHi: "पैसा टॉक",        value: "Economy" },
  { label: "Game On",          labelHi: "गेम ऑन",          value: "Sports" },
  { label: "Tech Bro",         labelHi: "टेक ब्रो",        value: "Tech" },
  { label: "Shield & Sword",   labelHi: "शील्ड & स्वॉर्ड", value: "Defence" },
  { label: "Hot Takes",        labelHi: "हॉट टेक्स",       value: "Opinion" },
  { label: "City Vibes",       labelHi: "सिटी वाइब्स",     value: "Cities" },
  { label: "West Asia ⚡",     labelHi: "पश्चिम एशिया ⚡", value: "West Asia" },
  { label: "Lok Post",         labelHi: "इंक ड्रॉप",       value: "Lok Post" },
];

// Today's date — matches AGENTS.md
const TODAY = "Sunday, March 22, 2026";
const TODAY_HI = "रविवार, 22 मार्च, 2026";

export default function BlogPage() {
  const { lang, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<PostCategory | "All">("All");
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list-posts?status=published&limit=100");
      const data = await res.json();
      if (data.posts?.length > 0) {
        setAllPosts(data.posts.map((p: Record<string, unknown>) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt as string) : new Date(),
          updatedAt: new Date(),
          viewCount: Number(p.viewCount) || 0,
          readingTimeMin: Number(p.readingTimeMin) || 3,
          reactions: (p.reactions as Record<string, number>) || { fire: 0, india: 0, bulb: 0, clap: 0 },
          tags: (p.tags as string[]) || [],
        })));
      }
    } catch { /* no posts */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filteredPosts = useMemo(
    () =>
      activeCategory === "All"
        ? allPosts
        : allPosts.filter((p) => p.category === activeCategory),
    [activeCategory, allPosts]
  );

  const featuredPost  = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1, 4);   // top 3 after featured
  const gridPosts      = filteredPosts.slice(4);       // rest

  const trendingPosts = [...allPosts]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0d0d]">

      {/* ── Compact Header + Search ───────────────────────────────── */}
      <div className="border-b border-[var(--nyt-border)] dark:border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <SearchBar className="w-full sm:w-64" />
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-inter font-semibold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/40 hidden sm:inline">{lang === "hi" ? TODAY_HI : TODAY}</span>
            <Link
              href="/daily"
              className="text-[9px] font-inter font-black uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hover:text-primary transition-colors whitespace-nowrap"
            >
              {t("Today's Paper →", "आज का अखबार →")}
            </Link>
          </div>
        </div>

        {/* ── Category filter nav ─────────────────────────── */}
        <div className="border-t border-[var(--nyt-border)] overflow-x-auto">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 flex items-center gap-0 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3.5 py-2.5 text-[9px] font-inter font-black uppercase tracking-widest whitespace-nowrap border-r border-[var(--nyt-border)] transition-colors
                  ${activeCategory === cat.value
                    ? "bg-[var(--nyt-black)] dark:bg-white text-white dark:text-black"
                    : "text-[var(--nyt-gray)] dark:text-white/60 hover:text-[var(--nyt-black)] dark:hover:text-white hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5"
                  }`}
              >
                {lang === "hi" ? cat.labelHi : cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">

        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-pulse space-y-4 max-w-lg mx-auto">
              <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2 mx-auto" />
              <div className="h-40 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-24 text-center border-b border-[var(--nyt-border)]">
            <p className="font-newsreader font-bold text-2xl italic text-[var(--nyt-gray)] dark:text-white/40">
              {t("No articles in this section yet.", "इस खंड में अभी कोई लेख नहीं है।")}
            </p>
          </div>
        ) : (
          <>
            {/* ── Above-the-fold: featured + 3 secondary ───── */}
            {featuredPost && (
              <div className="grid grid-cols-12 gap-0 py-6 border-b border-[var(--nyt-border)]">

                {/* Featured — 7 cols */}
                <div className="col-span-12 lg:col-span-7 lg:pr-6 lg:border-r border-[var(--nyt-border)]">
                  <Link href={`/blog/${featuredPost.slug}`} className="block group">
                    <article>
                      <div className="overflow-hidden mb-4">
                        <img
                          src={featuredPost.imageUrl}
                          alt={featuredPost.title}
                          loading="eager"
                          fetchPriority="high"
                          className="w-full aspect-[16/9] object-cover group-hover:opacity-95 transition-opacity"
                        />
                      </div>
                      {featuredPost.category === "West Asia" && (
                        <span className="breaking-band inline-block mb-3">⚡ {t("Breaking", "ब्रेकिंग")}</span>
                      )}
                      <p className="nyt-section-label mb-2">{featuredPost.category}</p>
                      <h2
                        className={`font-newsreader font-bold text-3xl md:text-5xl leading-[1.05] tracking-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors mb-3 ${lang === "hi" ? "hindi" : ""}`}
                      >
                        {lang === "hi" && featuredPost.titleHi ? featuredPost.titleHi : featuredPost.title}
                      </h2>
                      <p className="font-inter text-base leading-relaxed text-[var(--nyt-gray)] dark:text-white/60 line-clamp-3 mb-4">
                        {lang === "hi" && featuredPost.summaryHi ? featuredPost.summaryHi : featuredPost.summary}
                      </p>
                      <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-[var(--nyt-gray)] dark:text-white/40">
                        By {featuredPost.author} · {featuredPost.readingTimeMin} {t("min read", "मिनट")}
                      </p>
                    </article>
                  </Link>
                </div>

                {/* 3 secondary stories — 5 cols */}
                <div className="hidden lg:block col-span-5 pl-6 space-y-0">
                  <p className="text-[9px] font-inter font-black uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/40 pb-2 border-b border-[var(--nyt-border)] mb-0">
                    {t("Also in the News", "ख़बरों में और")}
                  </p>
                  {secondaryPosts.map((post, i) => (
                    <div
                      key={post.slug}
                      className={i < secondaryPosts.length - 1 ? "pb-4 mb-4 border-b border-[var(--nyt-border)]" : "pt-4"}
                    >
                      <BlogCard post={post} noImage />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Main grid + sidebar ────────────────────────── */}
            <div className="grid grid-cols-12 gap-0 py-6">

              {/* Article grid — 8 cols */}
              <div className="col-span-12 lg:col-span-8 lg:pr-6 lg:border-r border-[var(--nyt-border)]">

                {gridPosts.length > 0 ? (
                  <>
                    <div className="nyt-section-header mb-6">
                      <h3 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
                        {t("More Stories", "और खबरें")}
                      </h3>
                    </div>

                    {/* 3-column newspaper grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                      {gridPosts.map((post, idx) => (
                        <div
                          key={post.slug}
                          className={`p-0 pb-5 mb-5
                            ${idx % 3 !== 2 ? "md:pr-5 md:mr-0 md:border-r border-[var(--nyt-border)]" : ""}
                            ${idx < gridPosts.length - 3 ? "border-b border-[var(--nyt-border)]" : ""}
                            ${idx % 3 !== 0 ? "md:pl-5" : ""}
                          `}
                        >
                          <BlogCard post={post} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Mobile: show secondary posts inline */
                  <div className="lg:hidden space-y-5">
                    {secondaryPosts.map((post) => (
                      <div key={post.slug} className="pb-5 border-b border-[var(--nyt-border)]">
                        <BlogCard post={post} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar — 4 cols */}
              <aside className="col-span-12 lg:col-span-4 lg:pl-6 space-y-8 pt-6 lg:pt-0">

                {/* Trending */}
                <div>
                  <div className="nyt-section-header mb-4">
                    <h3 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
                      {t("Most Read", "सर्वाधिक पढ़े गए")}
                    </h3>
                  </div>
                  <div className="space-y-0">
                    {trendingPosts.map((post, idx) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className={`flex gap-4 group py-3 ${idx < trendingPosts.length - 1 ? "border-b border-[var(--nyt-border)]" : ""}`}
                      >
                        <span className="text-2xl font-newsreader font-black text-[var(--nyt-border)] dark:text-white/20 leading-none mt-0.5 shrink-0 w-6">
                          {idx + 1}
                        </span>
                        <div>
                          <p className={`text-sm font-newsreader font-bold leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors ${lang === "hi" ? "hindi" : ""}`}>
                            {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                          </p>
                          <span className="text-[9px] font-inter uppercase tracking-wide text-[var(--nyt-gray)] dark:text-white/40 mt-0.5 block">
                            {post.category} · {post.readingTimeMin} {t("min", "मिनट")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Newsletter */}
                <div>
                  <div className="nyt-section-header mb-4">
                    <h3 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
                      {t("Newsletter", "समाचार पत्र")}
                    </h3>
                  </div>
                  <NewsletterSignup />
                </div>

                {/* Editorial quote */}
                <div className="border border-[var(--nyt-border)] dark:border-white/10 p-5">
                  <p className="text-[9px] font-inter font-black uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/40 mb-3">
                    {t("Editor's Note", "संपादक का नोट")}
                  </p>
                  <blockquote className={`font-newsreader font-bold italic text-lg leading-snug text-[var(--nyt-black)] dark:text-white mb-3 ${lang === "hi" ? "hindi" : ""}`}>
                    {t(
                      '"A cartoon is a democratic weapon that cuts deeper than a thousand articles."',
                      '"एक कार्टून एक लोकतांत्रिक हथियार है जो हज़ार लेखों से गहरा काटता है।"'
                    )}
                  </blockquote>
                  <p className="text-[9px] font-inter font-semibold uppercase tracking-wider text-[var(--nyt-gray)] dark:text-white/40">
                    — LoktantraVani Editorial Board
                  </p>
                </div>

                {/* Browse sections */}
                <div>
                  <div className="nyt-section-header mb-4">
                    <h3 className="text-base font-inter font-black uppercase tracking-wider text-[var(--nyt-black)] dark:text-white">
                      {t("Browse Sections", "खंड देखें")}
                    </h3>
                  </div>
                  <div className="space-y-0">
                    {CATEGORIES.filter(c => c.value !== "All").map((cat, i) => (
                      <Link
                        key={cat.value}
                        href={`/category/${cat.value}`}
                        className={`flex items-center justify-between py-2 text-sm font-inter font-semibold text-[var(--nyt-black)] dark:text-white hover:text-primary transition-colors ${i < CATEGORIES.length - 2 ? "border-b border-[var(--nyt-border)]" : ""}`}
                      >
                        <span>{lang === "hi" ? cat.labelHi : cat.label}</span>
                        <span className="text-[var(--nyt-border)] dark:text-white/20">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
