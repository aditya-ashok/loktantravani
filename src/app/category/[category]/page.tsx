"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Globe, Zap, History, ShieldAlert, Sparkles, Cpu, Vote } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post, PostCategory } from "@/lib/types";

const CATEGORY_META: Record<string, { icon: typeof Globe; descEn: string; descHi: string; nameHi: string }> = {
  Geopolitics: { icon: Globe, descEn: "Strategic analysis of global power dynamics and India's role in the multipolar world.", descHi: "वैश्विक शक्ति गतिशीलता और बहुध्रुवीय दुनिया में भारत की भूमिका का रणनीतिक विश्लेषण।", nameHi: "भू-राजनीति" },
  IR: { icon: Globe, descEn: "International Relations, diplomacy, and India's foreign policy through a civilizational lens.", descHi: "अंतर्राष्ट्रीय संबंध, कूटनीति, और सभ्यतागत दृष्टि से भारत की विदेश नीति।", nameHi: "अंतर्राष्ट्रीय संबंध" },
  Politics: { icon: Vote, descEn: "Indian democracy, governance, and the evolving landscape of citizen participation.", descHi: "भारतीय लोकतंत्र, शासन, और नागरिक भागीदारी का विकसित परिदृश्य।", nameHi: "राजनीति" },
  Tech: { icon: Cpu, descEn: "Technology through the lens of ancient wisdom. Vedic logic meets quantum computing.", descHi: "प्राचीन ज्ञान के दृष्टिकोण से प्रौद्योगिकी। वैदिक तर्क और क्वांटम कंप्यूटिंग।", nameHi: "टेक" },
  GenZ: { icon: Zap, descEn: "The generation bridging ancient dharma with digital disruption. Mental models for the modern age.", descHi: "प्राचीन धर्म को डिजिटल व्यवधान से जोड़ने वाली पीढ़ी।", nameHi: "जेन-ज़ी" },
  "Ancient India": { icon: History, descEn: "Civilizational wisdom for contemporary challenges. From Dharmashastra to Digital Ethics.", descHi: "समकालीन चुनौतियों के लिए सभ्यतागत ज्ञान। धर्मशास्त्र से डिजिटल नैतिकता तक।", nameHi: "प्राचीन भारत" },
  "Cartoon Mandala": { icon: Sparkles, descEn: "Satirical commentary on Bharat's paradoxes. Where humor meets democratic dissent.", descHi: "भारत के विरोधाभासों पर व्यंग्यात्मक टिप्पणी। जहाँ हास्य लोकतांत्रिक असहमति से मिलता है।", nameHi: "कार्टून मंडला" },
};

export default function CategoryPage() {
  const params = useParams();
  const category = decodeURIComponent(params?.category as string);
  const { lang, t } = useLanguage();

  const meta = CATEGORY_META[category];
  const Icon = meta?.icon || Globe;

  const posts: Post[] = useMemo(
    () =>
      SEED_POSTS.filter((p) => p.category === category).map((p, i) => ({
        ...p,
        id: `seed-cat-${i}`,
        createdAt: new Date(Date.now() - i * 7200000),
        updatedAt: new Date(),
      })),
    [category]
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-primary mb-8 dark:text-white/40">
            <ArrowLeft className="w-4 h-4" /> {t("All Articles", "सभी लेख")}
          </Link>

          {/* Category Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <Icon className="w-10 h-10 text-primary" />
              <h1 className="text-5xl md:text-7xl font-newsreader font-black uppercase tracking-tighter dark:text-white">
                {lang === "hi" && meta ? meta.nameHi : category}
              </h1>
            </div>
            {meta && (
              <p className="text-lg font-newsreader italic opacity-60 max-w-2xl dark:text-white/60">
                {lang === "hi" ? meta.descHi : meta.descEn}
              </p>
            )}
            <p className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mt-4 dark:text-white/40">
              {posts.length} {t("articles", "लेख")}
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-12 lg:col-span-8">
              {posts.length > 0 && (
                <div className="mb-12">
                  <BlogCard post={posts[0]} featured />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.slice(1).map((post, idx) => (
                  <motion.div key={post.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </div>
              {posts.length === 0 && (
                <div className="text-center py-24">
                  <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                    {t("No articles found in this category yet.", "इस श्रेणी में अभी तक कोई लेख नहीं।")}
                  </p>
                </div>
              )}
            </div>
            <aside className="col-span-12 lg:col-span-4">
              <NewsletterSignup />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
