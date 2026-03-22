"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, Trash2 } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function BookmarksPage() {
  const { t } = useLanguage();
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("loktantra-bookmarks");
    if (stored) setBookmarkedSlugs(JSON.parse(stored));
  }, []);

  const allPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `seed-bm-${i}`,
        createdAt: new Date(Date.now() - i * 3600000),
        updatedAt: new Date(),
      })),
    []
  );

  const bookmarkedPosts = allPosts.filter((p) => bookmarkedSlugs.includes(p.slug));

  const clearAll = () => {
    localStorage.removeItem("loktantra-bookmarks");
    setBookmarkedSlugs([]);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="flex items-center gap-4">
              <Bookmark className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-newsreader font-black uppercase tracking-tighter dark:text-white">
                {t("Saved Articles", "सहेजे गए लेख")}
              </h1>
            </div>
            {bookmarkedPosts.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:text-red-500 hover:opacity-100 transition-all dark:text-white/40"
              >
                <Trash2 className="w-4 h-4" /> {t("Clear All", "सब हटाएं")}
              </button>
            )}
          </div>

          {/* Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bookmarkedPosts.map((post, idx) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>

          {bookmarkedPosts.length === 0 && (
            <div className="text-center py-24">
              <Bookmark className="w-16 h-16 text-black/10 dark:text-white/10 mx-auto mb-6" />
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40 mb-2">
                {t("No saved articles yet.", "अभी तक कोई सहेजे गए लेख नहीं।")}
              </p>
              <p className="text-sm font-inter opacity-30 dark:text-white/30">
                {t(
                  "Bookmark articles while reading to find them here later.",
                  "बाद में यहां खोजने के लिए पढ़ते समय लेख बुकमार्क करें।"
                )}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
