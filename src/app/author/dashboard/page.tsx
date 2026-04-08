"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PenSquare, FileText, Eye, TrendingUp, Plus, Clock, ArrowRight, User2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthorProfilePanel from "@/components/admin/AuthorProfile";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function AuthorDashboard() {
  const { t } = useLanguage();
  const { userName, userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"articles" | "profile">("articles");
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchMyPosts = useCallback(async () => {
    try {
      const { isFirebaseConfigured } = await import("@/lib/firebase");
      if (!isFirebaseConfigured || !userName) {
        setPosts(SEED_POSTS.filter(p => p.authorRole === "author").map((p, i) => ({
          ...p, id: `auth-${i}`, createdAt: new Date(Date.now() - i * 86400000), updatedAt: new Date(),
        })));
        return;
      }
      const { getPosts } = await import("@/lib/firebase-service");
      const { posts: pub } = await getPosts({ author: userName, status: "published", pageSize: 50 });
      const { posts: draft } = await getPosts({ author: userName, status: "draft", pageSize: 50 });
      const all = [...pub, ...draft];
      setPosts(all.length > 0 ? all : SEED_POSTS.filter(p => p.authorRole === "author").map((p, i) => ({
        ...p, id: `auth-${i}`, createdAt: new Date(Date.now() - i * 86400000), updatedAt: new Date(),
      })));
    } catch {
      setPosts(SEED_POSTS.filter(p => p.authorRole === "author").map((p, i) => ({
        ...p, id: `auth-${i}`, createdAt: new Date(Date.now() - i * 86400000), updatedAt: new Date(),
      })));
    }
  }, [userName]);

  useEffect(() => { fetchMyPosts(); }, [fetchMyPosts]);

  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);
  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[120px] pb-24 bg-[#f3f4f6] dark:bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <PenSquare className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-newsreader font-black uppercase tracking-tighter">
                  {t("Author Dashboard", "लेखक डैशबोर्ड")}
                </h1>
              </div>
              {/* Tabs */}
              <div className="flex border-2 border-black">
                <button
                  onClick={() => setActiveTab("articles")}
                  className={`px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest ${activeTab === "articles" ? "bg-black text-white" : "hover:bg-black/5"}`}
                >
                  <FileText className="w-3 h-3 inline mr-1" /> Articles
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest ${activeTab === "profile" ? "bg-black text-white" : "hover:bg-black/5"}`}
                >
                  <User2 className="w-3 h-3 inline mr-1" /> My Profile
                </button>
              </div>
            </div>
          </motion.div>

          {activeTab === "profile" ? (
            <AuthorProfilePanel />
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: t("Published", "प्रकाशित"), value: publishedCount, icon: FileText },
                  { label: t("Drafts", "ड्राफ्ट"), value: draftCount, icon: Clock },
                  { label: t("Total Views", "कुल दृश्य"), value: totalViews.toLocaleString(), icon: Eye },
                  { label: t("Reactions", "प्रतिक्रियाएं"), value: posts.reduce((s, p) => s + Object.values(p.reactions).reduce((a, b) => a + b, 0), 0).toLocaleString(), icon: TrendingUp },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <stat.icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-newsreader font-black dark:text-white">{stat.value}</p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Write CTA */}
              <div className="bg-primary text-white p-6 mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-newsreader font-black uppercase">
                    {t("Write a New Article", "नया लेख लिखें")}
                  </h3>
                  <p className="text-xs font-inter opacity-80 mt-1">
                    {t("Articles submitted for admin review before publishing.", "प्रकाशन से पहले एडमिन समीक्षा के लिए सबमिट।")}
                  </p>
                </div>
                <Link href="/admin" className="px-6 py-3 bg-white text-black font-inter font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90">
                  <Plus className="w-4 h-4" /> {t("New Post", "नया लेख")}
                </Link>
              </div>

              {/* Articles List */}
              <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 overflow-hidden">
                {posts.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-black/10 mx-auto mb-4" />
                    <p className="text-lg font-newsreader font-bold italic opacity-40">No articles yet. Start writing!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 hover:bg-primary/5 transition-colors group">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-inter font-black uppercase">
                              {post.category}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-inter font-black uppercase ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {post.status}
                            </span>
                          </div>
                          <h4 className="text-base font-newsreader font-bold group-hover:text-primary transition-colors dark:text-white">
                            {post.title}
                          </h4>
                          <p className="text-[9px] font-inter opacity-40 mt-1 dark:text-white/40">
                            {post.readingTimeMin} min read &bull; {post.viewCount.toLocaleString()} views
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
