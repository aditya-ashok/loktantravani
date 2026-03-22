"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

const AUTHOR_BIOS: Record<string, { bio: string; bioHi: string }> = {
  "Aditya Vani": {
    bio: "Chief Editor and founder of LoktantraVani. Covers geopolitics, strategy, and the intersection of ancient Indian statecraft with modern diplomacy. Believer in Kautilyan realism tempered with Gandhian ideals.",
    bioHi: "लोकतंत्रवाणी के प्रधान संपादक और संस्थापक। भू-राजनीति, रणनीति, और प्राचीन भारतीय राजनय और आधुनिक कूटनीति के संगम को कवर करते हैं।",
  },
  "Meera Iyer": {
    bio: "Foreign Affairs Editor covering international relations, Indo-Pacific dynamics, and India's growing influence in multilateral institutions.",
    bioHi: "विदेश मामलों की संपादक जो अंतर्राष्ट्रीय संबंधों, हिंद-प्रशांत गतिशीलता को कवर करती हैं।",
  },
  "Arjun Kapil": {
    bio: "Tech and Ancient Wisdom correspondent. Exploring the intersection of Vedic science, quantum computing, and the future of Indian innovation.",
    bioHi: "तकनीक और प्राचीन ज्ञान संवाददाता। वैदिक विज्ञान, क्वांटम कंप्यूटिंग और भारतीय नवाचार के भविष्य के संगम की खोज।",
  },
  "Nandini Rao": {
    bio: "Politics Editor focusing on Indian democracy, governance reform, civic technology, and the evolving voter landscape.",
    bioHi: "राजनीति संपादक जो भारतीय लोकतंत्र, शासन सुधार, नागरिक प्रौद्योगिकी पर ध्यान केंद्रित करती हैं।",
  },
  "Priya Sharma": {
    bio: "GenZ Correspondent covering Web3, DAOs, community governance, and how young Indians are reimagining civic participation.",
    bioHi: "जेनज़ी संवाददाता जो Web3, DAOs, सामुदायिक शासन को कवर करती हैं।",
  },
};

export default function AuthorPage() {
  const params = useParams();
  const authorId = decodeURIComponent(params?.id as string);
  const { lang, t } = useLanguage();

  const authorPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.filter((p) => p.author === authorId).map((p, i) => ({
        ...p,
        id: `seed-auth-${i}`,
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(),
      })),
    [authorId]
  );

  const bio = AUTHOR_BIOS[authorId];
  const totalViews = authorPosts.reduce((sum, p) => sum + p.viewCount, 0);
  const totalReactions = authorPosts.reduce(
    (sum, p) => sum + Object.values(p.reactions).reduce((a, b) => a + b, 0),
    0
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:text-primary mb-8 dark:text-white/40">
            <ArrowLeft className="w-4 h-4" /> {t("All Articles", "सभी लेख")}
          </Link>

          {/* Author Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-primary text-white flex items-center justify-center font-newsreader font-black text-3xl shrink-0">
                {authorId[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-newsreader font-black dark:text-white">
                  {authorId}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <PenLine className="w-4 h-4 text-primary" />
                  <span className="text-xs font-inter font-black uppercase tracking-widest text-primary">
                    {t("Contributing Author", "योगदानकर्ता लेखक")}
                  </span>
                </div>
                {bio && (
                  <p className="text-base font-newsreader italic opacity-60 mt-4 max-w-2xl dark:text-white/60">
                    {lang === "hi" ? bio.bioHi : bio.bio}
                  </p>
                )}
                {/* Stats */}
                <div className="flex gap-8 mt-6">
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">{authorPosts.length}</p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      {t("Articles", "लेख")}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">{totalViews.toLocaleString()}</p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      {t("Total Views", "कुल दृश्य")}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">{totalReactions.toLocaleString()}</p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      {t("Reactions", "प्रतिक्रियाएं")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Author's Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {authorPosts.map((post, idx) => (
              <motion.div key={post.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <BlogCard post={post} />
              </motion.div>
            ))}
          </div>

          {authorPosts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                {t("No articles found for this author.", "इस लेखक के लिए कोई लेख नहीं मिला।")}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
