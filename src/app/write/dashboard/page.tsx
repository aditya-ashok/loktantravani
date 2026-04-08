"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PenSquare, Clock, CheckCircle, XCircle, Eye, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import type { Post } from "@/lib/types";

const STATUS_BADGE: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  "user-submitted": { label: "Pending Review", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400", icon: Clock },
  published: { label: "Published", color: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400", icon: CheckCircle },
  rejected: { label: "Needs Revision", color: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400", icon: XCircle },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/40", icon: Clock },
};

export default function WriteDashboardPage() {
  const { isLoggedIn, userId, userName, userRole } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function fetchMyPosts() {
      try {
        // Fetch all posts and filter by submittedBy
        const res = await fetch("/api/admin/list-posts?status=all");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const mine = (data.posts || []).filter(
          (p: Post & { submittedBy?: string }) =>
            p.submittedBy === userId || (p.authorRole === "contributor" && p.author === userName)
        );
        setPosts(mine);
      } catch { /* */ }
      setLoading(false);
    }
    fetchMyPosts();
  }, [userId, userName]);

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === "published").length,
    pending: posts.filter(p => p.status === "user-submitted").length,
    rejected: posts.filter(p => p.status === "rejected").length,
  };

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-newsreader font-black mb-4 dark:text-white">Sign In Required</h1>
            <Link href="/write" className="inline-block bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary dark:bg-white dark:text-black">
              Go to Write With Us →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[180px] md:pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <Link href="/write" className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-primary mb-6 dark:text-white/40">
            <ArrowLeft className="w-4 h-4" /> Write With Us
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-newsreader font-black dark:text-white">My Submissions</h1>
              <p className="text-xs font-inter opacity-40 mt-1 dark:text-white/40">{userName}</p>
            </div>
            <Link href="/write/new" className="flex items-center gap-2 bg-black text-white px-4 md:px-6 py-3 text-[10px] font-inter font-black uppercase tracking-widest hover:bg-primary transition-colors dark:bg-white dark:text-black">
              <PenSquare className="w-3.5 h-3.5" /> Write New
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total },
              { label: "Published", value: stats.published },
              { label: "Pending", value: stats.pending },
              { label: "Revisions", value: stats.rejected },
            ].map(s => (
              <div key={s.label} className="border-2 border-black dark:border-white/20 p-4">
                <p className="text-2xl font-newsreader font-black dark:text-white">{s.value}</p>
                <p className="text-[9px] font-inter font-bold uppercase tracking-widest opacity-40 dark:text-white/40">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse border-2 border-black/10 dark:border-white/10 p-4">
                  <div className="h-4 bg-gray-200 dark:bg-white/10 w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-white/10 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {!loading && posts.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-black/20 dark:border-white/10">
              <PenSquare className="w-10 h-10 mx-auto opacity-20 mb-4" />
              <p className="text-lg font-newsreader font-bold opacity-40 dark:text-white/40">No submissions yet</p>
              <Link href="/write/new" className="inline-block mt-4 text-xs font-inter font-bold uppercase tracking-widest text-primary hover:underline">
                Write your first article →
              </Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="space-y-3">
              {posts.map(post => {
                const badge = STATUS_BADGE[post.status] || STATUS_BADGE.draft;
                const BadgeIcon = badge.icon;
                return (
                  <div key={post.id} className="border-2 border-black dark:border-white/20 p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-inter font-bold uppercase tracking-widest text-primary">{post.category}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-inter font-bold uppercase tracking-widest px-2 py-0.5 ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" /> {badge.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-newsreader font-black truncate dark:text-white">{post.title}</h3>
                        {post.summary && <p className="text-xs font-inter opacity-60 mt-1 line-clamp-2 dark:text-white/60">{post.summary}</p>}
                        {(post as Post & { rejectionReason?: string }).rejectionReason && post.status === "rejected" && (
                          <div className="mt-2 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-400 px-3 py-2">
                            <p className="text-[9px] font-inter font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Editor Feedback</p>
                            <p className="text-xs font-inter text-red-700 dark:text-red-300">{(post as Post & { rejectionReason?: string }).rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} className="flex items-center gap-1 text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline shrink-0">
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
