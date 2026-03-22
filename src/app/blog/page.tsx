"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, ShieldAlert } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import SectionHeading from "@/components/SectionHeading";
import SearchBar from "@/components/SearchBar";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post, PostCategory } from "@/lib/types";

const CATEGORIES: { label: string; labelHi: string; value: PostCategory | "All" }[] = [
  { label: "All", labelHi: "सभी", value: "All" },
  { label: "Geopolitics", labelHi: "भू-राजनीति", value: "Geopolitics" },
  { label: "IR", labelHi: "अंतर्राष्ट्रीय", value: "IR" },
  { label: "Politics", labelHi: "राजनीति", value: "Politics" },
  { label: "Tech", labelHi: "टेक", value: "Tech" },
  { label: "GenZ", labelHi: "जेन-ज़ी", value: "GenZ" },
  { label: "Ancient India", labelHi: "प्राचीन भारत", value: "Ancient India" },
  { label: "Cartoon Mandala", labelHi: "कार्टून मंडला", value: "Cartoon Mandala" },
];

export default function BlogPage() {
  const { lang, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<PostCategory | "All">("All");

  // Use seed data with Date objects for rendering
  const allPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `seed-${i}`,
        createdAt: new Date(Date.now() - i * 3600000 * (i + 1)),
        updatedAt: new Date(),
      })),
    []
  );

  const filteredPosts = useMemo(
    () =>
      activeCategory === "All"
        ? allPosts
        : allPosts.filter((p) => p.category === activeCategory),
    [activeCategory, allPosts]
  );

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-8 md:px-16">
      {/* Masthead */}
      <div className="text-center mb-8 pb-8 border-b-4 border-double border-black dark:border-white/20">
        <p className="text-[10px] font-inter font-black tracking-[0.5em] uppercase opacity-40 mb-2 dark:text-white/40">
          {t("Vol. 1 — March 21, 2026 — Neo Bharat Editorial", "खंड 1 — 21 मार्च, 2026 — नव भारत संपादकीय")}
        </p>
        <h1 className="text-5xl md:text-7xl font-newsreader font-black uppercase tracking-tighter dark:text-white">
          {t("The Daily Discourse", "दैनिक विमर्श")}
        </h1>
        <p className="text-sm font-inter opacity-60 mt-2 dark:text-white/60">
          {t(
            "News, analysis, and satire from the Neo Bharat perspective",
            "नव भारत के दृष्टिकोण से समाचार, विश्लेषण और व्यंग्य"
          )}
        </p>
      </div>

      {/* Search + Category Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest transition-all border-2 ${
                activeCategory === cat.value
                  ? "bg-primary text-white border-primary"
                  : "border-black/10 dark:border-white/10 hover:border-primary dark:text-white"
              }`}
            >
              {lang === "hi" ? cat.labelHi : cat.label}
            </button>
          ))}
        </div>
        <SearchBar className="w-full md:w-72" />
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <motion.div
          key={featuredPost.slug}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <BlogCard post={featuredPost} featured />
        </motion.div>
      )}

      {/* Grid + Sidebar */}
      <div className="grid grid-cols-12 gap-12">
        {/* Main Grid */}
        <div className="col-span-12 lg:col-span-8">
          {/* Column-rule newspaper grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {gridPosts.map((post, idx) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 ${idx % 3 !== 2 ? "column-rule-vertical" : ""} ${
                  idx < gridPosts.length - 3 ? "border-b border-black/10 dark:border-white/10" : ""
                }`}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                {t("No articles found in this category.", "इस श्रेणी में कोई लेख नहीं मिला।")}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          {/* Trending */}
          <div className="border-4 border-black dark:border-white/20 p-6">
            <h3 className="text-lg font-newsreader font-black uppercase mb-6 pb-4 border-b-2 border-black dark:border-white/20 dark:text-white">
              {t("Trending Now", "अभी चल रहा है")}
            </h3>
            <div className="space-y-4">
              {allPosts
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 5)
                .map((post, idx) => (
                  <a
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="flex gap-4 group"
                  >
                    <span className="text-3xl font-newsreader font-black text-primary opacity-40">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-newsreader font-bold leading-tight group-hover:text-primary transition-colors dark:text-white">
                        {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                      </p>
                      <span className="text-[9px] font-inter font-black opacity-40 uppercase dark:text-white/40">
                        {post.readingTimeMin} min read
                      </span>
                    </div>
                  </a>
                ))}
            </div>
          </div>

          {/* Newsletter */}
          <NewsletterSignup />

          {/* Editorial Quote */}
          <div className="bg-black dark:bg-white p-8 text-white dark:text-black">
            <blockquote className="text-xl font-newsreader font-bold italic leading-tight mb-4">
              {t(
                '"A cartoon is a democratic weapon that cuts deeper than a thousand articles."',
                '"एक कार्टून एक लोकतांत्रिक हथियार है जो हजार लेखों से गहरा काटता है।"'
              )}
            </blockquote>
            <p className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              — LoktantraVani Editorial
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
