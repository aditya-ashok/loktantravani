"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PenSquare, FileText, Eye, TrendingUp, Plus, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function AuthorDashboard() {
  const { t } = useLanguage();
  const { userName } = useAuth();
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");

  const authorPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.filter((p) => p.authorRole === "author").map((p, i) => ({
        ...p,
        id: `auth-dash-${i}`,
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(),
      })),
    []
  );

  const totalViews = authorPosts.reduce((sum, p) => sum + p.viewCount, 0);
  const totalReactions = authorPosts.reduce(
    (sum, p) => sum + Object.values(p.reactions).reduce((a, b) => a + b, 0),
    0
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-[#f3f4f6]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <PenSquare className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-newsreader font-black uppercase tracking-tighter">
                {t("Author Dashboard", "लेखक डैशबोर्ड")}
              </h1>
            </div>
            <p className="text-sm font-inter opacity-60">
              {t("Manage your articles, track performance, and submit new content.", "अपने लेख प्रबंधित करें, प्रदर्शन ट्रैक करें और नई सामग्री सबमिट करें।")}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: t("Articles", "लेख"), value: authorPosts.length, icon: FileText },
              { label: t("Total Views", "कुल दृश्य"), value: totalViews.toLocaleString(), icon: Eye },
              { label: t("Reactions", "प्रतिक्रियाएं"), value: totalReactions.toLocaleString(), icon: TrendingUp },
              { label: t("Avg Read Time", "औसत पठन समय"), value: "5 min", icon: Clock },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-2xl font-newsreader font-black">{stat.value}</p>
                <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Write CTA */}
          <div className="bg-primary text-white p-8 mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-newsreader font-black uppercase">
                {t("Write a New Article", "नया लेख लिखें")}
              </h3>
              <p className="text-xs font-inter opacity-80 mt-1">
                {t("Your articles will be submitted for editorial review.", "आपके लेख संपादकीय समीक्षा के लिए सबमिट किए जाएंगे।")}
              </p>
            </div>
            <Link href="/admin" className="px-6 py-3 bg-white text-black font-inter font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90">
              <Plus className="w-4 h-4" /> {t("New Post", "नया लेख")}
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("published")}
              className={`px-4 py-2 text-xs font-inter font-black uppercase tracking-widest border-2 ${
                activeTab === "published" ? "bg-black text-white border-black" : "border-black/10 hover:border-primary"
              }`}
            >
              {t("Published", "प्रकाशित")} ({authorPosts.filter((p) => p.status === "published").length})
            </button>
            <button
              onClick={() => setActiveTab("drafts")}
              className={`px-4 py-2 text-xs font-inter font-black uppercase tracking-widest border-2 ${
                activeTab === "drafts" ? "bg-yellow-400 text-black border-yellow-400" : "border-black/10 hover:border-primary"
              }`}
            >
              {t("Drafts", "ड्राफ्ट")} (0)
            </button>
          </div>

          {/* Articles List */}
          <div className="bg-white border-2 border-black overflow-hidden">
            {authorPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <div className="flex items-center justify-between p-4 border-b border-black/5 hover:bg-primary/5 transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-inter font-black uppercase">
                        {post.category}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-inter font-black uppercase">
                        {post.status}
                      </span>
                    </div>
                    <h4 className="text-base font-newsreader font-bold group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-[9px] font-inter opacity-40 mt-1">
                      {post.readingTimeMin} min read &bull; {post.viewCount.toLocaleString()} views
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
