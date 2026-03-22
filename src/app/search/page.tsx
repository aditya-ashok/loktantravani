"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams?.get("q") || "";
  const { lang, t } = useLanguage();

  const allPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `seed-s-${i}`,
        createdAt: new Date(Date.now() - i * 3600000),
        updatedAt: new Date(),
      })),
    []
  );

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.summary.toLowerCase().includes(lower) ||
        (p.titleHi && p.titleHi.includes(q)) ||
        (p.summaryHi && p.summaryHi.includes(q)) ||
        p.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        p.category.toLowerCase().includes(lower) ||
        p.author.toLowerCase().includes(lower)
    );
  }, [q, allPosts]);

  return (
    <>
      {q && (
        <div className="mb-8">
          <p className="text-sm font-inter font-bold opacity-60 dark:text-white/60">
            {results.length} {t("results for", "परिणाम")} &ldquo;{q}&rdquo;
          </p>
        </div>
      )}

      <div className="space-y-8">
        {results.map((post, idx) => (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="border-b border-black/10 dark:border-white/10 pb-8"
          >
            <BlogCard post={post} featured />
          </motion.div>
        ))}
      </div>

      {q && results.length === 0 && (
        <div className="text-center py-24">
          <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
            {t("No articles found. Try a different search.", "कोई लेख नहीं मिला। कोई अन्य खोज आज़माएं।")}
          </p>
        </div>
      )}

      {!q && (
        <div className="text-center py-24">
          <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
            {t("Enter a search term to find articles.", "लेख खोजने के लिए एक शब्द दर्ज करें।")}
          </p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-8 md:px-16">
          <div className="text-center mb-12">
            <Search className="w-12 h-12 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-newsreader font-black uppercase tracking-tighter mb-4 dark:text-white">
              {t("Search", "खोजें")}
            </h1>
            <SearchBar size="lg" className="max-w-xl mx-auto" />
          </div>
          <Suspense fallback={<div className="text-center py-12 opacity-40">Loading...</div>}>
            <SearchResults />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
