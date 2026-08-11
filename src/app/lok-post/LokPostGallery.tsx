"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import { useLanguage } from "@/lib/language-context";
import type { Post } from "@/lib/types";

export default function LokPostGallery({ posts }: { posts: Post[] }) {
  const { t, lang } = useLanguage();
  const title = (p: Post) => (lang === "hi" && p.titleHi ? p.titleHi : p.title);
  const summary = (p: Post) => (lang === "hi" && p.summaryHi ? p.summaryHi : p.summary);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[100px] md:pt-[140px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <Users className="w-7 h-7 text-primary" />
              <span className="text-[10px] font-inter font-black tracking-[0.5em] text-primary uppercase">
                {t("People & Leaders", "व्यक्तित्व एवं नेतृत्व")}
              </span>
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-5xl md:text-8xl font-newsreader font-black uppercase tracking-tighter mb-6 dark:text-white">
              {t("Lok Post", "लोक पोस्ट")}
            </h1>
            <p className="text-lg md:text-xl font-newsreader italic opacity-60 max-w-2xl mx-auto dark:text-white/60">
              {t(
                "Profiles of the people, personalities, and leaders shaping Bharat — from the courtroom and Parliament to the policy room and the movements behind them.",
                "भारत को आकार देने वाले लोगों, व्यक्तित्वों और नेताओं की प्रोफ़ाइल — अदालत और संसद से लेकर नीति-कक्ष और उनके पीछे के आंदोलनों तक।"
              )}
            </p>
          </motion.div>

          {/* Profiles grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post, idx) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.06, 0.5) }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block h-full border-2 border-black dark:border-white/20 overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                  >
                    {post.imageUrl && (
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <span className="text-[9px] font-inter font-black uppercase tracking-widest text-primary">
                        {t("Lok Post", "लोक पोस्ट")}
                      </span>
                      <h3 className="text-lg font-newsreader font-bold mt-2 leading-snug text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors line-clamp-3">
                        {title(post)}
                      </h3>
                      {summary(post) && (
                        <p className="mt-2 text-sm font-newsreader italic opacity-60 dark:text-white/50 line-clamp-3">
                          {summary(post)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                {t("Profiles coming soon...", "प्रोफ़ाइल जल्द आ रही हैं...")}
              </p>
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-20 max-w-md mx-auto">
            <NewsletterSignup />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
