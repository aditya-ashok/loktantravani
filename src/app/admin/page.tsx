"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "next-themes";
import PostEditor from "@/components/admin/PostEditor";
import AuthorProfilePanel from "@/components/admin/AuthorProfile";
import {
  Layout,
  FileText,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Newspaper,
  MessageSquare,
  Bot,
  TrendingUp,
  Eye,
  Users,
  BarChart3,
  ImageIcon,
  Columns3,
  Video,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  UserPlus,
  Rss,
  Trash2,
  LogIn,
  Download,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Menu,
  Mail,
  Upload,
  Bell,
  Send,
} from "lucide-react";
import { motion } from "framer-motion";
import { SEED_POSTS } from "@/lib/seed-data";
import { AUTHORS } from "@/lib/authors";
import type { Post, PostCategory } from "@/lib/types";

const sidebarItems = [
  { id: "poster-studio", label: "Poster Studio", icon: Sparkles },
  { id: "podcast-studio", label: "Podcast Studio", icon: Video },
  { id: "bjp-toolkit", label: "BJP Toolkit", icon: ShieldCheck },
  { id: "news-agent", label: "News Agent", icon: Bot },
  { id: "dashboard", label: "Dashboard", icon: Layout },
  { id: "approval", label: "Approval Queue", icon: ShieldCheck },
  { id: "posts", label: "All Posts", icon: FileText },
  { id: "new-post", label: "New Post", icon: Plus },
  { id: "authors", label: "Authors", icon: Users },
  { id: "lokpost", label: "Lok Post", icon: Columns3 },
  { id: "epaper", label: "E-Paper", icon: Newspaper },
  { id: "ads", label: "Advertisements", icon: ImageIcon },
  { id: "bulk-generate", label: "Bulk Generate", icon: Rss },
  { id: "user-submissions", label: "User Submissions", icon: UserPlus },
  { id: "daily", label: "Daily Edition", icon: Newspaper },
  { id: "subscribers", label: "Subscribers", icon: Mail },
  { id: "polls", label: "Polls", icon: BarChart3 },
  { id: "push-notifs", label: "Push Notifications", icon: Bell },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "my-profile", label: "My Profile", icon: Users },
  { id: "card-studio", label: "Card Studio", icon: ImageIcon },
  { id: "video-studio", label: "Video Studio", icon: Video },
  { id: "settings", label: "BJP+ Social", icon: Settings },
];

function DashboardStats() {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    // Add cache-busting param so browser doesn't serve stale admin data
    const t = Date.now();
    fetch(`/api/admin/list-posts?status=all&_t=${t}`)
      .then(r => r.json())
      .then(d => { if (d.posts) setPosts(d.posts); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch(`/api/admin/subscribers?_t=${t}`)
      .then(r => r.json())
      .then(d => { if (d.count != null) setSubscriberCount(d.count); })
      .catch(() => {});
  }, []);

  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === "published").length;
  const draftCount = posts.filter(p => p.status === "draft").length;
  const totalViews = posts.reduce((sum, p) => sum + ((p.viewCount as number) || 0), 0);
  const totalReactions = posts.reduce((sum, p) => {
    const r = (p.reactions as Record<string, number>) || {};
    return sum + Object.values(r).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  }, 0);

  const stats = [
    { label: "Total Posts", value: totalPosts, sub: `${publishedCount} published · ${draftCount} drafts`, icon: FileText, color: "bg-primary" },
    { label: "Total Views", value: totalViews.toLocaleString(), sub: "across all articles", icon: Eye, color: "bg-black" },
    { label: "Reactions", value: totalReactions.toLocaleString(), sub: "🔥 🇮🇳 💡 👏", icon: TrendingUp, color: "bg-green-600" },
    { label: "Subscribers", value: subscriberCount.toString(), sub: "newsletter signups", icon: Mail, color: "bg-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase mb-2">Dashboard</h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
          LoktantraVani Editorial Analytics — Live from Firestore
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className={cn("w-10 h-10 flex items-center justify-center text-white mb-4", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-newsreader font-black">{loading ? "—" : stat.value}</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mt-1">
              {stat.label}
            </p>
            <p className="text-[8px] font-inter opacity-30 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Posts by Views — with links */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Top Posts by Views
        </h3>
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs font-inter opacity-40">Loading...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {[...posts]
              .sort((a, b) => ((b.viewCount as number) || 0) - ((a.viewCount as number) || 0))
              .slice(0, 10)
              .map((post, i) => {
                const cat = ((post.category as string) || "india").toLowerCase().replace(/\s+/g, "-");
                const slug = post.slug as string;
                const url = `/${cat}/${slug}`;
                const views = (post.viewCount as number) || 0;
                const maxViews = (posts[0]?.viewCount as number) || 1;
                const pct = Math.max(5, Math.round((views / (maxViews || 1)) * 100));
                return (
                  <div key={post.id as string} className="group">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-newsreader font-black text-primary w-7 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={url} target="_blank" className="text-sm font-newsreader font-bold hover:text-primary transition-colors line-clamp-1 block">
                          {post.title as string}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-inter font-black text-primary whitespace-nowrap">{views.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-inter opacity-40 uppercase mt-0.5">
                          <span>{post.category as string}</span>
                          <span>&bull;</span>
                          <span>{post.author as string}</span>
                          <a href={`https://loktantravani.in${url}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Open ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Visitor Analytics — Google Analytics Embed */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Visitor Analytics
        </h3>
        <p className="text-xs font-inter opacity-50 mb-3">
          View full analytics on{" "}
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
            Google Analytics Dashboard ↗
          </a>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-black/10 p-4 text-center">
            <p className="text-2xl font-newsreader font-black text-primary">GA4</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mt-1">Connected</p>
          </div>
          <div className="border border-black/10 p-4 text-center">
            <p className="text-2xl font-newsreader font-black">Real-time</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mt-1">
              <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Live ↗</a>
            </p>
          </div>
          <div className="border border-black/10 p-4 text-center">
            <p className="text-2xl font-newsreader font-black">Geo</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mt-1">
              <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Map ↗</a>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="px-4 py-2 bg-black text-white text-xs font-inter font-black uppercase tracking-widest hover:bg-primary flex items-center gap-2 border-2 border-black">
            <Plus className="w-4 h-4" /> New Post
          </Link>
          <Link href="/daily" className="px-4 py-2 bg-black text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2">
            <Newspaper className="w-4 h-4" /> View Daily
          </Link>
          <Link href="/admin" className="px-4 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
            <Bot className="w-4 h-4" /> Run News Agent
          </Link>
        </div>
      </div>

      {/* Recent Posts — from Firestore */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Recent Posts</h3>
        {loading ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs font-inter opacity-40">Loading from Firestore...</span>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm font-inter opacity-40 py-6 text-center">No posts yet. Create one from AI Content Studio.</p>
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 8).map((post) => {
              const cat = ((post.category as string) || "india").toLowerCase().replace(/\s+/g, "-");
              const slug = post.slug as string;
              return (
              <div key={post.id as string} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                <div className="flex-1">
                  <Link href={`/${cat}/${slug}`} target="_blank" className="text-sm font-newsreader font-bold hover:text-primary transition-colors">
                    {post.title as string}
                  </Link>
                  <div className="flex items-center gap-3 text-[9px] font-inter font-bold opacity-40 uppercase mt-1">
                    <span>{post.category as string}</span>
                    <span>&bull;</span>
                    <span>{post.author as string}</span>
                    <span>&bull;</span>
                    <span className={(post.status as string) === "published" ? "text-green-600" : "text-yellow-600"}>
                      {post.status as string}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-inter font-bold">{((post.viewCount as number) || 0).toLocaleString()}</p>
                  <p className="text-[9px] font-inter opacity-40">views</p>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Breakdown — from Firestore */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Category Breakdown
        </h3>
        <div className="space-y-3">
          {["India", "World", "Politics", "Geopolitics", "Economy", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Lok Post"].map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
            return (
              <div key={cat} className="flex items-center gap-4">
                <span className="text-xs font-inter font-bold w-32 truncate">{cat}</span>
                <div className="flex-1 h-6 bg-black/5 relative">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-inter font-bold w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// USER SUBMISSIONS PANEL — Review external contributor articles
// ═══════════════════════════════════════════════════════════════
function UserSubmissionsPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, Record<string, unknown>>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list-posts?status=all");
      if (!res.ok) return;
      const data = await res.json();
      const subs = (data.posts || []).filter((p: Post) => p.status === "user-submitted" || p.status === "rejected");
      setPosts(subs);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleAIValidate = async (post: Post) => {
    setValidating(post.id);
    try {
      const res = await fetch("/api/write/ai-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: post.title, content: post.content, category: post.category }),
      });
      const data = await res.json();
      if (data.success) setValidationResults(prev => ({ ...prev, [post.id]: data }));
    } catch { /* */ }
    setValidating(null);
  };

  const handleApprove = async (post: Post) => {
    setActionLoading(post.id);
    try {
      await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id }),
      });
      // Notify contributor
      const p = post as Post & { submittedByEmail?: string; submittedByName?: string };
      if (p.submittedByEmail) {
        fetch("/api/write/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "approved", email: p.submittedByEmail, name: p.submittedByName, title: post.title, slug: post.slug }),
        }).catch(() => {});
      }
      fetchSubmissions();
    } catch { /* */ }
    setActionLoading(null);
  };

  const handleReject = async (post: Post) => {
    const reason = rejectReason[post.id] || "Please revise and resubmit.";
    setActionLoading(post.id);
    try {
      // Update status to rejected with reason
      await fetch(`https://firestore.googleapis.com/v1/projects/loktantravani-2d159/databases/(default)/documents/posts/${post.id}?updateMask.fieldPaths=status&updateMask.fieldPaths=rejectionReason&updateMask.fieldPaths=updatedAt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            status: { stringValue: "rejected" },
            rejectionReason: { stringValue: reason },
            updatedAt: { stringValue: new Date().toISOString() },
          },
        }),
      });
      // Notify contributor
      const p = post as Post & { submittedByEmail?: string; submittedByName?: string };
      if (p.submittedByEmail) {
        fetch("/api/write/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "rejected", email: p.submittedByEmail, name: p.submittedByName, title: post.title, reason }),
        }).catch(() => {});
      }
      setShowRejectInput(null);
      fetchSubmissions();
    } catch { /* */ }
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-newsreader font-black dark:text-white">User Submissions</h2>
            <p className="text-[9px] font-inter uppercase tracking-widest opacity-40 dark:text-white/40">External contributor articles for review</p>
          </div>
        </div>
        <button onClick={fetchSubmissions} className="flex items-center gap-1 text-[9px] font-inter font-bold uppercase tracking-widest opacity-60 hover:opacity-100 dark:text-white">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading && <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-40" /></div>}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-black/20 dark:border-white/10">
          <UserPlus className="w-10 h-10 mx-auto opacity-20 mb-4" />
          <p className="text-lg font-newsreader font-bold opacity-40 dark:text-white/40">No user submissions</p>
          <p className="text-xs font-inter opacity-30 mt-1 dark:text-white/30">Articles submitted via &quot;Write With Us&quot; will appear here.</p>
        </div>
      )}

      {!loading && posts.map(post => {
        const p = post as Post & { submittedByName?: string; submittedByEmail?: string };
        const validation = validationResults[post.id];
        return (
          <div key={post.id} className="border-2 border-black dark:border-white/20 mb-4 p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-inter font-bold uppercase tracking-widest text-primary">{post.category}</span>
                  <span className={`text-[9px] font-inter font-bold uppercase tracking-widest px-2 py-0.5 ${post.status === "user-submitted" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400" : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"}`}>
                    {post.status === "user-submitted" ? "Pending" : "Rejected"}
                  </span>
                </div>
                <h3 className="text-xl font-newsreader font-black dark:text-white">{post.title}</h3>
                <p className="text-xs font-inter opacity-50 mt-1 dark:text-white/50">
                  By {p.submittedByName || post.author} • {p.submittedByEmail || ""}
                </p>
              </div>
            </div>

            {/* Preview */}
            <details className="mb-3">
              <summary className="text-[9px] font-inter font-bold uppercase tracking-widest cursor-pointer opacity-60 hover:opacity-100 dark:text-white/60">View Full Article</summary>
              <div className="mt-2 p-4 bg-[var(--nyt-light-gray)] dark:bg-white/5 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.content }} />
            </details>

            {/* AI Validation */}
            {validation && (
              <div className="bg-primary/5 border border-primary/20 p-3 mb-3 text-xs font-inter">
                <p className="font-bold text-primary mb-2">AI Validation Report</p>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {["factualityScore", "grammarScore", "toneScore", "originalityScore", "relevanceScore"].map(k => (
                    <div key={k} className="text-center">
                      <p className={`text-lg font-bold ${(validation[k] as number) >= 7 ? "text-green-600" : (validation[k] as number) >= 4 ? "text-orange-500" : "text-red-500"}`}>{String(validation[k])}</p>
                      <p className="text-[8px] uppercase tracking-widest opacity-40">{k.replace("Score", "")}</p>
                    </div>
                  ))}
                </div>
                <p className="opacity-70">{String(validation.summary || "")}</p>
                <p className={`font-bold mt-1 ${validation.recommendation === "approve" ? "text-green-600" : validation.recommendation === "review" ? "text-orange-500" : "text-red-500"}`}>
                  Recommendation: {String(validation.recommendation || validation.overallVerdict || "")}
                </p>
              </div>
            )}

            {/* Reject reason input */}
            {showRejectInput === post.id && (
              <div className="mb-3">
                <textarea
                  value={rejectReason[post.id] || ""}
                  onChange={e => setRejectReason(prev => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="Reason for rejection (sent to contributor via email)..."
                  rows={2}
                  className="w-full border-2 border-red-300 px-3 py-2 text-sm font-inter bg-transparent dark:text-white resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleReject(post)} disabled={actionLoading === post.id} className="bg-red-600 text-white px-4 py-2 text-[10px] font-inter font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-40">
                    {actionLoading === post.id ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button onClick={() => setShowRejectInput(null)} className="px-4 py-2 text-[10px] font-inter font-bold uppercase tracking-widest opacity-60 hover:opacity-100 dark:text-white">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-black/10 dark:border-white/10 pt-3">
              <button onClick={() => handleAIValidate(post)} disabled={validating === post.id} className="flex items-center gap-1 border-2 border-primary/30 text-primary px-3 py-1.5 text-[10px] font-inter font-bold uppercase tracking-widest hover:bg-primary/10 disabled:opacity-40">
                {validating === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Validate
              </button>
              <button onClick={() => handleApprove(post)} disabled={actionLoading === post.id} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 text-[10px] font-inter font-bold uppercase tracking-widest hover:bg-green-700 disabled:opacity-40">
                {actionLoading === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve & Publish
              </button>
              <button onClick={() => setShowRejectInput(post.id)} className="flex items-center gap-1 border-2 border-red-300 text-red-600 px-3 py-1.5 text-[10px] font-inter font-bold uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10">
                <XCircle className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: "", summary: "", content: "", category: "", author: "", imageUrl: "", articleDate: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [regenImage, setRegenImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiRevisiting, setAiRevisiting] = useState(false);
  const [aiRevisitEngine, setAiRevisitEngine] = useState<"auto" | "claude" | "gemini">("auto");
  const [caricaturePrompt, setCaricaturePrompt] = useState("");
  const [generatingCaricature, setGeneratingCaricature] = useState(false);

  // No more seed fallback — always use real Firestore data

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Use REST API to fetch posts — avoids heavy Firebase SDK
      const res = await fetch("/api/admin/list-posts?status=" + statusFilter);
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        setPosts(data.posts);
      } else {
        // Fallback: try Firebase SDK
        try {
          const { isFirebaseConfigured } = await import("@/lib/firebase");
          if (isFirebaseConfigured) {
            const { getPosts } = await import("@/lib/firebase-service");
            const { posts: fbPosts } = await getPosts({ pageSize: 200, status: statusFilter });
            setPosts(fbPosts.length > 0 ? fbPosts : []);
          } else {
            setPosts([]);
          }
        } catch {
          setPosts([]);
        }
      }
    } catch {
      setPosts([]);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} article(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const ids = [...selected];
      if (ids.length > 0) {
        const res = await fetch("/api/admin/delete-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setPosts(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    } catch (err) {
      alert("Delete failed: " + String(err));
    }
    setDeleting(false);
  };

  const editorRef = useRef<HTMLDivElement>(null);
  const openEditor = (post: Post) => {
    setEditingPost(post);
    const postDate = (post as any).createdAt;
    const dateStr = postDate instanceof Date ? postDate.toISOString().split("T")[0]
      : typeof postDate === "string" ? postDate.split("T")[0]
      : new Date().toISOString().split("T")[0];
    setEditForm({
      title: post.title || "",
      summary: post.summary || "",
      content: post.content || "",
      category: post.category || "",
      author: post.author || "",
      imageUrl: (post as Post & { imageUrl?: string }).imageUrl || "",
      articleDate: dateStr,
    });
    // Scroll to editor after it renders
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const saveEdit = async () => {
    if (!editingPost) return;
    setEditSaving(true);
    try {
      // Strip internal-only fields like _htmlMode before sending
      const { _htmlMode, articleDate, ...cleanForm } = editForm as Record<string, unknown>;
      void _htmlMode;
      // Convert articleDate to createdAt timestamp
      const updateData: Record<string, unknown> = { ...cleanForm };
      if (articleDate && typeof articleDate === "string") {
        updateData.createdAt = new Date(articleDate as string).toISOString();
      }
      const res = await fetch("/api/admin/update-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPost.id, ...updateData }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...cleanForm } as Post : p));
      // Revalidate the article page and homepage so changes appear immediately
      try {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: ["/", "/blog", `/blog/${editingPost.slug}`] }),
        });
      } catch { /* revalidation is best-effort */ }
      setEditingPost(null);
    } catch (err) {
      alert("Save failed: " + String(err));
    }
    setEditSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Inline Post Editor */}
      {editingPost && (
        <div ref={editorRef} className="bg-white border-2 border-black p-4 sm:p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest">✏️ Edit Article</h3>
            <button onClick={() => setEditingPost(null)} className="text-xs font-inter underline">Close</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Title</label>
              <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Author</label>
              <input value={editForm.author} onChange={e => setEditForm(p => ({ ...p, author: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Category</label>
              <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none">
                {["India","World","Politics","Geopolitics","Economy","Sports","Tech","Defence","Opinion","Cities","West Asia","Lok Post"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Article Date</label>
              <input type="date" value={editForm.articleDate} onChange={e => setEditForm(p => ({ ...p, articleDate: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Image URL</label>
              <div className="flex gap-2">
                <input value={editForm.imageUrl} onChange={e => setEditForm(p => ({ ...p, imageUrl: e.target.value }))} className="flex-1 border-2 border-black p-2 text-sm font-inter outline-none" />
                <button
                  onClick={async () => {
                    setRegenImage(true);
                    try {
                      const res = await fetch("/api/ai-generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "image-only", topic: `Bold editorial caricature illustration of: ${editForm.title}. Section: ${editForm.category}. Satirical cartoon style, exaggerated features, vibrant colors, thick outlines, political cartoon art. NOT photorealistic. No text.` }),
                      });
                      const data = await res.json();
                      if (data.imageUrl) setEditForm(p => ({ ...p, imageUrl: data.imageUrl }));
                      else alert("Image generation failed — try again");
                    } catch { alert("Image generation error"); }
                    setRegenImage(false);
                  }}
                  disabled={regenImage}
                  className="px-3 py-2 bg-primary text-white text-[8px] font-inter font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                >
                  {regenImage ? <><Loader2 className="w-3 h-3 animate-spin" /> Gen...</> : <><Sparkles className="w-3 h-3" /> AI Image</>}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 4 * 1024 * 1024) { alert("File too large. Max 4MB."); return; }
                    setUploadingImage(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
                      if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`); }
                      const data = await res.json();
                      if (data.imageUrl) setEditForm(p => ({ ...p, imageUrl: data.imageUrl }));
                      else alert("Upload failed: " + (data.error || "Unknown error"));
                    } catch (err) { alert("Upload error: " + String(err)); }
                    setUploadingImage(false);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3 py-2 bg-red-600 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                >
                  {uploadingImage ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</> : <><Upload className="w-3 h-3" /> Upload</>}
                </button>
              </div>
            </div>
          </div>
          {/* Image Preview + Regenerate */}
          {editForm.imageUrl && (
            <div className="border border-black/10 p-2">
              <img src={editForm.imageUrl} alt="Preview" className="w-full max-h-48 object-cover" />
            </div>
          )}
          <button
            onClick={async () => {
              setRegenImage(true);
              try {
                const res = await fetch("/api/ai-generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "image-only", topic: `A photojournalistic scene representing: ${editForm.title}. Section: ${editForm.category}. Professional editorial photography, cinematic, dramatic.`, category: editForm.category }),
                });
                const data = await res.json();
                if (data.imageUrl) setEditForm(p => ({ ...p, imageUrl: data.imageUrl }));
                else alert("Image generation failed — try again");
              } catch { alert("Image generation error"); }
              setRegenImage(false);
            }}
            disabled={regenImage}
            className="w-full py-4 bg-red-600 text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-3 border-2 border-red-800"
          >
            {regenImage ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating New Image...</> : <><Sparkles className="w-5 h-5" /> 🎨 REGENERATE IMAGE WITH AI</>}
          </button>

          {/* AI Caricature Generator */}
          <div className="border-2 border-orange-500 bg-orange-50 p-4 space-y-3">
            <div>
              <p className="text-xs font-inter font-black uppercase tracking-widest text-orange-800">🎨 AI Caricature Generator</p>
              <p className="text-[9px] font-inter text-orange-600 mt-0.5">Generate a caricature/illustration with Gemini Imagen</p>
            </div>
            <textarea
              value={caricaturePrompt}
              onChange={e => setCaricaturePrompt(e.target.value)}
              placeholder="Describe the caricature... e.g. 'Indian PM at the helm of a ship navigating through rough seas, with ministers rowing'"
              rows={3}
              className="w-full border-2 border-orange-300 p-3 text-sm font-inter outline-none resize-none placeholder:text-orange-300 focus:border-orange-500"
            />
            <button
              onClick={async () => {
                if (!caricaturePrompt.trim()) { alert("Enter a prompt first"); return; }
                setGeneratingCaricature(true);
                try {
                  const res = await fetch("/api/generate-image/caricature", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: caricaturePrompt }),
                  });
                  const data = await res.json();
                  if (data.imageUrl) {
                    setEditForm(p => ({ ...p, imageUrl: data.imageUrl }));
                    alert("✅ Caricature generated! Review the image above.");
                  } else {
                    alert("Generation failed: " + (data.error || "Try a different prompt"));
                  }
                } catch (err) { alert("Error: " + String(err)); }
                setGeneratingCaricature(false);
              }}
              disabled={generatingCaricature || !caricaturePrompt.trim()}
              className="w-full py-3 bg-orange-600 text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-orange-700"
            >
              {generatingCaricature ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Caricature...</> : <><Sparkles className="w-4 h-4" /> 🎨 GENERATE AI CARICATURE</>}
            </button>
          </div>

          {/* AI Revisit — Claude + Gemini */}
          <div className="border-2 border-purple-600 bg-purple-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-inter font-black uppercase tracking-widest text-purple-800">🤖 AI Revisit</p>
                <p className="text-[9px] font-inter text-purple-600 mt-0.5">Send through Claude &amp; Gemini for editorial improvement</p>
              </div>
              <select
                value={aiRevisitEngine}
                onChange={e => setAiRevisitEngine(e.target.value as "auto" | "claude" | "gemini")}
                className="text-[9px] font-inter font-black uppercase border border-purple-300 px-2 py-1 bg-white"
              >
                <option value="auto">Auto (Claude → Gemini)</option>
                <option value="claude">Claude Only</option>
                <option value="gemini">Gemini Only</option>
              </select>
            </div>
            <button
              onClick={async () => {
                if (!confirm("AI will rewrite this article. Your current edits in the form will be replaced. Continue?")) return;
                setAiRevisiting(true);
                try {
                  const res = await fetch("/api/ai-revisit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: editForm.title,
                      titleHi: (editingPost as Post & { titleHi?: string })?.titleHi || "",
                      summary: editForm.summary,
                      summaryHi: (editingPost as Post & { summaryHi?: string })?.summaryHi || "",
                      content: editForm.content,
                      category: editForm.category,
                      author: editForm.author,
                      engine: aiRevisitEngine,
                    }),
                  });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  setEditForm(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    summary: data.summary || prev.summary,
                    content: data.content || prev.content,
                  }));
                  alert(`✅ AI Revisit complete! Engine used: ${data.engine?.toUpperCase()}. Review the changes before saving.`);
                } catch (err) {
                  alert("AI Revisit failed: " + String(err));
                }
                setAiRevisiting(false);
              }}
              disabled={aiRevisiting}
              className="w-full py-3 bg-purple-700 text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-purple-800 disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-purple-900"
            >
              {aiRevisiting ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Revisiting...</> : <><Sparkles className="w-4 h-4" /> AI REVISIT WITH CLAUDE &amp; GEMINI</>}
            </button>
          </div>

          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Summary</label>
            <textarea value={editForm.summary} onChange={e => setEditForm(p => ({ ...p, summary: e.target.value }))} rows={2} className="w-full border-2 border-black p-2 text-sm font-inter outline-none resize-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60">Content</label>
              <button
                onClick={() => setEditForm(p => ({ ...p, _htmlMode: !((p as Record<string,unknown>)._htmlMode) } as typeof p))}
                className="text-[7px] font-inter font-black uppercase tracking-widest px-2 py-0.5 border border-black/20 hover:bg-black hover:text-white"
              >
                {(editForm as Record<string,unknown>)._htmlMode ? "Visual Editor" : "HTML Source"}
              </button>
            </div>
            {(editForm as Record<string,unknown>)._htmlMode ? (
              <textarea value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={12} className="w-full border-2 border-black p-2 text-xs font-mono outline-none resize-y" />
            ) : (
              <>
                {/* Rich Text Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-2 border-black border-b-0 bg-gray-50 px-2 py-1.5">
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("bold"); }} className="px-2 py-1 text-xs font-bold hover:bg-black hover:text-white border border-transparent hover:border-black" title="Bold"><strong>B</strong></button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("italic"); }} className="px-2 py-1 text-xs italic hover:bg-black hover:text-white border border-transparent hover:border-black" title="Italic"><em>I</em></button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("underline"); }} className="px-2 py-1 text-xs underline hover:bg-black hover:text-white border border-transparent hover:border-black" title="Underline">U</button>
                  <div className="w-px h-5 bg-black/20 mx-1" />
                  <select
                    onChange={e => { const v = e.target.value; if (v === "p") { document.execCommand("formatBlock", false, "p"); } else { document.execCommand("formatBlock", false, v); } e.target.value = ""; }}
                    className="text-[9px] font-inter font-black uppercase border border-black/20 px-1 py-1 bg-white cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>Heading</option>
                    <option value="p">Paragraph</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                  </select>
                  <select
                    onChange={e => { document.execCommand("fontSize", false, e.target.value); e.target.value = ""; }}
                    className="text-[9px] font-inter font-black uppercase border border-black/20 px-1 py-1 bg-white cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>Size</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">Huge</option>
                  </select>
                  <div className="w-px h-5 bg-black/20 mx-1" />
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("insertUnorderedList"); }} className="px-2 py-1 text-xs hover:bg-black hover:text-white border border-transparent hover:border-black" title="Bullet List">• List</button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("insertOrderedList"); }} className="px-2 py-1 text-xs hover:bg-black hover:text-white border border-transparent hover:border-black" title="Numbered List">1. List</button>
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("formatBlock", false, "blockquote"); }} className="px-2 py-1 text-xs hover:bg-black hover:text-white border border-transparent hover:border-black" title="Quote">&ldquo; Quote</button>
                  <div className="w-px h-5 bg-black/20 mx-1" />
                  <button type="button" onMouseDown={e => { e.preventDefault(); const url = prompt("Enter link URL:"); if (url) document.execCommand("createLink", false, url); }} className="px-2 py-1 text-xs hover:bg-black hover:text-white border border-transparent hover:border-black" title="Link">🔗</button>
                  <button
                    type="button"
                    onMouseDown={async (e) => {
                      e.preventDefault();
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
                          const data = await res.json();
                          if (data.imageUrl) {
                            document.execCommand("insertHTML", false, `<img src="${data.imageUrl}" alt="" style="max-width:100%;margin:16px 0;" />`);
                          } else alert("Upload failed");
                        } catch { alert("Upload error"); }
                      };
                      input.click();
                    }}
                    className="px-2 py-1 text-xs hover:bg-black hover:text-white border border-transparent hover:border-black"
                    title="Insert Image"
                  >📷 Image</button>
                  <div className="w-px h-5 bg-black/20 mx-1" />
                  <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand("removeFormat"); }} className="px-2 py-1 text-[9px] text-red-600 hover:bg-red-50 border border-transparent hover:border-red-300" title="Clear Formatting">Clear</button>
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => { const html = e.currentTarget?.innerHTML; if (html != null) setEditForm(p => ({ ...p, content: html })); }}
                  dangerouslySetInnerHTML={{ __html: editForm.content }}
                  className="w-full border-2 border-black p-4 text-sm font-newsreader outline-none min-h-[300px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_img]:max-w-full [&_img]:my-4"
                />
              </>
            )}
          </div>
          {/* HTML Preview (when in visual mode) */}
          {editForm.content && !(editForm as Record<string,unknown>)._htmlMode && (
            <details className="border border-black/10">
              <summary className="text-[8px] font-inter font-black uppercase tracking-widest p-2 cursor-pointer opacity-60">HTML Source</summary>
              <pre className="p-4 text-[9px] font-mono bg-gray-50 overflow-x-auto max-h-40 whitespace-pre-wrap">{editForm.content}</pre>
            </details>
          )}
          <button onClick={saveEdit} disabled={editSaving} className="w-full py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary disabled:opacity-50 flex items-center justify-center gap-2">
            {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-newsreader font-black uppercase">All Posts</h2>
            <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
              {posts.length} articles {statusFilter !== "all" ? `(${statusFilter})` : ""} in the database
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={fetchPosts} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
              <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
            </button>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/revalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths: ["/", "/blog"] }) });
                  alert("✅ Homepage & blog cache purged! New articles will appear within seconds.");
                } catch { alert("Cache purge failed"); }
              }}
              className="px-3 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Site
            </button>
            <button
              onClick={async () => {
                const drafts = posts.filter(p => p.status === "draft" && !(p as Post & { aiReviewVerdict?: string }).aiReviewVerdict);
                if (drafts.length === 0) { alert("No unreviewed drafts"); return; }
                if (!confirm(`AI Review ${drafts.length} draft articles?`)) return;
                for (const post of drafts) {
                  try {
                    await fetch("/api/admin/review-article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id }) });
                  } catch { /* */ }
                }
                fetchPosts();
              }}
              className="px-3 py-2 bg-purple-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" /> AI Review Drafts
            </button>
            {selected.size > 0 && (
              <>
                <button
                  onClick={async () => {
                    for (const id of selected) {
                      await fetch("/api/admin/review-article", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                    }
                    fetchPosts(); setSelected(new Set());
                  }}
                  className="px-3 py-2 bg-purple-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> Review ({selected.size})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete ({selected.size})
                </button>
                <button
                  onClick={async () => {
                    for (const id of selected) {
                      await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                    }
                    fetchPosts(); setSelected(new Set());
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90"
                >
                  Publish ({selected.size})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border-2 border-black p-3 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border-2 border-black px-3 py-2 text-[10px] font-inter outline-none w-48 placeholder:opacity-30"
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as "all" | "published" | "draft"); setSelected(new Set()); }}
            className="border-2 border-black px-3 py-2 text-[10px] font-inter font-black uppercase tracking-widest outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border-2 border-black px-3 py-2 text-[10px] font-inter font-black uppercase tracking-widest outline-none"
          >
            <option value="all">All Sections</option>
            {["India","World","Politics","Geopolitics","Economy","Sports","Tech","Defence","Opinion","Cities","West Asia","Lok Post"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={authorFilter}
            onChange={e => setAuthorFilter(e.target.value)}
            className="border-2 border-black px-3 py-2 text-[10px] font-inter font-black uppercase tracking-widest outline-none"
          >
            <option value="all">All Authors</option>
            {[...new Set(posts.map(p => p.author))].filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {(searchQuery || categoryFilter !== "all" || authorFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setAuthorFilter("all"); }}
              className="text-[9px] font-inter underline opacity-60"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-inter opacity-40">Loading posts from Firebase...</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black overflow-x-auto">
          <table className="w-full min-w-0">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-2 sm:px-4 py-3 w-8 sm:w-10">
                  <input
                    type="checkbox"
                    checked={posts.length > 0 && selected.size === posts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest">Title</th>
                <th className="text-left px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest hidden lg:table-cell">Category</th>
                <th className="text-left px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest hidden lg:table-cell">Author</th>
                <th className="text-left px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Date</th>
                <th className="text-left px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest">Status</th>
                <th className="text-right px-2 sm:px-4 py-3 text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts
                .filter(p => categoryFilter === "all" || p.category === categoryFilter)
                .filter(p => authorFilter === "all" || p.author === authorFilter)
                .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .sort((a, b) => {
                  const da = (a as Post & { createdAt?: string }).createdAt ? new Date((a as Post & { createdAt?: string }).createdAt!).getTime() : 0;
                  const db = (b as Post & { createdAt?: string }).createdAt ? new Date((b as Post & { createdAt?: string }).createdAt!).getTime() : 0;
                  return db - da;
                })
                .map((post) => (
                <tr
                  key={post.id}
                  className={cn(
                    "border-b border-black/5 transition-colors cursor-pointer",
                    selected.has(post.id) ? "bg-primary/10" : "hover:bg-primary/5"
                  )}
                  onClick={() => toggleSelect(post.id)}
                >
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {(post as Post & { imageUrl?: string }).imageUrl && (
                        <img src={(post as Post & { imageUrl?: string }).imageUrl} alt="" className="w-10 h-7 sm:w-12 sm:h-8 object-cover flex-shrink-0 border border-black/10 hidden sm:block" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-newsreader font-bold line-clamp-2">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[9px] font-inter opacity-40">
                            {(post as Post & { createdAt?: string }).createdAt
                              ? new Date((post as Post & { createdAt?: string }).createdAt!).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                              : ""
                            }
                          </p>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className="text-[8px] font-inter font-bold text-primary hover:underline"
                          >
                            link
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-4 hidden lg:table-cell">
                    <span className="bg-primary/10 text-primary px-2 py-1 text-[9px] font-inter font-black uppercase">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-sm font-inter hidden lg:table-cell">{post.author}</td>
                  <td className="px-2 sm:px-4 py-4 text-[10px] font-inter opacity-50 hidden md:table-cell whitespace-nowrap">
                    {(post as Post & { createdAt?: string }).createdAt
                      ? new Date((post as Post & { createdAt?: string }).createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                      : "—"
                    }
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "px-2 py-1 text-[9px] font-inter font-black uppercase",
                        post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      )}>
                        {post.status}
                      </span>
                      {(post as Post & { aiReviewVerdict?: string }).aiReviewVerdict && (
                        <span className={cn(
                          "px-2 py-0.5 text-[7px] font-inter font-black uppercase tracking-wider",
                          (post as Post & { aiReviewVerdict?: string }).aiReviewVerdict === "APPROVED" ? "bg-purple-100 text-purple-700" :
                          (post as Post & { aiReviewVerdict?: string }).aiReviewVerdict === "REJECTED" ? "bg-red-100 text-red-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          AI: {(post as Post & { aiReviewVerdict?: string }).aiReviewVerdict}
                          {(post as Post & { aiReviewScore?: number }).aiReviewScore !== undefined && ` (${(post as Post & { aiReviewScore?: number }).aiReviewScore}%)`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                      {/* Breaking toggle — hidden on mobile */}
                      <button
                        onClick={async () => {
                          const isBreaking = !(post as Post & { isBreaking?: boolean }).isBreaking;
                          try {
                            await fetch("/api/admin/breaking", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: post.id, isBreaking }),
                            });
                            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isBreaking } as Post : p));
                          } catch { /* ignore */ }
                        }}
                        className={cn(
                          "px-2 py-1 text-[8px] font-inter font-black uppercase tracking-widest border hidden sm:inline-flex",
                          (post as Post & { isBreaking?: boolean }).isBreaking
                            ? "bg-red-600 text-white border-red-600"
                            : "text-red-600 border-red-300 hover:bg-red-50"
                        )}
                        title="Toggle Breaking News"
                      >
                        🔴 {(post as Post & { isBreaking?: boolean }).isBreaking ? "Breaking" : "Mark Breaking"}
                      </button>
                      {/* E-Paper toggle */}
                      <button
                        onClick={async () => {
                          const inEpaper = !(post as Post & { inEpaper?: boolean }).inEpaper;
                          try {
                            await fetch("/api/admin/update-post", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: post.id, inEpaper }),
                            });
                            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, inEpaper } as Post : p));
                          } catch { /* ignore */ }
                        }}
                        className={cn(
                          "px-2 py-1 text-[8px] font-inter font-black uppercase tracking-widest border hidden sm:inline-flex",
                          (post as Post & { inEpaper?: boolean }).inEpaper
                            ? "bg-blue-700 text-white border-blue-700"
                            : "text-blue-600 border-blue-300 hover:bg-blue-50"
                        )}
                        title="Include in E-Paper"
                      >
                        📰 {(post as Post & { inEpaper?: boolean }).inEpaper ? "In E-Paper" : "Add to E-Paper"}
                      </button>
                      {post.status === "draft" ? (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/admin/publish", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: post.id }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: "published" as const } : p));
                              }
                            } catch { /* ignore */ }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-blue-700"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await fetch("/api/admin/publish", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: post.id, unpublish: true }),
                              });
                              setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: "draft" as const } : p));
                            } catch { /* ignore */ }
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-yellow-600"
                        >
                          Unpublish
                        </button>
                      )}
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="px-2 py-1 border border-black/20 text-[8px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                      >
                        View ↗
                      </Link>
                      <button
                        onClick={() => openEditor(post)}
                        className="px-3 py-1.5 bg-red-600 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-red-800 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Article
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this article?")) return;
                          try {
                            await fetch("/api/admin/delete-posts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ids: [post.id] }),
                            });
                            setPosts(prev => prev.filter(p => p.id !== post.id));
                          } catch { /* ignore */ }
                        }}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 text-[8px] font-inter font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ApprovalQueue() {
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, { score: number; verdict: string; summary?: string; imageVerdict?: string }>>({});
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [regenImageId, setRegenImageId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list-posts?status=draft");
      const data = await res.json();
      const posts = (data.posts || []) as Post[];
      setDrafts(posts);
      // Extract existing review data
      const existingReviews: Record<string, { score: number; verdict: string; summary?: string; imageVerdict?: string }> = {};
      for (const p of posts) {
        const ext = p as unknown as Record<string, unknown>;
        if (ext.aiReviewVerdict) {
          let summary = "";
          try { const r = JSON.parse((ext.aiReview as string) || "{}"); summary = r.summary || ""; } catch { /* */ }
          existingReviews[p.id] = {
            score: (ext.aiReviewScore as number) || 0,
            verdict: (ext.aiReviewVerdict as string) || "",
            summary,
          };
        }
      }
      setReviews(prev => ({ ...prev, ...existingReviews }));
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    }
    setLoading(false);
    setSelected(new Set());
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === drafts.length) setSelected(new Set());
    else setSelected(new Set(drafts.map(d => d.id)));
  };

  const saveEditedPost = async () => {
    if (!editingPost) return;
    setEditSaving(true);
    try {
      const { setDoc } = await import("@/lib/firestore-rest");
      await setDoc(`posts/${editingPost.id}`, {
        title: editingPost.title,
        titleHi: editingPost.titleHi || "",
        summary: editingPost.summary,
        content: editingPost.content,
        author: editingPost.author,
        imageUrl: editingPost.imageUrl,
        category: editingPost.category,
      });
      setDrafts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...editingPost } : p));
      setEditingPost(null);
    } catch (err) { alert("Save failed: " + String(err)); }
    setEditSaving(false);
  };

  const regenerateImage = async (postId: string, title: string) => {
    setRegenImageId(postId);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image-only", topic: `Professional newspaper editorial photo for article: "${title}". Photojournalistic, cinematic lighting.` }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const { setDoc } = await import("@/lib/firestore-rest");
        await setDoc(`posts/${postId}`, { imageUrl: data.imageUrl });
        setDrafts(prev => prev.map(p => p.id === postId ? { ...p, imageUrl: data.imageUrl } : p));
        if (editingPost?.id === postId) setEditingPost({ ...editingPost, imageUrl: data.imageUrl });
      }
    } catch (err) { alert("Image gen failed: " + String(err)); }
    setRegenImageId(null);
  };

  const runReview = async (id: string) => {
    setReviewingId(id);
    try {
      const res = await fetch("/api/admin/review-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.review) {
        setReviews(prev => ({
          ...prev,
          [id]: {
            score: data.review.overallScore || 0,
            verdict: data.review.verdict || "UNKNOWN",
            summary: data.review.summary || "",
            imageVerdict: data.review.imageReview?.verdict || "",
          },
        }));
      }
    } catch (err) {
      alert("Review failed: " + String(err));
    }
    setReviewingId(null);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDrafts(prev => prev.filter(p => p.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      alert("Failed to approve: " + String(err));
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/delete-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setDrafts(prev => prev.filter(p => p.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      alert("Failed to reject: " + String(err));
    }
    setActionLoading(null);
  };

  const handleBulkAction = async (action: "approve" | "delete") => {
    if (selected.size === 0) return;
    const label = action === "approve" ? "Approve" : "Delete";
    if (!confirm(`${label} ${selected.size} selected article(s)?`)) return;
    setActionLoading("bulk");
    try {
      const ids = [...selected];
      if (action === "approve") {
        const { updatePost } = await import("@/lib/firebase-service");
        for (const id of ids) await updatePost(id, { status: "published" });
      } else {
        await fetch("/api/admin/delete-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      }
      setDrafts(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    } catch (err) {
      alert("Error: " + String(err));
    }
    setActionLoading(null);
  };

  const handleApproveAll = async () => {
    if (!confirm(`Approve all ${drafts.length} drafts?`)) return;
    setActionLoading("all");
    try {
      const { updatePost } = await import("@/lib/firebase-service");
      for (const draft of drafts) {
        await updatePost(draft.id, { status: "published" });
      }
      setDrafts([]);
      setSelected(new Set());
    } catch (err) {
      alert("Error: " + String(err));
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> Approval Queue
          </h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            {drafts.length} articles pending admin approval
            {selected.size > 0 && ` · ${selected.size} selected`}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={fetchDrafts} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
          </button>
          {selected.size > 0 && (
            <>
              <button onClick={() => handleBulkAction("approve")} disabled={actionLoading === "bulk"} className="px-3 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                {actionLoading === "bulk" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Approve ({selected.size})
              </button>
              <button onClick={() => handleBulkAction("delete")} disabled={actionLoading === "bulk"} className="px-3 py-2 bg-red-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                {actionLoading === "bulk" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete ({selected.size})
              </button>
            </>
          )}
          {drafts.length > 0 && selected.size === 0 && (
            <button onClick={handleApproveAll} disabled={actionLoading === "all"} className="px-4 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
              {actionLoading === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Approve All ({drafts.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-inter opacity-40">Loading drafts from Firebase...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500/20 mx-auto mb-4" />
          <p className="text-lg font-newsreader font-bold italic opacity-40">
            No pending articles. All clear!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all checkbox */}
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={drafts.length > 0 && selected.size === drafts.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <span className="text-[9px] font-inter font-black uppercase tracking-widest text-[var(--nyt-gray)]">
              Select All
            </span>
          </div>
          {drafts.map((post) => (
            <div key={post.id} className={cn("bg-white border-2 p-5 flex items-start gap-5 transition-colors", selected.has(post.id) ? "border-primary bg-primary/5" : "border-black hover:border-primary")}>
              <input
                type="checkbox"
                checked={selected.has(post.id)}
                onChange={() => toggleSelect(post.id)}
                className="w-4 h-4 accent-primary cursor-pointer mt-1 shrink-0"
              />
              {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="w-24 h-16 object-cover shrink-0 border border-black/10" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 text-[8px] font-inter font-black uppercase">
                    {post.category}
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[8px] font-inter font-black uppercase">
                    Draft
                  </span>
                  {post.authorRole === "agent" && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 text-[8px] font-inter font-black uppercase flex items-center gap-1">
                      <Bot className="w-2.5 h-2.5" /> AI Generated
                    </span>
                  )}
                  {/* AI Review Badge */}
                  {reviews[post.id] ? (
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-inter font-black uppercase flex items-center gap-1",
                      reviews[post.id].verdict === "APPROVED" && "bg-green-100 text-green-700",
                      reviews[post.id].verdict === "NEEDS_EDIT" && "bg-yellow-100 text-yellow-700",
                      reviews[post.id].verdict === "REJECTED" && "bg-red-100 text-red-700",
                    )}>
                      {reviews[post.id].verdict === "APPROVED" ? <CheckCircle2 className="w-2.5 h-2.5" /> : reviews[post.id].verdict === "REJECTED" ? <XCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                      AI: {reviews[post.id].score}/100
                      {reviews[post.id].imageVerdict && ` · Img: ${reviews[post.id].imageVerdict}`}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); runReview(post.id); }}
                      disabled={reviewingId === post.id}
                      className="px-2 py-0.5 text-[8px] font-inter font-black uppercase bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1 disabled:opacity-50"
                    >
                      {reviewingId === post.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                      {reviewingId === post.id ? "Reviewing..." : "AI Review"}
                    </button>
                  )}
                </div>
                <h4 className="text-sm font-newsreader font-bold leading-snug truncate">{post.title}</h4>
                <p className="text-[10px] font-inter text-[var(--nyt-gray)] mt-1 line-clamp-1">{post.summary}</p>
                {reviews[post.id]?.summary && (
                  <p className="text-[9px] font-inter text-purple-600 mt-1 italic line-clamp-1">AI: {reviews[post.id].summary}</p>
                )}
                <p className="text-[9px] font-inter opacity-40 mt-1">By {post.author}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingPost(editingPost?.id === post.id ? null : { ...post })}
                  className="px-2 py-2 border-2 border-black text-[9px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleApprove(post.id)}
                  disabled={actionLoading === post.id}
                  className="px-3 py-2 bg-green-600 text-white text-[9px] font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-1 disabled:opacity-50"
                >
                  {actionLoading === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(post.id)}
                  disabled={actionLoading === post.id}
                  className="px-3 py-2 border-2 border-red-500 text-red-500 text-[9px] font-inter font-black uppercase tracking-widest hover:bg-red-500 hover:text-white flex items-center gap-1 disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>

              {/* ── Expandable Edit Panel ── */}
              {editingPost?.id === post.id && (
                <div className="col-span-full mt-4 border-t-2 border-primary pt-4 space-y-4">
                  {/* Image + Regenerate */}
                  <div className="flex gap-4">
                    <div className="relative group w-48 h-32 bg-black/5 overflow-hidden shrink-0">
                      {editingPost.imageUrl ? (
                        <img src={editingPost.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 opacity-20" /></div>
                      )}
                      <button
                        onClick={() => regenerateImage(post.id, editingPost.title)}
                        disabled={regenImageId === post.id}
                        className="absolute bottom-1 right-1 px-2 py-1 bg-black/80 text-white text-[7px] font-inter font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        {regenImageId === post.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                        AI Regen
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Image URL</label>
                        <input value={editingPost.imageUrl || ""} onChange={e => setEditingPost({ ...editingPost, imageUrl: e.target.value })} className="w-full border border-black/20 p-1.5 text-xs font-inter outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Author</label>
                          <input value={editingPost.author || ""} onChange={e => setEditingPost({ ...editingPost, author: e.target.value })} className="w-full border border-black/20 p-1.5 text-xs font-inter outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Category</label>
                          <select value={editingPost.category} onChange={e => setEditingPost({ ...editingPost, category: e.target.value as Post["category"] })} className="w-full border border-black/20 p-1.5 text-xs font-inter outline-none focus:border-primary">
                            {["India","World","Politics","Geopolitics","Economy","Sports","Tech","Defence","Opinion","Cities","West Asia","Lok Post"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Headline */}
                  <div>
                    <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Headline</label>
                    <input value={editingPost.title} onChange={e => setEditingPost({ ...editingPost, title: e.target.value })} className="w-full border-2 border-black p-2 text-lg font-newsreader font-bold outline-none focus:border-primary" />
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Summary</label>
                    <textarea value={editingPost.summary} onChange={e => setEditingPost({ ...editingPost, summary: e.target.value })} rows={2} className="w-full border border-black/20 p-2 text-sm font-inter outline-none focus:border-primary resize-none" />
                  </div>

                  {/* Content — plain text editor */}
                  <div>
                    <label className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 block mb-0.5">Article Content</label>
                    <textarea
                      value={editingPost.content.replace(/<[^>]+>/g, (tag: string) => {
                        if (tag === "<p>") return "";
                        if (tag === "</p>") return "\n\n";
                        if (tag === "<br>" || tag === "<br/>") return "\n";
                        if (tag.startsWith("<h2")) return "\n## ";
                        if (tag.startsWith("</h2")) return "\n";
                        if (tag.startsWith("<blockquote")) return "\n> ";
                        if (tag === "</blockquote>") return "\n";
                        if (tag === "<li>") return "• ";
                        if (tag === "</li>") return "\n";
                        return "";
                      }).trim()}
                      onChange={e => {
                        const html = e.target.value.split("\n").map((line: string) => {
                          const t = line.trim();
                          if (!t) return "";
                          if (t.startsWith("## ")) return `<h2>${t.slice(3)}</h2>`;
                          if (t.startsWith("> ")) return `<blockquote>${t.slice(2)}</blockquote>`;
                          if (t.startsWith("• ")) return `<li>${t.slice(2)}</li>`;
                          return `<p>${t}</p>`;
                        }).join("");
                        setEditingPost({ ...editingPost, content: html });
                      }}
                      rows={12}
                      className="w-full border border-black/20 p-3 text-sm font-inter leading-relaxed outline-none focus:border-primary resize-y"
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-3">
                    <button onClick={saveEditedPost} disabled={editSaving} className="px-4 py-2 bg-black text-white text-[9px] font-inter font-black uppercase tracking-widest hover:bg-primary disabled:opacity-50 flex items-center gap-1.5">
                      {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Save Changes
                    </button>
                    <button onClick={() => setEditingPost(null)} className="px-4 py-2 border border-black/20 text-[9px] font-inter font-black uppercase tracking-widest hover:bg-black/5">
                      Cancel
                    </button>
                    <button onClick={() => { saveEditedPost().then(() => handleApprove(post.id)); }} disabled={editSaving} className="px-4 py-2 bg-green-600 text-white text-[9px] font-inter font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 ml-auto">
                      Save & Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeedContentPanel() {
  const [seedingAuthors, setSeedingAuthors] = useState(false);
  const [seedingArticles, setSeedingArticles] = useState(false);
  const [authorResult, setAuthorResult] = useState<string | null>(null);
  const [articleResult, setArticleResult] = useState<string | null>(null);

  const seedAuthors = async () => {
    setSeedingAuthors(true);
    setAuthorResult(null);
    try {
      const res = await fetch("/api/seed-authors", { method: "POST" });
      const data = await res.json();
      setAuthorResult(data.message || JSON.stringify(data));
    } catch (err) {
      setAuthorResult("Error: " + String(err));
    }
    setSeedingAuthors(false);
  };

  const seedArticles = async () => {
    setSeedingArticles(true);
    setArticleResult(null);
    try {
      const res = await fetch("/api/seed-articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setArticleResult(data.message || JSON.stringify(data));
    } catch (err) {
      setArticleResult("Error: " + String(err));
    }
    setSeedingArticles(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          <Rss className="w-8 h-8 text-primary" /> Seed Content
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Create author accounts & fetch RSS articles for all sections
        </p>
      </div>

      {/* Seed Authors */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Step 1: Create Author Accounts
        </h3>
        <p className="text-xs font-inter opacity-60 mb-4">
          Creates 7 authors (Aditya Ashok, Ashok Kumar Choudhary, Sanjay Saraogi, Adarsh Ashok, Seema Choudhary, Shreya Rahul Anand, Admin) with Firebase Auth credentials.
        </p>
        <button
          onClick={seedAuthors}
          disabled={seedingAuthors}
          className="px-6 py-3 bg-black text-white text-xs font-inter font-black uppercase tracking-widest hover:bg-primary flex items-center gap-2 disabled:opacity-50"
        >
          {seedingAuthors ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {seedingAuthors ? "Creating Accounts..." : "Create All Authors"}
        </button>
        {authorResult && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 text-xs font-inter text-green-800">
            {authorResult}
          </div>
        )}
      </div>

      {/* Seed Articles */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-2 flex items-center gap-2">
          <Rss className="w-4 h-4 text-primary" /> Step 2: Fetch RSS Articles (10 per section)
        </h3>
        <p className="text-xs font-inter opacity-60 mb-4">
          Fetches live RSS feeds for India, World, Politics, Geopolitics, Economy, Sports, Tech, Defence, Opinion, Cities. Creates ~100 draft articles that need admin approval.
        </p>
        <button
          onClick={seedArticles}
          disabled={seedingArticles}
          className="px-6 py-3 bg-black text-white text-xs font-inter font-black uppercase tracking-widest hover:bg-primary flex items-center gap-2 disabled:opacity-50"
        >
          {seedingArticles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rss className="w-4 h-4" />}
          {seedingArticles ? "Fetching RSS & Creating Drafts..." : "Seed 100 Articles (as Drafts)"}
        </button>
        {articleResult && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 text-xs font-inter text-green-800">
            {articleResult}
          </div>
        )}
      </div>

      {/* Author directory table */}
      <div className="bg-white border-2 border-black overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Email / Login ID</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Role</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Designation</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Aditya Ashok", email: "aditya.ashok@gmail.com", role: "Admin", desg: "Founder & Editor-in-Chief" },
              { name: "Ashok Kumar Choudhary", email: "ashok.choudhary@gmail.com", role: "Admin", desg: "Managing Editor" },
              { name: "Sanjay Saraogi", email: "sanjay.saraogi@gmail.com", role: "Author", desg: "Business & Economy Editor" },
              { name: "Adarsh Ashok", email: "adarsh.ashok@gmail.com", role: "Author", desg: "Tech & Defence Correspondent" },
              { name: "Seema Choudhary", email: "seema.choudhary@gmail.com", role: "Author", desg: "Cities & Culture Editor" },
              { name: "Shreya Rahul Anand", email: "shreya.anand@gmail.com", role: "Author", desg: "Sr. Correspondent — Politics" },
              { name: "Admin", email: "admin@loktantravani.com", role: "Admin", desg: "System Administrator" },
            ].map((a) => (
              <tr key={a.email} className="border-b border-black/5 hover:bg-primary/5">
                <td className="px-4 py-3 text-sm font-inter font-bold">{a.name}</td>
                <td className="px-4 py-3 text-sm font-inter text-primary">{a.email}</td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 text-[9px] font-inter font-black uppercase", a.role === "Admin" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-700")}>
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-inter opacity-60 hidden md:table-cell">{a.desg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewPostPanel() {
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [aiTab, setAiTab] = useState<"topic" | "link" | "trending" | "cartoon">("topic");
  const [topic, setTopic] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [category, setCategory] = useState<string>("India");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("neutral");
  const [wordCount, setWordCount] = useState(1500);
  const [author, setAuthor] = useState("LoktantraVani AI");
  const [cartoonStyle, setCartoonStyle] = useState("political-satire");
  const [cartoonStance, setCartoonStance] = useState("neutral");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    type: string; headline?: string; headlineHi?: string; summary?: string;
    content?: string; imageUrl?: string; savedId?: string; savedSlug?: string; hasImage?: boolean;
    _editMode?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [trendingItems, setTrendingItems] = useState<{ title: string; description: string; source: string }[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState<number | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [customContext, setCustomContext] = useState("");
  const [customPhotos, setCustomPhotos] = useState<string[]>(["", "", ""]);

  const categories = ["India", "World", "Politics", "Geopolitics", "Economy", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Lok Post"];
  const [authorsList, setAuthorsList] = useState<{ name: string; designation: string }[]>([]);
  useEffect(() => {
    fetch("/api/admin/authors").then(r => r.json()).then(d => {
      const list = (d.authors || []).map((a: Record<string, unknown>) => ({
        name: (a.name as string) || "",
        designation: (a.designation as string) || "",
      })).filter((a: { name: string }) => a.name);
      setAuthorsList(list);
    }).catch(() => {});
  }, []);
  const authors = [
    "LoktantraVani AI",
    ...authorsList.map(a => a.designation ? `${a.name} — ${a.designation}` : a.name),
  ];

  const handleGenerate = async (genTopic: string, genType: "article" | "cartoon" = "article") => {
    if (!genTopic) { setError("Please enter a topic"); return; }
    setGenerating(true);
    setError("");
    setResult(null);
    setExtraImages([]);
    try {
      const authorName = author.split(" — ")[0];
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: genType,
          topic: customContext ? `${genTopic}\n\nADDITIONAL DIRECTION: ${customContext}` : genTopic,
          category: genType === "cartoon" ? "Lok Post" : category,
          language,
          tone,
          style: cartoonStyle,
          wordCount,
          author: authorName,
          customPhotos: customPhotos.filter(Boolean),
        }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { setError("AI generation failed. Server returned: " + text.slice(0, 200)); setGenerating(false); return; }
      if (data.error) { setError(data.error); }
      else {
        if (data.saveError || !data.savedId) {
          setError(`Article generated but failed to save to database: ${data.saveError || "Unknown error"}. You can try the Publish button to retry.`);
        }
        setResult({
          type: data.type,
          headline: data.result?.headline || data.result?.headlineHi,
          headlineHi: data.result?.headlineHi,
          summary: data.result?.summary || data.result?.caption,
          content: data.result?.content,
          imageUrl: data.result?.imageUrl,
          savedId: data.savedId,
          hasImage: data.result?.hasImage,
        });
        // For long articles, generate a second image
        if (genType === "article" && wordCount >= 2000) {
          try {
            const img2Res = await fetch("/api/ai-generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "image-only", topic: genTopic + " — second angle, different perspective", category }),
            });
            const img2Data = await img2Res.json();
            if (img2Data.imageUrl) setExtraImages([img2Data.imageUrl]);
          } catch { /* second image is optional */ }
        }
      }
    } catch (err) {
      setError("Generation failed: " + String(err));
    }
    setGenerating(false);
  };

  const handleRegenerateImage = async (index: number) => {
    setRegeneratingImage(index);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image-only", topic: topic || result?.headline || "news editorial", category }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        if (index === 0 && result) {
          setResult({ ...result, imageUrl: data.imageUrl });
        } else {
          setExtraImages(prev => { const next = [...prev]; next[index - 1] = data.imageUrl; return next; });
        }
      }
    } catch { /* ignore */ }
    setRegeneratingImage(null);
  };

  const handleLinkGenerate = async () => {
    if (!linkUrl) { setError("Please enter a URL"); return; }
    const urlTopic = linkUrl.includes("x.com") || linkUrl.includes("twitter.com")
      ? `Analyze and write article based on this X/Twitter post: ${linkUrl}`
      : `Analyze and write article based on this source: ${linkUrl}`;
    await handleGenerate(urlTopic);
  };

  const fetchTrending = async () => {
    setLoadingTrending(true);
    setError("");
    try {
      const res = await fetch("/api/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setTrendingItems(data.items);
      } else {
        setError("No trending news found for " + category + ". RSS feeds may be unavailable.");
      }
    } catch {
      setError("Failed to fetch trending news. Check your connection.");
    }
    setLoadingTrending(false);
  };

  if (mode === "manual") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-newsreader font-black uppercase">New Post</h2>
          <div className="flex border-2 border-black">
            <button onClick={() => setMode("manual")} className="px-4 py-2 bg-black text-white text-[9px] font-inter font-black uppercase tracking-widest">Manual</button>
            <button onClick={() => setMode("ai")} className="px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest hover:bg-black/5">AI Mode</button>
          </div>
        </div>
        <PostEditor />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" /> AI Content Studio
          </h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            Generate articles, cartoons & more with AI
          </p>
        </div>
        <div className="flex border-2 border-black">
          <button onClick={() => setMode("manual")} className="px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest hover:bg-black/5">Manual</button>
          <button onClick={() => setMode("ai")} className="px-4 py-2 bg-black text-white text-[9px] font-inter font-black uppercase tracking-widest">AI Mode</button>
        </div>
      </div>

      {/* AI Sub-tabs */}
      <div className="flex gap-0 border-2 border-black overflow-hidden">
        {[
          { id: "topic" as const, label: "Write from Topic", icon: "✍️" },
          { id: "link" as const, label: "From URL / X Link", icon: "🔗" },
          { id: "trending" as const, label: "Trending RSS", icon: "📡" },
          { id: "cartoon" as const, label: "Lok Post", icon: "🎨" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAiTab(tab.id)}
            className={cn(
              "flex-1 py-3 text-[9px] font-inter font-black uppercase tracking-widest flex items-center justify-center gap-2 border-r border-black last:border-0 transition-colors",
              aiTab === tab.id ? "bg-black text-white" : "hover:bg-black/5"
            )}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Section Tabs — visual category picker */}
      {aiTab !== "cartoon" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1.5 text-[9px] font-inter font-black uppercase tracking-widest border-2 transition-all",
                  category === c
                    ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-black/15 text-black/50 hover:border-black hover:text-black"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                <option value="neutral">Neutral</option>
                <option value="nationalist">Nationalist</option>
                <option value="analytical">Analytical</option>
                <option value="pro-bjp">Pro-BJP / NDA</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Word Count</label>
              <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                <option value={500}>Short (~500)</option>
                <option value={1500}>Standard (~1500)</option>
                <option value={2000}>Long (~2000)</option>
                <option value={2500}>Deep Dive (~2500)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Author / Byline</label>
              <select value={author} onChange={e => setAuthor(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                {authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {aiTab === "topic" && (
          <div className="space-y-4">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest flex items-center gap-2">
              ✍️ Auto-Generate Article from Topic
            </h3>
            <p className="text-xs font-inter opacity-60">Enter any topic — AI writes a full article with headline, summary, content & generates an editorial image.</p>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., India's Moon Mission 2026, Delhi Metro Phase 5, IPL auction analysis..."
              className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30"
              onKeyDown={e => e.key === "Enter" && handleGenerate(topic)}
            />
            {/* Custom Direction */}
            <textarea
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              placeholder="Optional: Tell AI the angle — 'Write as opinion', 'Focus on economic impact', 'Pro-India tone', 'Include comparison with China'..."
              rows={2}
              className="w-full border border-black/30 p-2.5 font-inter text-sm outline-none placeholder:opacity-30 resize-none bg-gray-50"
            />
            <button
              onClick={() => handleGenerate(topic)}
              disabled={generating}
              className="w-full py-4 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {wordCount} word article...</> : <><Sparkles className="w-4 h-4" /> Generate Article + Image ({wordCount} words)</>}
            </button>
          </div>
        )}

        {aiTab === "link" && (
          <div className="space-y-4">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest flex items-center gap-2">
              🔗 Auto-Generate from URLs (Multiple Supported)
            </h3>
            <p className="text-xs font-inter opacity-60">Paste one or more URLs (one per line) — AI reads all sources and generates a comprehensive LoktantraVani article combining insights from all links.</p>
            <textarea
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder={"https://www.thehindu.com/article/...\nhttps://x.com/user/status/...\nhttps://pib.gov.in/PressReleasePage.aspx?PRID=...\nhttps://economictimes.com/article/..."}
              rows={4}
              className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30 resize-none"
            />
            <div className="flex items-center gap-2 text-[9px] font-inter opacity-40">
              <span>💡 Paste multiple URLs — AI merges all sources into one well-researched article</span>
              <span>•</span>
              <span>{linkUrl.split("\n").filter(l => l.trim().startsWith("http")).length} URL(s) detected</span>
            </div>

            {/* Custom Content Direction */}
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Custom Direction (Optional)</label>
              <textarea
                value={customContext}
                onChange={e => setCustomContext(e.target.value)}
                placeholder="Tell AI what angle to take: e.g., 'Focus on economic impact', 'Write as opinion piece', 'Highlight PM Modi's role', 'Compare with China's policy'..."
                rows={2}
                className="w-full border border-black/30 p-2.5 font-inter text-sm outline-none placeholder:opacity-30 resize-none bg-gray-50"
              />
            </div>

            {/* Photo Upload — up to 3 */}
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Article Photos (Optional — AI generates if empty)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[0, 1, 2].map(idx => (
                  <div key={idx} className="border border-black/20 bg-gray-50 p-2">
                    <p className="text-[7px] font-inter font-black uppercase tracking-widest opacity-40 mb-1">
                      {idx === 0 ? "Thumbnail" : `Photo ${idx + 1}`}
                    </p>
                    {customPhotos[idx] ? (
                      <div className="relative">
                        <img src={customPhotos[idx]} alt="" className="w-full h-20 object-cover border border-black/10" />
                        <button onClick={() => { const np = [...customPhotos]; np[idx] = ""; setCustomPhotos(np); }} className="absolute top-0.5 right-0.5 bg-black/70 text-white w-4 h-4 flex items-center justify-center text-[8px]">×</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <input type="text" placeholder="Paste URL" value={customPhotos[idx] || ""} onChange={e => { const np = [...customPhotos]; np[idx] = e.target.value; setCustomPhotos(np); }} className="w-full border border-black/15 p-1 text-[8px] font-inter outline-none placeholder:opacity-30" />
                        <label className="text-[7px] font-inter font-black uppercase tracking-widest text-center py-1 border border-black/15 cursor-pointer hover:bg-black hover:text-white transition-colors">
                          Upload
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            const buffer = await file.arrayBuffer();
                            const bytes = new Uint8Array(buffer);
                            const filename = `articles/${Date.now()}-photo${idx}.${file.name.split(".").pop()}`;
                            const bucket = "loktantravani-2d159.firebasestorage.app";
                            const uploadRes = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?uploadType=media`, { method: "POST", headers: { "Content-Type": file.type }, body: bytes });
                            if (uploadRes.ok) { const data = await uploadRes.json(); const np = [...customPhotos]; np[idx] = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`; setCustomPhotos(np); }
                          }} />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleLinkGenerate}
              disabled={generating}
              className="w-full py-4 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading {linkUrl.split("\n").filter(l => l.trim().startsWith("http")).length} sources & Generating...</> : <><Bot className="w-4 h-4" /> Analyze {linkUrl.split("\n").filter(l => l.trim().startsWith("http")).length || ""} Link{linkUrl.split("\n").filter(l => l.trim().startsWith("http")).length > 1 ? "s" : ""} & Generate Article</>}
            </button>
          </div>
        )}

        {aiTab === "trending" && (
          <div className="space-y-4">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest flex items-center gap-2">
              📡 Trending News from RSS Feeds
            </h3>
            <p className="text-xs font-inter opacity-60">Fetch live RSS feeds for any section → select a story → AI generates a full article.</p>
            <div className="flex gap-3">
              <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 border-2 border-black p-3 font-inter font-bold text-sm outline-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={fetchTrending}
                disabled={loadingTrending}
                className="px-6 py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loadingTrending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rss className="w-4 h-4" />}
                Fetch Trending
              </button>
            </div>
            {trendingItems.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {trendingItems.map((item, i) => (
                  <div key={i} className="border-2 border-black/10 p-3 hover:border-primary cursor-pointer transition-colors flex items-start justify-between gap-3"
                    onClick={() => {
                      setTopic(item.title);
                      setAiTab("topic");
                      // Also copy to clipboard for convenience
                      navigator.clipboard?.writeText(item.title).catch(() => {});
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-newsreader font-bold leading-snug">{item.title}</p>
                      <p className="text-[10px] font-inter opacity-50 mt-1 line-clamp-1">{item.description}</p>
                      <span className="text-[8px] font-inter font-black uppercase tracking-widest text-primary mt-1 block">{item.source}</span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setTopic(item.title); setAiTab("topic"); }}
                        className="px-3 py-1.5 bg-primary text-white text-[8px] font-inter font-black uppercase tracking-widest hover:opacity-90"
                      >
                        Article →
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setTopic(item.title); setAiTab("cartoon"); }}
                        className="px-3 py-1.5 bg-purple-600 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:opacity-90"
                      >
                        🎨 Cartoon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aiTab === "cartoon" && (
          <div className="space-y-4">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest flex items-center gap-2">
              🎨 Lok Post — AI Cartoon Generator
            </h3>
            <p className="text-xs font-inter opacity-60">One-click satirical cartoon with AI. Enter topic + tagline, pick a stance, and generate!</p>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Budget 2026 reactions, Cricket vs Studies, WhatsApp University..."
              className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Style</label>
                <select value={cartoonStyle} onChange={e => setCartoonStyle(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                  <option value="political-satire">Political Satire (R.K. Laxman)</option>
                  <option value="social-commentary">Social Commentary</option>
                  <option value="humor">Light Humor / Fun</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Author / Byline</label>
                <select value={author} onChange={e => setAuthor(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
                  {authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Political Stance */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Political Stance / Perspective</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "pro-india", label: "🇮🇳 Pro India", color: "border-orange-500 bg-orange-50 text-orange-700" },
                  { value: "pro-usa", label: "🇺🇸 Pro USA", color: "border-blue-500 bg-blue-50 text-blue-700" },
                  { value: "pro-iran", label: "🇮🇷 Pro Iran", color: "border-green-500 bg-green-50 text-green-700" },
                  { value: "neutral", label: "⚖️ Neutral", color: "border-gray-500 bg-gray-50 text-gray-700" },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => setCartoonStance(s.value)}
                    className={cn(
                      "px-3 py-2.5 text-xs font-inter font-black uppercase tracking-widest border-2 transition-all",
                      cartoonStance === s.value ? s.color + " shadow-md" : "border-black/10 text-black/40 hover:border-black/30"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const stancePrompt = cartoonStance === "neutral" ? "" :
                  cartoonStance === "pro-india" ? " (from a pro-India, nationalist perspective)" :
                  cartoonStance === "pro-usa" ? " (from a pro-USA, Western alliance perspective)" :
                  cartoonStance === "pro-iran" ? " (from a pro-Iran, anti-Western perspective)" : "";
                handleGenerate(topic + stancePrompt, "cartoon");
              }}
              disabled={generating}
              className="w-full py-4 bg-primary text-white font-inter font-black text-xs uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Cartoon...</> : <><Sparkles className="w-4 h-4" /> 🎨 Generate Cartoon + Image</>}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-500 text-sm font-inter text-red-700">
          {error}
        </div>
      )}

      {/* ── Inline Result Preview ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* ── TOP ACTION BAR — Publish / Save Draft ── */}
          <div className="flex gap-3 flex-wrap">
            {!published && !result.savedId && result.headline && (
              <button
                onClick={async () => {
                  setPublishing(true);
                  try {
                    const saveRes = await fetch("/api/post/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: result.headline,
                        titleHi: result.headlineHi || "",
                        summary: result.summary || "",
                        content: result.content || "",
                        category: category,
                        author: author.split(" — ")[0],
                        imageUrl: result.imageUrl || "",
                        language: language,
                        status: "draft",
                      }),
                    });
                    const saveData = await saveRes.json();
                    if (saveData.id || saveData.savedId) {
                      setResult({ ...result, savedId: saveData.id || saveData.savedId, savedSlug: saveData.slug ? `${saveData.category}/${saveData.slug}` : undefined });
                      setError("");
                    } else {
                      alert("Save failed: " + (saveData.error || "Unknown error"));
                    }
                  } catch (err) { alert("Save failed: " + String(err)); }
                  setPublishing(false);
                }}
                disabled={publishing}
                className="flex-1 py-4 bg-red-600 text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save as Draft
              </button>
            )}
            {!published && result.savedId && (
              <button
                onClick={async () => {
                  setPublishing(true);
                  try {
                    const res = await fetch("/api/admin/publish", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: result.savedId }),
                    });
                    const data = await res.json();
                    if (data.success) setPublished(true);
                    else alert("Publish failed: " + (data.error || "Unknown error"));
                  } catch (err) { alert("Publish failed: " + String(err)); }
                  setPublishing(false);
                }}
                disabled={publishing}
                className="flex-1 py-4 bg-red-600 text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Publish Now
              </button>
            )}
            {published && (
              <div className="flex-1 py-4 bg-green-600 text-white font-inter font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Published to Website!
                {result.savedId && <a href={result.savedSlug ? `/${result.savedSlug}` : `/blog/${result.savedId}`} target="_blank" className="underline ml-2 text-white/80">View →</a>}
              </div>
            )}
            <button
              onClick={() => { setResult(null); setExtraImages([]); setPublished(false); }}
              className="px-6 py-4 border-2 border-black/20 font-inter font-black text-sm uppercase tracking-widest hover:bg-black/5"
            >
              Create Another
            </button>
          </div>

          {/* Info banner with inline publish */}
          <div className={cn("border p-4 flex items-center gap-3 flex-wrap", published ? "bg-blue-50 border-blue-300" : result.savedId ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300")}>
            <CheckCircle2 className={cn("w-5 h-5 shrink-0", published ? "text-blue-600" : result.savedId ? "text-green-600" : "text-amber-600")} />
            <div className="flex-1">
              <p className="text-xs font-inter font-black uppercase tracking-widest">
                {published ? "Published!" : result.savedId ? "Article Generated — Draft" : "Article Generated — Not Saved"}
              </p>
              <p className="text-[10px] font-inter opacity-60 mt-0.5">
                ID: {result.savedId || "—"} · By: {author.split(" — ")[0]} · {wordCount} words
              </p>
            </div>
            {/* Inline Publish/Save button */}
            {!published && !result.savedId && result.headline && (
              <button
                onClick={async () => {
                  setPublishing(true);
                  try {
                    const saveRes = await fetch("/api/post/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: result.headline,
                        titleHi: result.headlineHi || "",
                        summary: result.summary || "",
                        content: result.content || "",
                        category: category,
                        author: author.split(" — ")[0],
                        imageUrl: result.imageUrl || "",
                        language: language,
                        status: "published",
                      }),
                    });
                    const saveData = await saveRes.json();
                    if (saveData.id || saveData.savedId) {
                      setResult({ ...result, savedId: saveData.id || saveData.savedId, savedSlug: saveData.slug ? `${saveData.category}/${saveData.slug}` : undefined });
                      setPublished(true);
                    } else {
                      alert("Save failed: " + (saveData.error || "Unknown error"));
                    }
                  } catch (err) { alert("Save failed: " + String(err)); }
                  setPublishing(false);
                }}
                disabled={publishing}
                className="px-6 py-3 bg-red-600 text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Now
              </button>
            )}
            {!published && result.savedId && (
              <button
                onClick={async () => {
                  setPublishing(true);
                  try {
                    const res = await fetch("/api/admin/publish", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: result.savedId }),
                    });
                    const data = await res.json();
                    if (data.success) setPublished(true);
                    else alert("Publish failed: " + (data.error || "Unknown error"));
                  } catch (err) { alert("Publish failed: " + String(err)); }
                  setPublishing(false);
                }}
                disabled={publishing}
                className="px-6 py-3 bg-red-600 text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Now
              </button>
            )}
          </div>

          {/* Article preview card */}
          <div className="bg-white border-2 border-black overflow-hidden">
            {/* Image(s) with regenerate */}
            {(result.hasImage || result.imageUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Primary image */}
                <div className="relative group bg-black/5 aspect-video flex items-center justify-center overflow-hidden">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="AI generated" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon className="w-12 h-12 text-black/20 mx-auto mb-2" />
                      <p className="text-[9px] font-inter opacity-40">AI Image Generated</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleRegenerateImage(0)}
                    disabled={regeneratingImage === 0}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 text-white text-[8px] font-inter font-black uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                  >
                    {regeneratingImage === 0 ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    🎨 Regenerate Image
                  </button>
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[8px] font-inter font-black uppercase">Image 1</span>
                </div>

                {/* Second image (for long articles) */}
                {wordCount >= 2000 && (
                  <div className="relative group bg-black/5 aspect-video flex items-center justify-center overflow-hidden">
                    {extraImages[0] ? (
                      <img src={extraImages[0]} alt="AI generated 2" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-8">
                        <ImageIcon className="w-12 h-12 text-black/20 mx-auto mb-2" />
                        <p className="text-[9px] font-inter opacity-40">{generating ? "Generating..." : "Click to generate"}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleRegenerateImage(1)}
                      disabled={regeneratingImage === 1}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 text-white text-[8px] font-inter font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                    >
                      {regeneratingImage === 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {extraImages[0] ? "Regenerate" : "Generate"}
                    </button>
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[8px] font-inter font-black uppercase">Image 2</span>
                  </div>
                )}
              </div>
            )}

            {/* Editable Content Preview */}
            <div className="p-6 space-y-4">
              <span className="text-[9px] font-inter font-black uppercase tracking-widest text-primary">{category}</span>

              {/* Editable Headline */}
              <div className="group relative">
                <p className="text-[7px] font-inter font-black uppercase tracking-widest opacity-30 mb-1">Headline (click to edit)</p>
                <textarea
                  value={result.headline || ""}
                  onChange={e => setResult({ ...result, headline: e.target.value })}
                  className="w-full text-2xl md:text-3xl font-newsreader font-black leading-tight bg-transparent border-b-2 border-transparent hover:border-primary/30 focus:border-primary outline-none resize-none"
                  rows={2}
                />
              </div>

              {/* Editable Hindi Headline */}
              {(language === "hi" || result.headlineHi) && (
                <div>
                  <p className="text-[7px] font-inter font-black uppercase tracking-widest opacity-30 mb-1">Hindi Headline</p>
                  <textarea
                    value={result.headlineHi || ""}
                    onChange={e => setResult({ ...result, headlineHi: e.target.value })}
                    className="w-full text-lg font-newsreader text-[var(--nyt-gray)] leading-tight bg-transparent border-b-2 border-transparent hover:border-primary/30 focus:border-primary outline-none resize-none hindi"
                    rows={1}
                  />
                </div>
              )}

              {/* Editable Summary */}
              <div>
                <p className="text-[7px] font-inter font-black uppercase tracking-widest opacity-30 mb-1">Summary</p>
                <textarea
                  value={result.summary || ""}
                  onChange={e => setResult({ ...result, summary: e.target.value })}
                  className="w-full text-sm font-inter leading-relaxed text-[var(--nyt-gray)] border-l-4 border-primary pl-4 bg-transparent border-b-2 border-b-transparent hover:border-b-primary/30 focus:border-b-primary outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 text-[9px] font-inter font-black uppercase tracking-widest opacity-40 pt-2 border-t border-black/10">
                <span>By {author.split(" — ")[0]}</span>
                <span>·</span>
                <span>{new Date().toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span>·</span>
                <span>{Math.ceil(wordCount / 200)} min read</span>
              </div>

              {/* Full article — editable as plain text */}
              {result.content && (
                <div className="mt-6 border-t-2 border-black pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40">Article Content — Editable</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResult({ ...result, _editMode: result._editMode === "html" ? "preview" : "html" })}
                        className="px-2 py-1 text-[8px] font-inter font-black uppercase border border-black/20 hover:bg-black hover:text-white"
                      >
                        {result._editMode === "html" ? "Preview" : "Edit Text"}
                      </button>
                    </div>
                  </div>
                  {result._editMode === "html" ? (
                    <textarea
                      value={result.content.replace(/<[^>]+>/g, (tag: string) => {
                        if (tag === "<p>") return "\n";
                        if (tag === "</p>") return "";
                        if (tag === "<br>" || tag === "<br/>") return "\n";
                        if (tag.startsWith("<h")) return "\n## ";
                        if (tag.startsWith("</h")) return "\n";
                        if (tag.startsWith("<blockquote")) return "\n> ";
                        if (tag === "</blockquote>") return "\n";
                        if (tag === "<li>") return "\n• ";
                        if (tag === "</li>") return "";
                        return "";
                      }).trim()}
                      onChange={e => {
                        const html = e.target.value
                          .split("\n")
                          .map(line => {
                            const trimmed = line.trim();
                            if (!trimmed) return "";
                            if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
                            if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
                            if (trimmed.startsWith("• ")) return `<li>${trimmed.slice(2)}</li>`;
                            return `<p>${trimmed}</p>`;
                          })
                          .join("");
                        setResult({ ...result, content: html });
                      }}
                      className="w-full font-inter text-sm leading-relaxed border-2 border-black/10 p-4 outline-none focus:border-primary resize-y min-h-[300px]"
                      rows={15}
                    />
                  ) : (
                    <div
                      className="post-content newspaper-text max-w-none text-justify font-newsreader text-base leading-[1.8]"
                      style={{ textAlign: "justify", hyphens: "auto", columns: "2", columnGap: "2rem", columnRule: "1px solid #e5e5e5" }}
                      dangerouslySetInnerHTML={{ __html: result.content }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BulkGeneratePanel() {
  const allSections = ["India", "World", "Politics", "Geopolitics", "Economy", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Lok Post"];
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(["India", "Politics", "Economy", "Sports", "Tech"]));
  const [articlesPerSection, setArticlesPerSection] = useState(2);
  const [wordCount, setWordCount] = useState(1500);
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("neutral");
  const [author, setAuthor] = useState("LoktantraVani AI");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ section: string; topic: string; pct: number; completed: number; total: number } | null>(null);
  const [log, setLog] = useState<{ type: string; section?: string; headline?: string; topic?: string; message?: string; savedId?: string }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);

  const [agentAuthorsList, setAgentAuthorsList] = useState<{ name: string; designation: string }[]>([]);
  useEffect(() => {
    fetch("/api/admin/authors").then(r => r.json()).then(d => {
      const list = (d.authors || [])
        .map((a: Record<string, unknown>) => ({ name: (a.name as string) || "", designation: (a.designation as string) || "" }))
        .filter((a: { name: string }) => a.name)
        .filter((a: { name: string }, i: number, arr: { name: string }[]) => arr.findIndex(x => x.name === a.name) === i); // dedupe
      setAgentAuthorsList(list);
    }).catch(() => {});
  }, []);
  const authors = [
    "LoktantraVani AI",
    ...agentAuthorsList.map(a => a.name),
  ];

  const toggleSection = (s: string) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const selectAll = () => setSelectedSections(new Set(allSections));
  const selectNone = () => setSelectedSections(new Set());

  const totalArticles = selectedSections.size * articlesPerSection;
  const estimatedMinutes = Math.ceil(totalArticles * 0.5); // ~30s per article

  const startBulk = async () => {
    if (selectedSections.size === 0) return;
    setRunning(true);
    setLog([]);
    setProgress(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    setTimerRef(timer);

    try {
      const res = await fetch("/api/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: [...selectedSections],
          count: articlesPerSection,
          wordCount,
          language,
          tone,
          author,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "progress" || msg.type === "done") {
              setProgress({ section: msg.section, topic: msg.topic || msg.headline, pct: msg.pct || 0, completed: msg.completed || 0, total: msg.totalArticles || totalArticles });
            }
            if (msg.type === "done" || msg.type === "error") {
              setLog(prev => [...prev, msg]);
            }
            if (msg.type === "complete") {
              setProgress({ section: "Done!", topic: `${msg.completed} articles generated, ${msg.errors} errors`, pct: 100, completed: msg.completed, total: msg.totalArticles });
            }
          } catch { /* skip bad JSON */ }
        }
      }
    } catch (err) {
      setLog(prev => [...prev, { type: "error", message: String(err) }]);
    }

    if (timerRef) clearInterval(timerRef);
    clearInterval(timer);
    setRunning(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          <Rss className="w-8 h-8 text-primary" /> Bulk Article Generator
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Generate multiple AI articles across all sections at once
        </p>
      </div>

      {/* Section Selection */}
      <div className="bg-white border-2 border-black p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest">Select Sections</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1 text-[8px] font-inter font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white">All</button>
            <button onClick={selectNone} className="px-3 py-1 text-[8px] font-inter font-black uppercase tracking-widest border border-black hover:bg-black hover:text-white">None</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allSections.map(s => (
            <button
              key={s}
              onClick={() => toggleSection(s)}
              className={cn(
                "px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest border-2 transition-colors",
                selectedSections.has(s)
                  ? "bg-black text-white border-black"
                  : "border-black/20 text-black/40 hover:border-black"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Articles / Section</label>
          <select value={articlesPerSection} onChange={e => setArticlesPerSection(Number(e.target.value))} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value={1}>1 article</option>
            <option value={2}>2 articles</option>
            <option value={3}>3 articles</option>
            <option value={5}>5 articles</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Word Count</label>
          <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value={500}>Short (~500)</option>
            <option value={1500}>Standard (~1500)</option>
            <option value={2000}>Long (~2000)</option>
            <option value={2500}>Deep Dive (~2500)</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bilingual">Bilingual</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Tone</label>
          <select value={tone} onChange={e => setTone(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value="neutral">Neutral</option>
            <option value="nationalist">Nationalist</option>
            <option value="analytical">Analytical</option>
            <option value="pro-bjp">Pro-BJP / NDA</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Author</label>
          <select value={author} onChange={e => setAuthor(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            {authors.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Summary + Start */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <div>
          <p className="text-lg font-newsreader font-black">
            {totalArticles} articles across {selectedSections.size} sections
          </p>
          <p className="text-[9px] font-inter opacity-40">
            Estimated time: ~{estimatedMinutes} min · Saved as drafts · Go to All Posts to publish
          </p>
        </div>
        <button
          onClick={startBulk}
          disabled={running || selectedSections.size === 0}
          className="w-full py-4 bg-black text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-3 disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {running ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating... {formatTime(elapsed)}</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Start Bulk Generation</>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="bg-white border-2 border-black p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-inter font-black">{progress.section}</p>
              <p className="text-[9px] font-inter opacity-50 mt-0.5">{progress.topic}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-newsreader font-black text-primary">{progress.pct}%</p>
              <p className="text-[9px] font-inter opacity-40">{progress.completed}/{progress.total} · {formatTime(elapsed)}</p>
            </div>
          </div>
          <div className="h-3 bg-black/5 relative overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Live Log */}
      {log.length > 0 && (
        <div className="bg-white border-2 border-black p-4 max-h-80 overflow-y-auto space-y-1">
          <h3 className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mb-2">Generation Log</h3>
          {log.map((entry, i) => (
            <div key={i} className={cn("text-xs font-inter py-1 border-b border-black/5 flex items-start gap-2", entry.type === "error" ? "text-red-600" : "")}>
              <span className="shrink-0">{entry.type === "done" ? "✅" : "❌"}</span>
              <span className="font-bold">[{entry.section}]</span>
              <span className="flex-1">{entry.headline || entry.topic || entry.message}</span>
              {entry.savedId && <span className="text-[8px] font-mono opacity-30">{entry.savedId.slice(0, 8)}...</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LokPostCardPanel() {
  const EDITIONS = [
    { id: "bharat", label: "🇮🇳 Bharat" },
    { id: "india", label: "🏛️ National" },
    { id: "kerala", label: "🌴 Kerala" },
    { id: "ne", label: "🏔️ Northeast" },
    { id: "bengal", label: "🎭 Bengal" },
    { id: "bihar", label: "📿 Bihar" },
  ];
  const TONES = [
    { id: "neutral", label: "Neutral" },
    { id: "positive", label: "Positive India" },
    { id: "analytical", label: "Analytical" },
    { id: "satire", label: "Satire" },
  ];

  const [edition, setEdition] = useState("bharat");
  const [tone, setTone] = useState("neutral");
  const [language, setLanguage] = useState("en");
  const [topics, setTopics] = useState(["", "", "", ""]);
  const [generating, setGenerating] = useState(false);
  const [cardHtml, setCardHtml] = useState("");
  const [trending, setTrending] = useState<string[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [cards, setCards] = useState<{ html: string; edition: string; date: string }[]>([]);
  const [lokTab, setLokTab] = useState<"card" | "cartoon">("card");
  const [cartoonTopic, setCartoonTopic] = useState("");
  const [cartoonTagline, setCartoonTagline] = useState("");
  const [cartoonStance, setCartoonStance] = useState("neutral");
  const [cartoonGenerating, setCartoonGenerating] = useState(false);
  const [cartoonResult, setCartoonResult] = useState<{ imageUrl?: string; headline?: string; summary?: string; savedId?: string } | null>(null);

  const EDITION_SEARCH: Record<string, string> = {
    bharat: "India positive news today BJP development Modi pib.gov.in",
    india: "India national news today breaking headlines NDTV",
    kerala: "Kerala news today Thiruvananthapuram development",
    ne: "Northeast India news today Assam Manipur Meghalaya development",
    bengal: "West Bengal news today Kolkata TMC BJP development",
    bihar: "Bihar news today Patna NDA JDU BJP development",
  };

  const fetchTrending = useCallback(async () => {
    setLoadingTrending(true);
    setTrending([]);
    try {
      // Use agent-generate search endpoint with Gemini
      const searchQuery = EDITION_SEARCH[edition] || EDITION_SEARCH.bharat;
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "trending-topics",
          topic: searchQuery,
          category: edition,
        }),
      });
      const data = await res.json();
      if (data.topics) setTrending(data.topics.slice(0, 12));
    } catch { /* */ }
    setLoadingTrending(false);
  }, [edition]);

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  const generateCard = async () => {
    const validTopics = topics.filter(t => t.trim());
    if (validTopics.length === 0) { alert("Add at least 1 topic"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/lok-post/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edition, tone, language,
          stories: validTopics.map(t => ({ topic: t })),
        }),
      });
      const data = await res.json();
      if (data.html) {
        setCardHtml(data.html);
        setCards(prev => [{ html: data.html, edition, date: new Date().toISOString() }, ...prev].slice(0, 10));
      } else {
        alert("Generation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) { alert("Error: " + String(err)); }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">📰 Lok Post Card Studio</h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Generate 2×2 newspaper cards — daily edition cards with AI images
        </p>
      </div>

      {/* Config Row */}
      <div className="bg-white border-2 border-black p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Edition</label>
            <div className="flex flex-wrap gap-1.5">
              {EDITIONS.map(e => (
                <button key={e.id} onClick={() => setEdition(e.id)}
                  className={cn("px-2 py-1 text-[9px] font-inter font-bold border-2 transition-all",
                    edition === e.id ? "bg-black text-white border-black" : "border-black/15 hover:border-black text-black"
                  )}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={cn("px-2 py-1 text-[9px] font-inter font-bold border-2 transition-all",
                    tone === t.id ? "bg-primary text-white border-primary" : "border-black/15 hover:border-black text-black"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Language</label>
            <div className="flex gap-1.5">
              {[{id:"en",l:"English"},{id:"hi",l:"हिन्दी"}].map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)}
                  className={cn("px-2 py-1 text-[9px] font-inter font-bold border-2 transition-all",
                    language === l.id ? "bg-black text-white border-black" : "border-black/15 hover:border-black text-black"
                  )}>
                  {l.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white border-2 border-black p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-inter font-black uppercase tracking-widest">🔥 Trending — Click to Fill Slots</h3>
          <button onClick={fetchTrending} disabled={loadingTrending} className="text-[8px] font-inter font-black uppercase border border-black px-2 py-1 hover:bg-black hover:text-white disabled:opacity-50">
            {loadingTrending ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {trending.map((t, i) => (
            <button key={i} onClick={() => {
              const emptyIdx = topics.findIndex(tp => !tp.trim());
              if (emptyIdx >= 0) setTopics(prev => prev.map((p, j) => j === emptyIdx ? t : p));
              else setTopics(prev => [...prev.slice(1), t]);
            }}
              className="px-2.5 py-1 text-[9px] font-inter font-bold border border-black/15 hover:border-black hover:bg-black/5 text-black transition-all"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Topic Slots */}
      <div className="bg-white border-2 border-black p-4 space-y-3">
        <h3 className="text-xs font-inter font-black uppercase tracking-widest">4 News Stories (2×2 Grid)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map((t, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center bg-black text-white text-[10px] font-inter font-black flex-shrink-0">{i + 1}</span>
              <input
                value={t}
                onChange={e => setTopics(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                placeholder={`Story ${i + 1}...`}
                className="flex-1 border-2 border-black p-2 text-[11px] font-inter outline-none placeholder:opacity-30"
              />
              {t && <button onClick={() => setTopics(prev => prev.map((p, j) => j === i ? "" : p))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
            </div>
          ))}
        </div>

        {/* Auto-fill from trending */}
        {trending.length > 0 && topics.every(t => !t.trim()) && (
          <button
            onClick={() => setTopics(trending.slice(0, 4).map(t => t))}
            className="w-full py-2 border-2 border-primary text-primary font-inter font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white flex items-center justify-center gap-2"
          >
            Auto-fill top 4 trending stories
          </button>
        )}

        <button
          onClick={generateCard}
          disabled={generating || topics.every(t => !t.trim())}
          className="w-full py-4 bg-black text-white font-inter font-black text-sm uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(255,153,51,1)]"
        >
          {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Card...</> : <><Sparkles className="w-5 h-5" /> Generate 2×2 Lok Post Card</>}
        </button>

        {topics.every(t => !t.trim()) && !generating && (
          <p className="text-[9px] font-inter text-center text-red-500 font-bold">Fill at least 1 story above or click a trending topic to enable generation</p>
        )}
      </div>

      {/* Card Preview */}
      {cardHtml && (
        <div className="bg-white border-2 border-black p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-inter font-black uppercase tracking-widest">Generated Card</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([cardHtml], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `lokpost-${edition}-${Date.now()}.html`; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 border-2 border-black text-[8px] font-inter font-black uppercase hover:bg-black hover:text-white flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download HTML
              </button>
            </div>
          </div>
          <iframe srcDoc={cardHtml} className="w-full h-[500px] border-2 border-black" title="Lok Post Card" />
        </div>
      )}

      {/* History */}
      {cards.length > 1 && (
        <div className="bg-white border-2 border-black p-4">
          <h3 className="text-xs font-inter font-black uppercase tracking-widest mb-3">Recent Cards ({cards.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.slice(1).map((c, i) => (
              <div key={i} className="border border-black/10 cursor-pointer hover:border-black" onClick={() => setCardHtml(c.html)}>
                <iframe srcDoc={c.html} className="w-full h-[200px] pointer-events-none" title={`Card ${i}`} />
                <div className="px-2 py-1 bg-black/5 text-[7px] font-inter uppercase tracking-widest">
                  {c.edition} · {new Date(c.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CartoonMandalaPanel() {
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("political-satire");
  const [section, setSection] = useState("Lok Post");
  const [generating, setGenerating] = useState(false);
  const [cartoons, setCartoons] = useState<{ headline: string; caption: string; imageUrl: string; savedId: string }[]>([]);
  const [bulkTopics, setBulkTopics] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [error, setError] = useState("");
  const [trending, setTrending] = useState<string[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [selectedTrending, setSelectedTrending] = useState<Set<string>>(new Set());

  const sections = ["Lok Post", "India", "Politics", "Economy", "Sports", "Tech", "Defence", "West Asia", "Opinion"];

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch("/api/trending");
      const data = await res.json();
      setTrending((data.topics || []).slice(0, 12));
    } catch { /* */ }
    setLoadingTrending(false);
  };

  useEffect(() => { fetchTrending(); }, []);

  const generateCartoon = async (cartoonTopic: string) => {
    const res = await fetch("/api/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cartoon", topic: context ? `${cartoonTopic}. Context: ${context}` : cartoonTopic, category: section, style }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      headline: data.result?.headline || cartoonTopic,
      caption: data.result?.caption || data.result?.summary || "",
      imageUrl: data.result?.imageUrl || "",
      savedId: data.savedId || "",
    };
  };

  const handleGenerate = async () => {
    if (!topic) { setError("Enter a topic"); return; }
    setGenerating(true);
    setError("");
    try {
      const cartoon = await generateCartoon(topic);
      setCartoons(prev => [cartoon, ...prev]);
    } catch (err) {
      setError(String(err));
    }
    setGenerating(false);
  };

  const handleBulkGenerate = async () => {
    const topics = bulkTopics.split("\n").map(t => t.trim()).filter(Boolean);
    if (topics.length === 0) { setError("Enter topics (one per line)"); return; }
    setBulkGenerating(true);
    setBulkProgress(0);
    setError("");
    for (let i = 0; i < topics.length; i++) {
      try {
        const cartoon = await generateCartoon(topics[i]);
        setCartoons(prev => [cartoon, ...prev]);
      } catch { /* skip failures */ }
      setBulkProgress(Math.round(((i + 1) / topics.length) * 100));
    }
    setBulkGenerating(false);
  };

  const shareToX = (headline: string) => {
    const text = encodeURIComponent(`${headline}\n\n— LoktantraVani | India's 1st AI Newspaper\nhttps://loktantravani.vercel.app`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToWhatsApp = (headline: string) => {
    const text = encodeURIComponent(`*${headline}*\n\n— LoktantraVani | India's 1st AI Newspaper\nhttps://loktantravani.vercel.app`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          🎨 Lok Post Studio
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Generate AI cartoons with captions — share to X & WhatsApp
        </p>
      </div>

      {/* Trending News — select multiple + generate */}
      <div className="bg-white border-2 border-black p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest">🔥 Trending Now — Select Topics</h3>
          <div className="flex gap-2">
            {selectedTrending.size > 0 && (
              <button
                onClick={() => setSelectedTrending(new Set())}
                className="text-[8px] font-inter font-black uppercase border border-black px-2 py-1 hover:bg-black hover:text-white"
              >
                Clear ({selectedTrending.size})
              </button>
            )}
            <button onClick={fetchTrending} disabled={loadingTrending} className="text-[8px] font-inter font-black uppercase border border-black px-2 py-1 hover:bg-black hover:text-white disabled:opacity-50">
              {loadingTrending ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
        {trending.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {trending.map((t, i) => {
                const isSelected = selectedTrending.has(t);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTrending(prev => {
                        const next = new Set(prev);
                        if (next.has(t)) next.delete(t); else next.add(t);
                        return next;
                      });
                      setTopic(t);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-[9px] font-inter font-bold border-2 transition-all",
                      isSelected ? "bg-black text-white border-black" :
                      topic === t ? "bg-primary/20 text-black border-primary" : "border-black/15 hover:border-black text-black"
                    )}
                  >
                    {isSelected && "✓ "}{t}
                  </button>
                );
              })}
            </div>
            {selectedTrending.size >= 1 && (
              <button
                onClick={async () => {
                  const topics = [...selectedTrending];
                  setBulkGenerating(true);
                  setBulkProgress(0);
                  setError("");
                  for (let i = 0; i < topics.length; i++) {
                    try {
                      const cartoon = await generateCartoon(topics[i]);
                      setCartoons(prev => [cartoon, ...prev]);
                    } catch { /* skip */ }
                    setBulkProgress(Math.round(((i + 1) / topics.length) * 100));
                  }
                  setBulkGenerating(false);
                  setSelectedTrending(new Set());
                }}
                disabled={bulkGenerating}
                className="w-full py-3 bg-primary text-white font-inter font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {bulkProgress}%...</>
                  : <><Sparkles className="w-4 h-4" /> Generate {selectedTrending.size} Cartoon{selectedTrending.size > 1 ? "s" : ""} from Trending</>
                }
              </button>
            )}
          </>
        ) : (
          <p className="text-[9px] font-inter opacity-40">{loadingTrending ? "Searching Google for trending topics..." : "Click Refresh to load trending topics"}</p>
        )}
      </div>

      {/* Single cartoon generation */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest">Generate Cartoon</h3>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g., Budget 2026, WhatsApp University, Cricket fever..."
          className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30"
          onKeyDown={e => e.key === "Enter" && handleGenerate()}
        />
        {/* Context Box */}
        <div>
          <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Context (optional — give AI more direction)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            rows={2}
            placeholder="e.g., Focus on PM's reaction, show opposition leaders arguing, include common man perspective, highlight corruption angle..."
            className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30 resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Style</label>
            <select value={style} onChange={e => setStyle(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
              <option value="political-satire">🎯 Political Satire</option>
              <option value="rk-laxman">✏️ RK Laxman Style</option>
              <option value="sorry">😅 Sorry (Apology Satire)</option>
              <option value="pro-india">🇮🇳 Pro India</option>
              <option value="pro-bjp">🪷 Pro BJP</option>
              <option value="social-commentary">💬 Social Commentary</option>
              <option value="humor">😂 Light Humor</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Place in Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 bg-primary text-white font-inter font-black text-xs uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Cartoon...</> : <><Sparkles className="w-4 h-4" /> Generate Cartoon + Image</>}
        </button>
      </div>

      {/* Bulk cartoon generation */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest">Bulk Generate Cartoons</h3>
        <p className="text-xs font-inter opacity-60">Enter multiple topics — one per line. AI generates a cartoon for each.</p>
        <textarea
          value={bulkTopics}
          onChange={e => setBulkTopics(e.target.value)}
          placeholder={"Budget 2026 common man reaction\nCricket vs studies debate\nAI replacing politicians\nWhatsApp University graduate\nTraffic jam meditation"}
          rows={5}
          className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30 resize-y"
        />
        {bulkGenerating && (
          <div className="h-2 bg-black/5 relative overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${bulkProgress}%` }} />
          </div>
        )}
        <button
          onClick={handleBulkGenerate}
          disabled={bulkGenerating}
          className="w-full py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {bulkGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {bulkProgress}%...</> : <><Rss className="w-4 h-4" /> Generate All Cartoons</>}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border-2 border-red-500 text-sm font-inter text-red-700">{error}</div>}

      {/* Generated Cartoons Grid */}
      {cartoons.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest">Generated Cartoons ({cartoons.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cartoons.map((c, i) => (
              <div key={i} className="bg-white border-2 border-black overflow-hidden">
                {c.imageUrl && (
                  <div className="aspect-square bg-black/5">
                    <img src={c.imageUrl} alt={c.headline} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-newsreader font-black leading-snug">{c.headline}</h4>
                  <p className="text-[10px] font-inter opacity-50 italic">{c.caption}</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => shareToX(c.headline)}
                      className="flex-1 py-1.5 bg-black text-white text-[8px] font-inter font-black uppercase tracking-widest hover:opacity-80 flex items-center justify-center gap-1"
                    >
                      𝕏 Share
                    </button>
                    <button
                      onClick={() => shareToWhatsApp(c.headline)}
                      className="flex-1 py-1.5 bg-green-600 text-white text-[8px] font-inter font-black uppercase tracking-widest hover:opacity-80 flex items-center justify-center gap-1"
                    >
                      WhatsApp
                    </button>
                  </div>
                  <p className="text-[8px] font-inter opacity-30">ID: {c.savedId || "—"} · Saved as draft</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EPaperPanel() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [previewUrl, setPreviewUrl] = useState("");
  const [approved, setApproved] = useState(false);

  const SECTIONS = ["India","World","Politics","Geopolitics","Economy","Sports","Tech","Defence","Opinion","Cities","West Asia","Lok Post"];

  const fetchAllPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/admin/list-posts?status=published&limit=200");
      const data = await res.json();
      setAllPosts((data.posts || []) as Post[]);
    } catch { /* */ }
    setLoadingPosts(false);
  }, []);

  useEffect(() => { fetchAllPosts(); }, [fetchAllPosts]);

  const epaperPosts = allPosts.filter(p => (p as Post & { inEpaper?: boolean }).inEpaper);
  const nonEpaperPosts = allPosts.filter(p => !(p as Post & { inEpaper?: boolean }).inEpaper);
  const filteredNonEpaper = sectionFilter === "all" ? nonEpaperPosts : nonEpaperPosts.filter(p => p.category === sectionFilter);

  // Group ePaper posts by section
  const epaperBySection: Record<string, Post[]> = {};
  for (const p of epaperPosts) {
    const cat = p.category || "General";
    if (!epaperBySection[cat]) epaperBySection[cat] = [];
    epaperBySection[cat].push(p);
  }

  const toggleEpaper = async (post: Post, add: boolean) => {
    try {
      await fetch("/api/admin/update-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, inEpaper: add }),
      });
      setAllPosts(prev => prev.map(p => p.id === post.id ? { ...p, inEpaper: add } as Post : p));
    } catch { /* */ }
  };

  const generatePreview = () => {
    setPreviewUrl(`/api/admin/epaper-pdf?date=${selectedDate}&t=${Date.now()}`);
  };

  const approveEdition = async () => {
    setApproved(true);
    // The E-Paper is already live at /api/admin/epaper-pdf — approval just confirms
    alert("E-Paper edition approved! It will appear at /daily and /epaper for readers.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">E-Paper Editor</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            Add articles section-wise → live preview → approve & publish
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border-2 border-black px-3 py-2 text-[10px] font-inter outline-none" />
          <button onClick={fetchAllPosts} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase hover:bg-black hover:text-white flex items-center gap-1">
            <RefreshCw className={cn("w-3 h-3", loadingPosts && "animate-spin")} /> Refresh
          </button>
          <button
            onClick={async () => {
              // AI Pick: auto-select top articles per section (max 2 per section, prioritize today)
              const today = new Date(selectedDate);
              const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
              const todayStr = today.toISOString().split("T")[0];
              const yesterdayStr = yesterday.toISOString().split("T")[0];

              // Score: today=10, yesterday=5, older=1; then pick top per section
              const scored = nonEpaperPosts.map(p => {
                const created = (p as Post & { createdAt?: string }).createdAt || "";
                const dateStr = created ? new Date(created).toISOString().split("T")[0] : "";
                const score = dateStr === todayStr ? 10 : dateStr === yesterdayStr ? 5 : 1;
                return { post: p, score };
              }).sort((a, b) => b.score - a.score);

              // Pick max 2 per section, max 12 total
              const picked: Post[] = [];
              const sectionCount: Record<string, number> = {};
              for (const { post } of scored) {
                if (picked.length >= 12) break;
                const cat = post.category || "General";
                if ((sectionCount[cat] || 0) >= 2) continue;
                sectionCount[cat] = (sectionCount[cat] || 0) + 1;
                picked.push(post);
              }

              // Add all picked to E-Paper
              for (const p of picked) {
                await toggleEpaper(p, true);
              }
              alert(`AI picked ${picked.length} articles from ${Object.keys(sectionCount).length} sections`);
            }}
            className="px-3 py-2 bg-primary text-white text-xs font-inter font-black uppercase hover:opacity-90 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> AI Pick
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border-2 border-black p-4 text-center">
          <div className="text-2xl font-newsreader font-black">{epaperPosts.length}</div>
          <div className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40">In E-Paper</div>
        </div>
        <div className="bg-white border-2 border-black p-4 text-center">
          <div className="text-2xl font-newsreader font-black">{Object.keys(epaperBySection).length}</div>
          <div className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40">Sections</div>
        </div>
        <div className="bg-white border-2 border-black p-4 text-center">
          <div className="text-2xl font-newsreader font-black">{Math.ceil(epaperPosts.length / 3) + 1}</div>
          <div className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40">Est. Pages</div>
        </div>
        <div className="bg-white border-2 border-black p-4 text-center">
          <div className="text-2xl font-newsreader font-black">{nonEpaperPosts.length}</div>
          <div className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40">Available</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Article Picker */}
        <div className="col-span-5 space-y-3">
          <div className="bg-white border-2 border-black p-4">
            <h3 className="text-xs font-inter font-black uppercase tracking-widest mb-3">📰 E-Paper Articles ({epaperPosts.length})</h3>
            {Object.keys(epaperBySection).length === 0 ? (
              <p className="text-[9px] font-inter opacity-40 py-6 text-center">No articles added yet. Add from the list below.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {SECTIONS.filter(s => epaperBySection[s]?.length).map(sec => (
                  <div key={sec}>
                    <div className="text-[8px] font-inter font-black uppercase tracking-widest text-primary mb-1">{sec} ({epaperBySection[sec].length})</div>
                    {epaperBySection[sec].map(p => (
                      <div key={p.id} className="flex items-center gap-2 py-1 border-b border-black/5">
                        <span className="text-[9px] font-inter flex-1 truncate">{p.title}</span>
                        <button onClick={() => toggleEpaper(p, false)} className="text-[7px] font-inter font-black uppercase text-red-500 hover:text-red-700 flex-shrink-0">✕ Remove</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available articles */}
          <div className="bg-white border-2 border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-inter font-black uppercase tracking-widest">Available Articles</h3>
              <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="border border-black px-2 py-1 text-[8px] font-inter font-black uppercase outline-none">
                <option value="all">All Sections</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {loadingPosts ? (
              <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-20" /></div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredNonEpaper.length === 0 ? (
                  <p className="text-[9px] font-inter opacity-40 py-4 text-center">No articles available{sectionFilter !== "all" ? ` in ${sectionFilter}` : ""}.</p>
                ) : filteredNonEpaper.map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-black/5 hover:bg-primary/5">
                    <span className="bg-primary/10 text-primary px-1 py-0.5 text-[7px] font-inter font-black uppercase flex-shrink-0">{p.category}</span>
                    <span className="text-[9px] font-inter flex-1 truncate">{p.title}</span>
                    <button onClick={() => toggleEpaper(p, true)} className="text-[7px] font-inter font-black uppercase text-green-600 hover:text-green-800 flex-shrink-0 px-1 py-0.5 border border-green-300 hover:bg-green-50">+ Add</button>
                  </div>
                ))}
              </div>
            )}
            {/* Quick add all from section */}
            {sectionFilter !== "all" && filteredNonEpaper.length > 0 && (
              <button
                onClick={async () => {
                  for (const p of filteredNonEpaper) await toggleEpaper(p, true);
                }}
                className="w-full mt-2 py-2 bg-black text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-primary"
              >
                Add All {filteredNonEpaper.length} {sectionFilter} Articles
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview + Actions */}
        <div className="col-span-7 space-y-3">
          <div className="bg-white border-2 border-black p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-inter font-black uppercase tracking-widest">Live Preview</h3>
              <div className="flex gap-2">
                <button onClick={generatePreview} disabled={generating || epaperPosts.length === 0} className="px-4 py-2 bg-black text-white text-[8px] font-inter font-black uppercase tracking-widest hover:bg-primary disabled:opacity-50 flex items-center gap-1">
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} Preview
                </button>
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border-2 border-black text-[8px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-1">
                    ↗ Full Screen
                  </a>
                )}
                <a
                  href={`/api/admin/epaper-pdf?date=${selectedDate}&download=true`}
                  className="px-4 py-2 border-2 border-black text-[8px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download PDF
                </a>
                <button
                  onClick={approveEdition}
                  disabled={epaperPosts.length === 0 || approved}
                  className={cn(
                    "px-4 py-2 text-[8px] font-inter font-black uppercase tracking-widest flex items-center gap-1",
                    approved ? "bg-green-600 text-white" : "bg-primary text-white hover:opacity-90 disabled:opacity-50"
                  )}
                >
                  {approved ? <><CheckCircle className="w-3 h-3" /> Approved</> : <><CheckCircle className="w-3 h-3" /> Approve & Publish</>}
                </button>
              </div>
            </div>

            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-[600px] border-2 border-black" title="E-Paper Preview" />
            ) : (
              <div className="bg-black/5 border-2 border-dashed border-black/20 h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Newspaper className="w-16 h-16 text-black/10 mx-auto mb-4" />
                  <p className="text-sm font-newsreader font-bold italic opacity-30">Add articles and click &quot;Preview&quot;</p>
                  <p className="text-[9px] font-inter opacity-20 mt-1">{epaperPosts.length} articles in {Object.keys(epaperBySection).length} sections</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvertisementPanel() {
  type Ad = { id: string; title: string; size: string; imageUrl: string; link: string; brand: string; active: boolean; priority: number; placement: string; content: string };
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", brand: "", size: "banner-728x90", link: "", imageUrl: "", content: "", priority: 5, placement: "between-articles",
    location: "pan-india", selectedStates: [] as string[],
  });
  const adFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const AD_SIZES = [
    { id: "banner-728x90", label: "Banner (728×90)", w: 728, h: 90 },
    { id: "leaderboard-970x90", label: "Leaderboard (970×90)", w: 970, h: 90 },
    { id: "rectangle-300x250", label: "Medium Rectangle (300×250)", w: 300, h: 250 },
    { id: "skyscraper-160x600", label: "Skyscraper (160×600)", w: 160, h: 600 },
    { id: "square-250x250", label: "Square (250×250)", w: 250, h: 250 },
    { id: "halfpage-300x600", label: "Half Page (300×600)", w: 300, h: 600 },
    { id: "fullwidth-1200x200", label: "Full Width (1200×200)", w: 1200, h: 200 },
  ];

  const PLACEMENTS = [
    { id: "between-articles", label: "Between Articles" },
    { id: "epaper-only", label: "E-Paper Only" },
    { id: "sidebar", label: "Sidebar" },
    { id: "homepage-banner", label: "Homepage Banner" },
    { id: "all", label: "All Placements" },
  ];

  const LOCATIONS = [
    { id: "pan-india", label: "Pan India" },
    { id: "state", label: "Select States" },
    { id: "district", label: "Select Districts" },
  ];

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal",
  ];

  const selectedSize = AD_SIZES.find(s => s.id === form.size) || AD_SIZES[0];

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      const data = await res.json();
      setAds(data.ads || []);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadAds(); }, []);

  const resetForm = () => setForm({ title: "", brand: "", size: "banner-728x90", link: "", imageUrl: "", content: "", priority: 5, placement: "between-articles", location: "pan-india", selectedStates: [] });

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const ext = file.name.split(".").pop() || "png";
      const filename = `ads/${Date.now()}-${form.brand.replace(/[^a-z0-9]/gi, "-").slice(0, 20)}.${ext}`;
      const bucket = "loktantravani-2d159.firebasestorage.app";
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?uploadType=media`;
      const uploadRes = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "image/png" }, body: bytes });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`;
        setForm(p => ({ ...p, imageUrl: downloadUrl }));
      }
    } catch { /* */ }
    setUploading(false);
  };

  const generateAdImage = async () => {
    if (!form.brand && !form.title) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "image-only",
          topic: `Professional advertisement banner for "${form.brand || form.title}". ${form.content || "Modern clean design"}. Brand colors, logo placeholder, call to action button. ${selectedSize.w}x${selectedSize.h} aspect ratio. Commercial ad style. No text.`,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) setForm(p => ({ ...p, imageUrl: data.imageUrl }));
    } catch { /* */ }
    setGenerating(false);
  };

  const saveAd = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId || undefined, title: form.title, brand: form.brand, size: form.size, link: form.link, imageUrl: form.imageUrl, content: form.content, priority: form.priority, placement: form.placement, location: form.location, locationStates: form.selectedStates, active: true }),
      });
      await loadAds();
      setCreating(false);
      setEditingId(null);
      resetForm();
    } catch { /* */ }
    setSaving(false);
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await fetch("/api/admin/ads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadAds();
  };

  const toggleActive = async (ad: Ad) => {
    await fetch("/api/admin/ads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, title: ad.title, active: !ad.active, priority: ad.priority, placement: ad.placement, size: ad.size, brand: ad.brand, imageUrl: ad.imageUrl, link: ad.link, content: ad.content }),
    });
    loadAds();
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setCreating(true);
    setForm({ title: ad.title, brand: ad.brand, size: ad.size, link: ad.link, imageUrl: ad.imageUrl, content: ad.content, priority: ad.priority, placement: ad.placement, location: (ad as Record<string, unknown>).location as string || "pan-india", selectedStates: ((ad as Record<string, unknown>).locationStates as string[] || []) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">Advertisements</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            Create ads with AI — manage placements, priority & branding — saved to Firestore
          </p>
        </div>
        <button onClick={() => { setCreating(true); setEditingId(null); resetForm(); }} className="px-6 py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Ad
        </button>
      </div>

      {creating && (
        <div className="bg-white border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest">{editingId ? "Edit Advertisement" : "New Advertisement"}</h3>
            <button onClick={() => { setCreating(false); setEditingId(null); resetForm(); }} className="text-xs font-inter underline">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Ad Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Summer Sale Campaign" className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Brand Name</label>
              <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Tata, Reliance, Flipkart..." className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Ad Size</label>
              <select value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none">
                {AD_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Placement</label>
              <select value={form.placement} onChange={e => setForm(p => ({ ...p, placement: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none">
                {PLACEMENTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Priority (1-10)</label>
              <input type="number" min={1} max={10} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Click-through URL</label>
              <input type="url" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
          </div>

          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Ad Description / AI Prompt</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={2} placeholder="Describe the ad — product, offer, mood, colors, style..." className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30 resize-none" />
          </div>

          {/* Image: Upload / AI Generate / URL */}
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Ad Creative</label>
            <input ref={adFileRef} type="file" accept="image/*" className="hidden" onChange={handleAdImageUpload} />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => adFileRef.current?.click()} disabled={uploading} className="py-3 border-2 border-black font-inter font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : <><ImageIcon className="w-3.5 h-3.5" /> Upload Image</>}
              </button>
              <button onClick={generateAdImage} disabled={generating} className="py-3 bg-primary text-white font-inter font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Generate Poster</>}
              </button>
              <input type="text" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="Or paste image URL..." className="border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
          </div>

          {/* Location Targeting */}
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Location Targeting</label>
            <div className="flex gap-2 mb-3">
              {LOCATIONS.map(loc => (
                <button key={loc.id} onClick={() => setForm(p => ({ ...p, location: loc.id, selectedStates: loc.id === "pan-india" ? [] : p.selectedStates }))}
                  className={cn("px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest border-2 transition-colors",
                    form.location === loc.id ? "bg-black text-white border-black" : "border-black/30 text-black/70 hover:border-black bg-gray-50"
                  )}>
                  {loc.label}
                </button>
              ))}
            </div>

            {form.location !== "pan-india" && (
              <div className="flex gap-4">
                {/* India Map SVG */}
                <div className="w-48 h-56 border border-black/10 bg-[#f5f0e8] rounded-sm p-2 flex-shrink-0 relative">
                  <svg viewBox="65 5 45 45" className="w-full h-full">
                    {/* Simplified India outline */}
                    <path d="M77 10 L82 8 L88 9 L92 11 L96 10 L100 12 L103 16 L105 20 L104 24 L102 27 L100 30 L97 33 L93 36 L90 40 L87 43 L85 46 L83 48 L81 46 L80 43 L78 40 L76 37 L74 33 L73 29 L72 25 L71 21 L72 17 L74 13 Z"
                      fill={form.selectedStates.length > 0 ? "#FF993330" : "#e8dcc8"}
                      stroke="#999" strokeWidth="0.3" />
                    {/* Highlight dots for selected states */}
                    {form.selectedStates.length > 0 && (
                      <circle cx="87" cy="28" r={Math.min(form.selectedStates.length * 1.5, 12)} fill="#FF993360" stroke="#FF9933" strokeWidth="0.5" />
                    )}
                    {form.selectedStates.includes("Delhi") && <circle cx="82" cy="18" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Maharashtra") && <circle cx="79" cy="30" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Karnataka") && <circle cx="80" cy="35" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Tamil Nadu") && <circle cx="83" cy="39" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Kerala") && <circle cx="80" cy="40" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("West Bengal") && <circle cx="92" cy="25" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Uttar Pradesh") && <circle cx="84" cy="20" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Gujarat") && <circle cx="74" cy="25" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Rajasthan") && <circle cx="77" cy="20" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Bihar") && <circle cx="90" cy="22" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Punjab") && <circle cx="78" cy="15" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Assam") && <circle cx="97" cy="20" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Madhya Pradesh") && <circle cx="82" cy="25" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Telangana") && <circle cx="83" cy="32" r="1.5" fill="#FF9933" />}
                    {form.selectedStates.includes("Odisha") && <circle cx="88" cy="28" r="1.5" fill="#FF9933" />}
                  </svg>
                  <p className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-inter font-bold text-[#999]">
                    {form.selectedStates.length > 0 ? `${form.selectedStates.length} state${form.selectedStates.length > 1 ? "s" : ""} selected` : "Select states"}
                  </p>
                </div>

                {/* State checkboxes */}
                <div className="flex-1 grid grid-cols-3 gap-1 max-h-56 overflow-y-auto">
                  {INDIAN_STATES.map(state => (
                    <label key={state} className={cn("flex items-center gap-1.5 px-2 py-1 text-[9px] font-inter cursor-pointer border rounded-sm transition-colors",
                      form.selectedStates.includes(state) ? "bg-primary/10 border-primary/30 font-bold" : "border-transparent hover:bg-gray-50"
                    )}>
                      <input type="checkbox" checked={form.selectedStates.includes(state)}
                        onChange={e => {
                          if (e.target.checked) setForm(p => ({ ...p, selectedStates: [...p.selectedStates, state] }));
                          else setForm(p => ({ ...p, selectedStates: p.selectedStates.filter(s => s !== state) }));
                        }}
                        className="w-3 h-3 accent-[#FF9933]"
                      />
                      {state}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── LIVE AD PREVIEW ──────────────────────── */}
          <div className="border-2 border-dashed border-black/20 p-4 bg-[#fafafa]">
            <p className="text-[8px] font-inter font-black uppercase tracking-widest opacity-40 mb-3">Live Preview — {selectedSize.label}</p>
            <div className="flex justify-center">
              <div style={{ width: Math.min(selectedSize.w, 700), height: Math.min(selectedSize.h, 300) }} className="border border-black/10 bg-white overflow-hidden relative">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Ad" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FF993310] to-[#FF993305]">
                    <p className="text-[8px] font-inter font-black uppercase tracking-widest opacity-20">Advertisement</p>
                    {form.brand && <p className="text-lg font-newsreader font-black opacity-30 mt-1">{form.brand}</p>}
                    {form.title && <p className="text-[10px] font-inter opacity-20 mt-0.5">{form.title}</p>}
                  </div>
                )}
                {/* Ad label overlay */}
                <div className="absolute top-0 left-0 bg-black/60 px-1.5 py-0.5">
                  <span className="text-[6px] font-inter font-bold text-white uppercase tracking-widest">AD</span>
                </div>
              </div>
            </div>
            {form.location !== "pan-india" && form.selectedStates.length > 0 && (
              <p className="text-[8px] font-inter text-center mt-2 opacity-40">
                Targeting: {form.selectedStates.join(", ")}
              </p>
            )}
          </div>

          <button onClick={saveAd} disabled={!form.title || saving} className="w-full py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingId ? "Update Advertisement" : "Save Advertisement"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" /></div>
      ) : ads.length === 0 && !creating ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <ImageIcon className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-lg font-newsreader font-bold italic opacity-40">No advertisements yet. Click &quot;Create Ad&quot; to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white border-2 border-black p-4 flex items-center gap-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="w-20 h-14 border border-black/10 overflow-hidden flex-shrink-0">
                {ad.imageUrl ? <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black/5 flex items-center justify-center text-[8px] opacity-30">No img</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-newsreader font-black">{ad.title}</span>
                  <span className="bg-primary/10 text-primary px-1.5 py-0.5 text-[7px] font-inter font-black">P{ad.priority}</span>
                </div>
                <p className="text-[9px] font-inter opacity-40 truncate">
                  {ad.brand || "No brand"} · {AD_SIZES.find(s => s.id === ad.size)?.label || ad.size} · {PLACEMENTS.find(p => p.id === ad.placement)?.label || ad.placement}
                </p>
              </div>
              <button onClick={() => toggleActive(ad)} className={cn("px-2 py-1 text-[8px] font-inter font-black uppercase border", ad.active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300")}>
                {ad.active ? "Active" : "Paused"}
              </button>
              <button onClick={() => startEdit(ad)} className="px-2 py-1 text-[8px] font-inter font-black uppercase border border-black hover:bg-black hover:text-white">Edit</button>
              <button onClick={() => deleteAd(ad.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthorsManagementPanel() {
  const [authors, setAuthors] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", nameHi: "", email: "", role: "author", bio: "", bioHi: "", designation: "", designationHi: "",
    education: "", age: "", gender: "", college: "", linkedin: "", twitter: "",
    photoUrl: "", password: "",
  });

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/authors");
      const data = await res.json();
      setAuthors(data.authors || []);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadAuthors(); }, []);

  const resetForm = () => setForm({
    name: "", nameHi: "", email: "", role: "author", bio: "", bioHi: "", designation: "", designationHi: "",
    education: "", age: "", gender: "", college: "", linkedin: "", twitter: "",
    photoUrl: "", password: "",
  });

  const startEdit = (a: Record<string, unknown>) => {
    setEditing(a);
    setCreating(false);
    setForm({
      name: (a.name as string) || "",
      nameHi: (a.nameHi as string) || "",
      email: (a.email as string) || "",
      role: (a.role as string) || "author",
      bio: (a.bio as string) || "",
      bioHi: (a.bioHi as string) || "",
      designation: (a.designation as string) || "",
      designationHi: (a.designationHi as string) || "",
      education: (a.education as string) || "",
      age: (a.age as string) || "",
      gender: (a.gender as string) || "",
      college: (a.college as string) || "",
      linkedin: (a.linkedin as string) || "",
      twitter: (a.twitter as string) || "",
      photoUrl: (a.photoUrl as string) || "",
      password: "",
    });
  };

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    resetForm();
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editing ? (editing.id as string) : undefined,
        }),
      });
      await loadAuthors();
      setEditing(null);
      setCreating(false);
      resetForm();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this author?")) return;
    await fetch("/api/admin/authors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAuthors();
  };

  const [uploading, setUploading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateAvatar = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "image-only",
          topic: `Professional headshot portrait of an Indian ${form.gender || "person"} journalist named ${form.name}, ${form.age ? form.age + " years old" : ""}, ${form.designation || "senior journalist"}, photorealistic studio lighting, newspaper editorial portrait style`,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) setForm(p => ({ ...p, photoUrl: data.imageUrl }));
    } catch { /* */ }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const ext = file.name.split(".").pop() || "png";
      const filename = `authors/${Date.now()}-${form.name.replace(/[^a-z0-9]/gi, "-").slice(0, 20)}.${ext}`;
      const bucket = "loktantravani-2d159.firebasestorage.app";
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filename)}?uploadType=media`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "image/png" },
        body: bytes,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`;
        setForm(p => ({ ...p, photoUrl: downloadUrl }));
      }
    } catch { /* */ }
    setUploading(false);
  };

  const generateBio = async () => {
    if (!form.name) return;
    setGeneratingBio(true);
    try {
      const prompt = `Write a 2-3 sentence professional journalist bio for: ${form.name}. ${form.designation ? "Designation: " + form.designation + "." : ""} ${form.education ? "Education: " + form.education + "." : ""} ${form.college ? "College: " + form.college + "." : ""} ${form.gender ? "Gender: " + form.gender + "." : ""} Write in third person, professional tone for a newspaper byline. Return ONLY the bio text, no quotes.`;
      const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? undefined : undefined;
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "article", topic: prompt, category: "Opinion", wordCount: 100, author: form.name }),
      });
      const data = await res.json();
      if (data.result?.summary) setForm(p => ({ ...p, bio: data.result.summary }));
    } catch { /* */ }
    setGeneratingBio(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">Authors & Team</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            Manage journalists, contributors, and their profiles
          </p>
        </div>
        <button
          onClick={startCreate}
          className="px-6 py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Author
        </button>
      </div>

      {/* Create / Edit Form */}
      {(creating || editing) && (
        <div className="bg-white border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest">
              {editing ? `Editing: ${editing.name}` : "Create New Author"}
            </h3>
            <button onClick={() => { setEditing(null); setCreating(false); resetForm(); }} className="text-xs font-inter underline">Cancel</button>
          </div>

          {/* Photo + Basic Info */}
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 border-2 border-black bg-black/5 flex items-center justify-center overflow-hidden rounded-sm">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-10 h-10 opacity-20" />
                )}
              </div>
              {/* Upload Photo */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-28 text-[8px] font-inter font-black uppercase tracking-widest border-2 border-black px-2 py-1.5 hover:bg-black hover:text-white disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading</> : <><ImageIcon className="w-3 h-3" /> Upload Photo</>}
              </button>
              {/* AI Avatar */}
              <button onClick={generateAvatar} disabled={saving} className="w-28 text-[8px] font-inter font-black uppercase tracking-widest border border-primary text-primary px-2 py-1.5 hover:bg-primary hover:text-white disabled:opacity-50 flex items-center justify-center gap-1">
                {saving ? <><Loader2 className="w-3 h-3 animate-spin" /></> : <><Sparkles className="w-3 h-3" /> AI Avatar</>}
              </button>
              {/* URL fallback */}
              <input
                type="text"
                value={form.photoUrl}
                onChange={e => setForm(p => ({ ...p, photoUrl: e.target.value }))}
                placeholder="Or paste URL"
                className="w-28 border border-black/20 p-1 text-[7px] font-inter outline-none placeholder:opacity-30"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Full Name (English) *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
              </div>
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">नाम (Hindi)</label>
                <input value={form.nameHi} onChange={e => setForm(p => ({ ...p, nameHi: e.target.value }))} placeholder="हिन्दी में नाम" className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
              </div>
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none" />
              </div>
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full border-2 border-black p-2 text-sm font-inter outline-none">
                  <option value="admin">Admin</option>
                  <option value="author">Author</option>
                  <option value="contributor">Contributor</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Designation (English)</label>
                <input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="Sr. Correspondent" className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
              </div>
              <div>
                <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">पद (Hindi)</label>
                <input value={form.designationHi} onChange={e => setForm(p => ({ ...p, designationHi: e.target.value }))} placeholder="वरिष्ठ संवाददाता" className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30" />
              </div>
            </div>
          </div>

          {/* Extended Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Education</label>
              <input value={form.education} onChange={e => setForm(p => ({ ...p, education: e.target.value }))} placeholder="B.Tech, IIT Delhi" className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">College</label>
              <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} placeholder="IIIT Bangalore" className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Age</label>
              <input value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="28" className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full border border-black/20 p-2 text-sm font-inter outline-none">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">LinkedIn</label>
              <input value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">X (Twitter)</label>
              <input value={form.twitter} onChange={e => setForm(p => ({ ...p, twitter: e.target.value }))} placeholder="https://x.com/..." className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60">Bio (English)</label>
              <button onClick={generateBio} disabled={generatingBio || !form.name} className="text-[8px] font-inter font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-30 flex items-center gap-1">
                {generatingBio ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> AI Generate Bio</>}
              </button>
            </div>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Award-winning journalist covering Indian politics and geopolitics..." className="w-full border-2 border-black p-2 text-sm font-inter outline-none placeholder:opacity-30 resize-none" />
          </div>
          <div>
            <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">परिचय (Hindi Bio)</label>
            <textarea value={form.bioHi} onChange={e => setForm(p => ({ ...p, bioHi: e.target.value }))} rows={2} placeholder="हिन्दी में परिचय..." className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30 resize-none" />
          </div>

          {/* Password (for new accounts) */}
          {creating && (
            <div>
              <label className="text-[8px] font-inter font-black uppercase tracking-widest opacity-60 block mb-1">Password (for email/password login)</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" className="w-full border border-black/20 p-2 text-sm font-inter outline-none placeholder:opacity-30" />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.email}
            className="w-full py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editing ? "Update Author" : "Create Author"}
          </button>
        </div>
      )}

      {/* Authors List */}
      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" /></div>
      ) : authors.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Users className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-lg font-newsreader font-bold italic opacity-40">No authors yet. Click &quot;Add Author&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {authors.map(a => (
            <div key={a.id as string} className="bg-white border-2 border-black p-4 flex items-center gap-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <div className="w-14 h-14 border-2 border-black bg-black/5 flex-shrink-0 overflow-hidden">
                {(a.photoUrl as string) ? (
                  <img src={a.photoUrl as string} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-newsreader font-black opacity-20">
                    {((a.name as string) || "?")[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-newsreader font-black text-lg">{a.name as string}</span>
                  <span className={cn(
                    "px-2 py-0.5 text-[7px] font-inter font-black uppercase tracking-widest",
                    (a.role as string) === "admin" ? "bg-red-100 text-red-700" :
                    (a.role as string) === "author" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {a.role as string}
                  </span>
                </div>
                <p className="text-[10px] font-inter opacity-50 truncate">
                  {(a.designation as string) || ""} {(a.designation as string) && "·"} {a.email as string}
                  {(a.college as string) && ` · ${a.college}`}
                </p>
                {(a.bio as string) && <p className="text-[10px] font-inter opacity-40 truncate mt-0.5">{(a.bio as string).slice(0, 100)}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {(a.linkedin as string) && <a href={a.linkedin as string} target="_blank" rel="noopener noreferrer" className="text-[8px] font-inter font-black border border-black/20 px-2 py-1 hover:bg-black hover:text-white">LI</a>}
                {(a.twitter as string) && <a href={a.twitter as string} target="_blank" rel="noopener noreferrer" className="text-[8px] font-inter font-black border border-black/20 px-2 py-1 hover:bg-black hover:text-white">X</a>}
                <button onClick={() => startEdit(a)} className="text-[8px] font-inter font-black uppercase border border-black px-3 py-1 hover:bg-black hover:text-white">Edit</button>
                <button onClick={() => handleDelete(a.id as string)} className="text-[8px] font-inter font-black uppercase border border-red-300 text-red-600 px-3 py-1 hover:bg-red-600 hover:text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsModeration() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-newsreader font-black uppercase">Comments Moderation</h2>
      <div className="bg-white border-2 border-black p-12 text-center">
        <MessageSquare className="w-12 h-12 text-black/10 mx-auto mb-4" />
        <p className="text-lg font-newsreader font-bold italic opacity-40">
          Comment moderation will appear here when comments are posted.
        </p>
      </div>
    </div>
  );
}

function SubscribersPanel() {
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; name: string; subscribedAt: string; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch { setSubscribers([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove subscriber ${email}?`)) return;
    try {
      await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setSubscribers(prev => prev.filter(s => s.id !== id));
    } catch { alert("Delete failed"); }
  };

  const exportCSV = () => {
    const header = "Email,Name,Subscribed At,Active\n";
    const rows = subscribers.map(s =>
      `"${s.email}","${s.name}","${s.subscribedAt ? new Date(s.subscribedAt).toLocaleString() : ""}","${s.active}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `loktantravani-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filtered = subscribers.filter(s =>
    !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || (s.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">Subscribers</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
            {subscribers.length} newsletter subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSubscribers} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={subscribers.length === 0} className="px-3 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-2 border-black p-3">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border-2 border-black px-3 py-2 text-sm font-inter outline-none placeholder:opacity-30"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-black p-4">
          <p className="text-3xl font-newsreader font-black">{subscribers.length}</p>
          <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40">Total</p>
        </div>
        <div className="bg-white border-2 border-black p-4">
          <p className="text-3xl font-newsreader font-black text-green-600">{subscribers.filter(s => s.active).length}</p>
          <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40">Active</p>
        </div>
        <div className="bg-white border-2 border-black p-4">
          <p className="text-3xl font-newsreader font-black text-red-600">{subscribers.filter(s => !s.active).length}</p>
          <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40">Inactive</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-inter opacity-40">Loading subscribers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center">
          <Mail className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-lg font-newsreader font-bold italic opacity-40">
            {searchQuery ? "No matching subscribers" : "No subscribers yet. Share your site to grow!"}
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id} className="border-b border-black/5 hover:bg-primary/5">
                  <td className="px-4 py-3 text-sm font-inter">{sub.email}</td>
                  <td className="px-4 py-3 text-sm font-inter opacity-60 hidden md:table-cell">{sub.name || "—"}</td>
                  <td className="px-4 py-3 text-[10px] font-inter opacity-40 hidden md:table-cell">
                    {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 text-[9px] font-inter font-black uppercase", sub.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {sub.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub.id, sub.email)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 text-[8px] font-inter font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface PollOptionField {
  text: string;
  textHi: string;
}

interface AdminPoll {
  id: string;
  question: string;
  questionHi: string;
  options: PollOptionField[];
  votes: number[];
  totalVotes: number;
  active: boolean;
  createdAt: string;
}

function PushNotificationsPanel() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; title: string; message: string; sentTo: number; createdAt: string }>>([]);

  useEffect(() => {
    // Load notification history
    (async () => {
      try {
        const { getDb } = await import("@/lib/firebase");
        const { collection, query, orderBy, limit, getDocs } = await import("firebase/firestore");
        const db = getDb();
        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || "",
            message: data.message || "",
            sentTo: data.sentTo || 0,
            createdAt: data.createdAt?.toDate?.()?.toLocaleString("en-IN") || "",
          };
        }));
      } catch {}
    })();
  }, [result]);

  const handleSend = async () => {
    if (!title.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(data);
      setTitle("");
      setBody("");
      setUrl("");
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : "Send failed" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-newsreader font-bold dark:text-white">Push Notifications</h2>
      </div>

      {/* Send form */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-6 space-y-4">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">Send Notification</h3>
        <input
          type="text"
          placeholder="Notification title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-black/20 dark:border-white/20 bg-transparent text-sm font-inter dark:text-white"
        />
        <textarea
          placeholder="Message body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-black/20 dark:border-white/20 bg-transparent text-sm font-inter dark:text-white resize-none"
        />
        <input
          type="text"
          placeholder="Link URL (optional, e.g. /blog/article-slug)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3 border border-black/20 dark:border-white/20 bg-transparent text-sm font-inter dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={sending || !title.trim()}
          className="px-6 py-3 bg-primary text-white font-inter font-bold text-sm uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending..." : "Send to All Subscribers"}
        </button>

        {result && (
          <div className={`p-3 text-sm font-inter ${result.error ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"}`}>
            {result.error
              ? `Error: ${result.error}`
              : `Sent to ${result.sent} subscribers${result.failed ? `, ${result.failed} failed` : ""}`}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-6 space-y-3">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">Recent Notifications</h3>
        {history.length === 0 ? (
          <p className="text-sm font-inter opacity-50 dark:text-white/50">No notifications sent yet</p>
        ) : (
          history.map((n) => (
            <div key={n.id} className="flex items-start justify-between py-2 border-b border-black/5 dark:border-white/5 last:border-0">
              <div>
                <p className="text-sm font-inter font-bold dark:text-white">{n.title}</p>
                {n.message && <p className="text-xs font-inter opacity-60 dark:text-white/60">{n.message}</p>}
                <p className="text-[10px] font-inter opacity-40 dark:text-white/40 mt-0.5">{n.createdAt}</p>
              </div>
              <span className="text-xs font-inter font-bold text-primary shrink-0 ml-2">
                {n.sentTo} sent
              </span>
            </div>
          ))
        )}
      </div>

      {/* Setup instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4">
        <p className="text-xs font-inter font-bold text-yellow-800 dark:text-yellow-300 mb-1">Setup Required</p>
        <ul className="text-xs font-inter text-yellow-700 dark:text-yellow-400 space-y-1 list-disc ml-4">
          <li>Set <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1">FIREBASE_SERVER_KEY</code> env var (Firebase Console → Cloud Messaging → Server key)</li>
          <li>Set <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1">NEXT_PUBLIC_FIREBASE_VAPID_KEY</code> env var (Firebase Console → Cloud Messaging → Web Push certificates)</li>
          <li>Users must allow notifications in their browser to receive alerts</li>
        </ul>
      </div>
    </div>
  );
}

function PollsPanel() {
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [questionHi, setQuestionHi] = useState("");
  const [options, setOptions] = useState<PollOptionField[]>([
    { text: "", textHi: "" },
    { text: "", textHi: "" },
  ]);
  const [creating, setCreating] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/poll");
      const data = await res.json();
      setPolls(data.polls || []);
    } catch {
      console.error("Failed to fetch polls");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const createPoll = async () => {
    if (!question || options.filter((o) => o.text).length < 2) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          questionHi,
          options: options.filter((o) => o.text),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuestion("");
        setQuestionHi("");
        setOptions([
          { text: "", textHi: "" },
          { text: "", textHi: "" },
        ]);
        setShowForm(false);
        fetchPolls();
      }
    } catch {
      console.error("Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (pollId: string, active: boolean) => {
    try {
      await fetch("/api/admin/poll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, active }),
      });
      fetchPolls();
    } catch {
      console.error("Failed to toggle poll");
    }
  };

  const addOption = () => {
    setOptions([...options, { text: "", textHi: "" }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: "text" | "textHi", value: string) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: value };
    setOptions(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-newsreader font-black uppercase">Polls</h2>
          <span className="text-[9px] font-inter font-black opacity-40 uppercase tracking-widest">Surveys &amp; Polls</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-inter font-bold text-xs uppercase tracking-wider border-2 border-black hover:bg-red-600 hover:border-red-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New Poll"}
        </button>
      </div>

      {/* Create Poll Form */}
      {showForm && (
        <div className="border-2 border-black p-5 bg-white dark:bg-neutral-900 space-y-4">
          <h3 className="font-newsreader font-bold text-lg">Create New Poll</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-inter text-xs font-bold uppercase tracking-wider mb-1">Question (English)</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you think about..."
                className="w-full px-3 py-2 border-2 border-black font-inter text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
              />
            </div>
            <div>
              <label className="block font-inter text-xs font-bold uppercase tracking-wider mb-1">Question (Hindi)</label>
              <input
                value={questionHi}
                onChange={(e) => setQuestionHi(e.target.value)}
                placeholder="आपकी राय..."
                className="w-full px-3 py-2 border-2 border-black font-inter text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-inter text-xs font-bold uppercase tracking-wider mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="font-inter text-xs font-bold w-6 text-center">{idx + 1}.</span>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(idx, "text", e.target.value)}
                    placeholder={`Option ${idx + 1} (English)`}
                    className="flex-1 px-3 py-2 border-2 border-neutral-300 font-inter text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  />
                  <input
                    value={opt.textHi}
                    onChange={(e) => updateOption(idx, "textHi", e.target.value)}
                    placeholder={`विकल्प ${idx + 1} (Hindi)`}
                    className="flex-1 px-3 py-2 border-2 border-neutral-300 font-inter text-sm bg-white dark:bg-neutral-800 text-black dark:text-white"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(idx)} className="p-1 text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="mt-2 px-3 py-1 font-inter text-xs font-bold uppercase tracking-wider border-2 border-dashed border-neutral-400 hover:border-black transition-colors"
            >
              + Add Option
            </button>
          </div>

          <button
            onClick={createPoll}
            disabled={creating || !question || options.filter((o) => o.text).length < 2}
            className="px-6 py-2.5 bg-red-600 text-white font-inter font-bold text-sm uppercase tracking-wider border-2 border-red-600 disabled:opacity-40 hover:bg-red-700 transition-colors"
          >
            {creating ? "Creating..." : "Create Poll"}
          </button>
        </div>
      )}

      {/* Polls List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 font-inter text-neutral-500">
          No polls yet. Create your first poll above.
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const total = poll.totalVotes || poll.votes?.reduce((a: number, b: number) => a + b, 0) || 0;
            return (
              <div key={poll.id} className="border-2 border-black p-4 bg-white dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-newsreader font-bold text-base truncate">{poll.question}</h4>
                    {poll.questionHi && (
                      <p className="font-inter text-xs text-neutral-500 truncate">{poll.questionHi}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-inter text-xs text-neutral-500">
                        {total} vote{total !== 1 ? "s" : ""}
                      </span>
                      <span className="font-inter text-xs text-neutral-500">
                        {(poll.options || []).length} options
                      </span>
                      <span
                        className={`font-inter text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                          poll.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700"
                        }`}
                      >
                        {poll.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Mini results */}
                    <div className="mt-3 space-y-1">
                      {(poll.options || []).map((opt: PollOptionField, idx: number) => {
                        const count = poll.votes?.[idx] || 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-inter text-xs w-32 truncate">{opt.text}</span>
                            <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-inter text-xs font-bold w-10 text-right tabular-nums">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleActive(poll.id, !poll.active)}
                    className={`shrink-0 px-3 py-1.5 font-inter text-xs font-bold uppercase tracking-wider border-2 transition-colors ${
                      poll.active
                        ? "border-neutral-400 text-neutral-600 hover:border-red-600 hover:text-red-600"
                        : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    }`}
                  >
                    {poll.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeepSearchAgentPanel() {
  const allSections = ["India", "World", "Politics", "Geopolitics", "Economy", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Lok Post"];
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(allSections));
  const [articlesPerSection, setArticlesPerSection] = useState(2);
  const [wordCount, setWordCount] = useState(1500);
  const [language, setLanguage] = useState("en");
  const [author, setAuthor] = useState("LoktantraVani AI");
  const [engine, setEngine] = useState<"auto" | "claude" | "gemini">("auto");
  const [autoPublish, setAutoPublish] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<{ type: string; section?: string; headline?: string; topic?: string; message?: string; savedId?: string; count?: number; topics?: string[]; completed?: number; errors?: number; totalArticles?: number; sections?: string[] }[]>([]);
  const [progress, setProgress] = useState<{ pct: number; completed: number; total: number; section: string } | null>(null);

  const toggleSection = (s: string) => {
    setSelectedSections(prev => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });
  };

  const totalArticles = selectedSections.size * articlesPerSection;

  const runAgent = async () => {
    if (selectedSections.size === 0) return;
    setRunning(true);
    setLog([]);
    setProgress(null);
    setElapsed(0);
    const timer = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      const res = await fetch("/api/agent-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: [...selectedSections],
          articlesPerSection,
          wordCount,
          language,
          author,
          engine,
          autoPublish,
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            setLog(prev => [...prev, msg]);
            if (msg.pct !== undefined) {
              setProgress({ pct: msg.pct, completed: msg.completed || 0, total: msg.totalArticles || totalArticles, section: msg.section || "" });
            }
            if (msg.type === "complete") {
              setProgress({ pct: 100, completed: msg.completed, total: msg.totalArticles, section: "Done!" });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setLog(prev => [...prev, { type: "error", message: String(err) }]);
    }

    clearInterval(timer);
    setRunning(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" /> AI Deep Search Agent
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          Claude + Gemini — Deep research agents for each section
        </p>
      </div>

      {/* How it works */}
      <div className="bg-primary/5 border-2 border-primary/20 p-4">
        <p className="text-[10px] font-inter font-bold uppercase tracking-widest text-primary mb-2">How the Agent Works</p>
        <div className="flex flex-wrap gap-4 text-[9px] font-inter opacity-60">
          <span>1. 🔍 <b>Gemini</b> + Google Search → finds real trending news + PIB</span>
          <span>2. 📋 Research brief with facts, dates, sources</span>
          <span>3. ✍️ <b>{engine === "gemini" ? "Gemini" : engine === "claude" ? "Claude" : "Claude/Gemini"}</b> writes deep-researched article</span>
          <span>4. 🎨 <b>Gemini Imagen</b> generates unique thumbnail</span>
          <span>5. 💾 Saved as draft → admin approves</span>
        </div>
      </div>

      {/* Section Selection */}
      <div className="bg-white border-2 border-black p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest">Select Sections (1 Agent per Section)</h3>
          <div className="flex gap-2">
            <button onClick={() => setSelectedSections(new Set(allSections))} className="px-3 py-1 text-[8px] font-inter font-black uppercase border border-black hover:bg-black hover:text-white">All</button>
            <button onClick={() => setSelectedSections(new Set())} className="px-3 py-1 text-[8px] font-inter font-black uppercase border border-black hover:bg-black hover:text-white">None</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {allSections.map(s => (
            <button
              key={s}
              onClick={() => toggleSection(s)}
              className={cn(
                "px-4 py-2 text-[9px] font-inter font-black uppercase tracking-widest border-2 transition-colors",
                selectedSections.has(s) ? "bg-black text-white border-black" : "border-black/30 text-black/70 hover:border-black bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Articles / Section</label>
          <select value={articlesPerSection} onChange={e => setArticlesPerSection(Number(e.target.value))} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            {[1,2,3,5].map(n => <option key={n} value={n}>{n} article{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Word Count</label>
          <select value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value={500}>Short (~500)</option>
            <option value={1500}>Standard (~1500)</option>
            <option value={2000}>Long (~2000)</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bilingual">Bilingual</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Author</label>
          <select value={author} onChange={e => setAuthor(e.target.value)} className="w-full border-2 border-black p-2.5 text-sm font-inter font-bold outline-none">
            {["LoktantraVani AI", "Aditya Ashok", "Ashok Kumar Choudhary", "Sanjay Saraogi", "Adarsh Ashok", "Seema Choudhary", "Shreya Rahul Anand"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* AI Engine Toggle */}
      <div className="bg-white border-2 border-black p-6">
        <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 block mb-3">AI Writing Engine</label>
        <div className="flex gap-2">
          {([
            { id: "auto" as const, label: "Auto (Claude → Gemini)", desc: "Tries Claude first, falls back to Gemini if credits exhausted" },
            { id: "claude" as const, label: "Claude Only", desc: "Anthropic Claude Sonnet — best quality, requires API credits" },
            { id: "gemini" as const, label: "Gemini Only", desc: "Google Gemini 2.0 Flash — free, fast, good quality" },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setEngine(opt.id)}
              className={cn(
                "flex-1 p-3 border-2 text-left transition-colors",
                engine === opt.id ? "bg-black text-white border-black" : "border-black/30 text-black hover:border-black bg-gray-50"
              )}
            >
              <span className="text-xs font-inter font-black block">{opt.label}</span>
              <span className="text-[8px] font-inter opacity-60 block mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Publish Toggle */}
      <div className="bg-white border-2 border-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-inter font-black uppercase tracking-widest block">Auto-Publish</label>
            <p className="text-[9px] font-inter opacity-50 mt-0.5">When enabled, articles are published immediately instead of saved as drafts</p>
          </div>
          <button
            onClick={() => setAutoPublish(!autoPublish)}
            className={cn(
              "relative w-14 h-7 rounded-full transition-colors flex-shrink-0",
              autoPublish ? "bg-green-500" : "bg-gray-300"
            )}
          >
            <div className={cn(
              "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform",
              autoPublish ? "translate-x-7" : "translate-x-0.5"
            )} />
          </button>
        </div>
        {autoPublish && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 text-[10px] font-inter text-green-800">
            ⚡ Articles will be <strong>auto-published</strong> immediately after generation. No editorial review.
          </div>
        )}
      </div>

      {/* Launch */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <div>
          <p className="text-lg font-newsreader font-black">
            {selectedSections.size} agents → {totalArticles} articles from real trending news
          </p>
          <p className="text-[9px] font-inter opacity-40">
            Est. ~{Math.ceil(totalArticles * 0.7)} min · {engine === "claude" ? "Claude" : engine === "gemini" ? "Gemini" : "Claude → Gemini"} · Google Search grounded · Saved as drafts
          </p>
        </div>
        <button
          onClick={runAgent}
          disabled={running || selectedSections.size === 0}
          className="w-full py-4 bg-primary text-white font-inter font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {running ? <><Loader2 className="w-5 h-5 animate-spin" /> Running... {formatTime(elapsed)}</> : <><Bot className="w-5 h-5" /> Launch All Agents</>}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="bg-white border-2 border-black p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-inter font-black">{progress.section}</p>
            <p className="text-2xl font-newsreader font-black text-primary">{progress.pct}%</p>
          </div>
          <div className="h-3 bg-black/5 overflow-hidden">
            <motion.div className="h-full bg-primary" animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.3 }} />
          </div>
          <p className="text-[9px] font-inter opacity-40">{progress.completed}/{progress.total} articles · {formatTime(elapsed)}</p>
        </div>
      )}

      {/* Live Log */}
      {log.length > 0 && (
        <div className="bg-black text-green-400 p-4 font-mono text-[11px] max-h-96 overflow-y-auto space-y-0.5 border-2 border-black">
          <p className="text-white/40 mb-2">── Agent Console ──</p>
          {log.map((entry, i) => (
            <div key={i} className={cn(
              entry.type === "error" ? "text-red-400" :
              entry.type === "searching" ? "text-yellow-400" :
              entry.type === "topics_found" ? "text-cyan-400" :
              entry.type === "article_done" ? "text-green-400" :
              entry.type === "complete" ? "text-white font-bold" :
              "text-white/60"
            )}>
              {entry.type === "searching" && `🔍 [${entry.section}] ${entry.message}`}
              {entry.type === "topics_found" && `📋 [${entry.section}] Found ${entry.count} trending topics: ${(entry.topics || []).slice(0, 3).join(" | ")}`}
              {entry.type === "generating" && `✍️ [${entry.section}] Generating: ${entry.topic}`}
              {entry.type === "article_done" && `✅ [${entry.section}] "${entry.headline}" → saved ${entry.savedId?.slice(0, 8)}...`}
              {entry.type === "error" && `❌ [${entry.section || "system"}] ${entry.message}`}
              {entry.type === "complete" && `\n🎉 COMPLETE — ${entry.completed} articles generated, ${entry.errors} errors`}
              {entry.type === "start" && `🚀 Launching ${entry.totalArticles} article generation across ${(entry.sections as string[])?.length} sections...`}
              {entry.type === "search_error" && `⚠️ [${entry.section}] Search failed: ${entry.message}`}
            </div>
          ))}
          {running && <span className="animate-pulse">▌</span>}
        </div>
      )}
    </div>
  );
}

function PodcastStudio() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [videoStatus, setVideoStatus] = useState<{ status: string; videoUrl?: string; thumbnail?: string } | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [mode, setMode] = useState<"audio" | "video" | "clone">("audio");
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "script" | "generate" | "done">("select");
  const [podcastLang, setPodcastLang] = useState<"en" | "hi">("en");
  const [anchorName, setAnchorName] = useState("");

  // Voice cloning state
  const [clonedVoices, setClonedVoices] = useState<Array<{ id: string; name: string; referenceUrl: string; createdAt: string; language: string }>>([]);
  const [selectedCloneVoice, setSelectedCloneVoice] = useState("");
  const [cloneVoiceName, setCloneVoiceName] = useState("");
  const [cloneLanguage, setCloneLanguage] = useState("english");
  const [cloneUploading, setCloneUploading] = useState(false);
  const [cloneMessage, setCloneMessage] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/list-posts?status=published")
      .then(r => r.json())
      .then(d => setPosts((d.posts || []).slice(0, 50)))
      .catch(() => {});
    // Load cloned voices
    fetch("/api/voice-clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list-voices" }),
    })
      .then(r => r.json())
      .then(d => setClonedVoices(d.voices || []))
      .catch(() => {});
  }, []);

  const generateScript = async () => {
    if (!selectedPost) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-script-only", title: selectedPost.title, content: selectedPost.content, category: selectedPost.category, language: podcastLang, anchorName: anchorName || selectedPost.author || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScript(data.script);
      setStep("script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const createAudio = async () => {
    setGenerating(true);
    setError("");
    try {
      // Step 1: Generate script if not already done
      let podScript = script;
      if (!podScript) {
        const scriptRes = await fetch("/api/podcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate-script-only", title: selectedPost?.title, content: selectedPost?.content, category: selectedPost?.category, language: podcastLang, anchorName: anchorName || selectedPost?.author || "" }),
        });
        const scriptData = await scriptRes.json();
        if (!scriptRes.ok || !scriptData.script) throw new Error(scriptData.error || "Script generation failed");
        podScript = scriptData.script;
        setScript(podScript);
      }

      // Step 2: Generate audio from script (separate call to avoid timeout)
      const audioRes = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-audio-from-script", script: podScript, title: selectedPost?.title, category: selectedPost?.category, postId: selectedPost?.id }),
      });
      const audioData = await audioRes.json();
      if (!audioRes.ok) throw new Error(audioData.error);
      if (!audioData.audioUrl) {
        setStep("script");
        throw new Error(audioData.message || "Audio generation failed — no audio URL returned.");
      }
      setAudioUrl(audioData.audioUrl);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const createVideo = async () => {
    if (!script) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heygen-create-video", script, avatarId: avatarId || "default", voiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoId(data.videoId);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Voice cloning: upload reference audio
  const uploadVoiceSample = async (file: File) => {
    if (!file) return;
    setCloneUploading(true);
    setCloneMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("action", "clone-voice");
      formData.append("audio", file);
      formData.append("name", cloneVoiceName || "My Voice");
      formData.append("language", cloneLanguage);

      const res = await fetch("/api/voice-clone", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCloneMessage(`Voice "${data.name}" saved! ID: ${data.voiceId}`);
      setSelectedCloneVoice(data.voiceId);
      // Refresh voices list
      const vRes = await fetch("/api/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-voices" }),
      });
      const vData = await vRes.json();
      setClonedVoices(vData.voices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice upload failed");
    } finally {
      setCloneUploading(false);
    }
  };

  const deleteClonedVoice = async (vid: string) => {
    try {
      await fetch("/api/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-voice", voiceId: vid }),
      });
      setClonedVoices(prev => prev.filter(v => v.id !== vid));
      if (selectedCloneVoice === vid) setSelectedCloneVoice("");
    } catch {}
  };

  // Generate audio with cloned voice
  const createClonedAudio = async () => {
    if (!selectedCloneVoice) {
      setError("Please select a cloned voice first.");
      return;
    }
    if (!selectedPost) {
      setError("Please select an article first.");
      return;
    }
    setGenerating(true);
    setError("");
    setCloneMessage("");
    try {
      // Step 1: Generate script if not done yet
      let podScript = script;
      if (!podScript) {
        setCloneMessage("Step 1/2: Generating script...");
        const scriptRes = await fetch("/api/podcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate-script-only", title: selectedPost.title, content: selectedPost.content, category: selectedPost.category, language: podcastLang, anchorName: anchorName || selectedPost.author || "" }),
        });
        const scriptData = await scriptRes.json();
        if (!scriptRes.ok || !scriptData.script) throw new Error(scriptData.error || "Script generation failed");
        podScript = scriptData.script;
        setScript(podScript);
      }

      // Step 2: Generate cloned voice audio
      setCloneMessage("Step 2/2: Cloning your voice & generating audio... (may take 30-60s)");
      const res = await fetch("/api/voice-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tts-with-clone",
          text: podScript,
          voiceId: selectedCloneVoice,
          language: cloneLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.tip || "Clone TTS failed");
      if (!data.audioUrl) throw new Error(data.message || "No audio generated");
      setAudioUrl(data.audioUrl);
      setCloneMessage(data.message || "Audio generated with your cloned voice!");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cloned voice generation failed");
      setCloneMessage("");
    } finally {
      setGenerating(false);
    }
  };

  const checkVideo = async () => {
    if (!videoId) return;
    try {
      const res = await fetch("/api/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heygen-video-status", videoId }),
      });
      const data = await res.json();
      setVideoStatus(data);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-newsreader font-bold dark:text-white">Podcast Studio</h2>
          <p className="text-[10px] font-inter opacity-50 dark:text-white/50">Generate AI audio/video podcasts from articles</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode("audio")} className={cn("px-4 py-2 text-xs font-inter font-black uppercase tracking-widest border-2", mode === "audio" ? "border-primary bg-primary text-white" : "border-gray-300 dark:border-white/20 dark:text-white")}>
          🎙️ Audio Podcast
        </button>
        <button onClick={() => setMode("video")} className={cn("px-4 py-2 text-xs font-inter font-black uppercase tracking-widest border-2", mode === "video" ? "border-purple-500 bg-purple-500 text-white" : "border-gray-300 dark:border-white/20 dark:text-white")}>
          🎬 Video (HeyGen)
        </button>
        <button onClick={() => setMode("clone")} className={cn("px-4 py-2 text-xs font-inter font-black uppercase tracking-widest border-2", mode === "clone" ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 dark:border-white/20 dark:text-white")}>
          🧬 Voice Clone (FREE)
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-inter border border-red-200">{error}</div>}
      {cloneMessage && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-inter border border-emerald-200">{cloneMessage}</div>}

      {/* Voice Clone Panel */}
      {mode === "clone" && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-700/30 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🧬</span>
            <div>
              <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">Voice Cloning Studio</h3>
              <p className="text-[10px] font-inter opacity-50 dark:text-white/50">Clone your voice using OpenVoice V2 (FREE via HuggingFace)</p>
            </div>
          </div>

          {/* Upload reference audio */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-4 space-y-3">
            <h4 className="text-xs font-inter font-black uppercase tracking-widest dark:text-white">Upload Voice Sample</h4>
            <p className="text-[10px] font-inter opacity-60 dark:text-white/40">Record or upload 10-30 seconds of clear speech. No background noise. WAV or MP3.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Voice Name</label>
                <input
                  value={cloneVoiceName}
                  onChange={(e) => setCloneVoiceName(e.target.value)}
                  placeholder="e.g. My News Anchor Voice"
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                />
              </div>
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Language</label>
                <select
                  value={cloneLanguage}
                  onChange={(e) => setCloneLanguage(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadVoiceSample(file);
                }}
              />
              <button
                onClick={() => audioInputRef.current?.click()}
                disabled={cloneUploading}
                className="px-5 py-3 bg-emerald-600 text-white font-inter font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition"
              >
                {cloneUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {cloneUploading ? "Uploading & Cloning..." : "Upload Voice Sample"}
              </button>
              <span className="text-[10px] font-inter opacity-40 dark:text-white/40">WAV, MP3, M4A · 10-30 sec</span>
            </div>
          </div>

          {/* Saved voices */}
          {clonedVoices.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-4">
              <h4 className="text-xs font-inter font-black uppercase tracking-widest mb-3 dark:text-white">Your Cloned Voices</h4>
              <div className="space-y-2">
                {clonedVoices.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedCloneVoice(v.id)}
                    className={cn(
                      "flex items-center justify-between p-3 border cursor-pointer transition",
                      selectedCloneVoice === v.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-white/10 hover:border-emerald-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        selectedCloneVoice === v.id ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/20"
                      )} />
                      <div>
                        <p className="text-sm font-inter font-bold dark:text-white">{v.name}</p>
                        <p className="text-[10px] font-inter opacity-40 dark:text-white/40">
                          {v.language} · Created {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.referenceUrl && (
                        <audio controls src={v.referenceUrl} className="h-8 w-32" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteClonedVoice(v.id); }}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="bg-white/50 dark:bg-white/5 border border-emerald-200/50 dark:border-emerald-700/20 p-3">
            <p className="text-[10px] font-inter font-bold text-emerald-800 dark:text-emerald-300 mb-1">How Voice Cloning Works (100% FREE)</p>
            <ol className="text-[10px] font-inter text-emerald-700 dark:text-emerald-400 space-y-0.5 list-decimal ml-4">
              <li>Upload a 10-30s audio sample of your voice (clear speech, no background noise)</li>
              <li>Select an article and generate the podcast script with AI</li>
              <li>OpenVoice V2 (HuggingFace) clones your voice and reads the script</li>
              <li>Audio is saved to Firebase — ready to publish!</li>
            </ol>
            <p className="text-[9px] font-inter opacity-40 mt-1 dark:text-white/30">Powered by MyShell OpenVoice V2 · Fallback: Gemini TTS</p>
          </div>
        </div>
      )}

      {/* Step 1: Select article */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-4">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-3 dark:text-white">1. Select Article</h3>
        <select
          className="w-full p-3 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter"
          value={selectedPost?.id || ""}
          onChange={(e) => {
            const p = posts.find(x => x.id === e.target.value);
            setSelectedPost(p || null);
            setStep("select");
            setScript("");
            setVideoId("");
            setAudioUrl("");
            setVideoStatus(null);
          }}
        >
          <option value="">— Select a published article —</option>
          {posts.map(p => (
            <option key={p.id} value={p.id}>{p.title.slice(0, 80)} ({p.category})</option>
          ))}
        </select>

        {selectedPost && step === "select" && (
          <div className="mt-4 space-y-3">
            {/* Language & Anchor Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Podcast Language</label>
                <select
                  value={podcastLang}
                  onChange={(e) => setPodcastLang(e.target.value as "en" | "hi")}
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 Hindi (Roman Script)</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Anchor Name</label>
                <input
                  value={anchorName}
                  onChange={(e) => setAnchorName(e.target.value)}
                  placeholder={selectedPost?.author || "e.g. Aditya Ashok"}
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                />
                <p className="text-[9px] font-inter opacity-30 mt-0.5 dark:text-white/30">
                  Defaults to article author: {selectedPost?.author || "—"}
                </p>
              </div>
            </div>

            {mode === "clone" ? (
              <button
                onClick={createClonedAudio}
                disabled={generating || !selectedCloneVoice}
                className="px-6 py-3 bg-emerald-600 text-white font-inter font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating..." : !selectedCloneVoice ? "Select a Voice First ↑" : `Generate with Cloned Voice (${podcastLang === "hi" ? "Hindi" : "English"})`}
              </button>
            ) : (
              <button
                onClick={generateScript}
                disabled={generating}
                className="px-6 py-3 bg-black text-white font-inter font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate {podcastLang === "hi" ? "Hindi" : "English"} Podcast Script
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Review/Edit script */}
      {(step === "script" || step === "generate" || step === "done") && script && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-4">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-3 dark:text-white">2. Podcast Script</h3>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter font-mono resize-y"
          />
          <p className="text-[10px] font-inter opacity-40 mt-1 dark:text-white/40">~{Math.ceil(script.split(/\s+/).length / 150)} min audio · {script.split(/\s+/).length} words</p>
        </div>
      )}

      {/* Step 3: Generate */}
      {step === "script" && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 p-4">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-3 dark:text-white">
            3. Generate {mode === "video" ? "Video" : mode === "clone" ? "Cloned Audio" : "Audio"}
          </h3>

          {mode === "video" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Avatar ID</label>
                <input
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                  placeholder="Your HeyGen Avatar ID"
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                />
              </div>
              <div>
                <label className="text-[9px] font-inter font-black uppercase opacity-50 dark:text-white/50">Voice ID (optional)</label>
                <input
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="HeyGen Voice ID"
                  className="w-full p-2 border border-gray-300 dark:border-white/20 dark:bg-[#111] dark:text-white text-sm font-inter mt-1"
                />
              </div>
            </div>
          )}

          {mode === "clone" && (
            <div className="mb-4">
              {selectedCloneVoice ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-inter font-bold dark:text-white">
                    Using: {clonedVoices.find(v => v.id === selectedCloneVoice)?.name || selectedCloneVoice}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 text-sm font-inter text-yellow-700 dark:text-yellow-300">
                  No voice selected. Scroll up to upload a voice sample or select an existing cloned voice.
                </div>
              )}
            </div>
          )}

          <button
            onClick={mode === "video" ? createVideo : mode === "clone" ? createClonedAudio : createAudio}
            disabled={generating || (mode === "clone" && !selectedCloneVoice)}
            className={cn(
              "px-6 py-3 text-white font-inter font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50",
              mode === "video" ? "bg-purple-600" : mode === "clone" ? "bg-emerald-600" : "bg-primary"
            )}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {generating ? "Generating..." : mode === "video" ? "Create HeyGen Video" : mode === "clone" ? "Generate with Cloned Voice" : "Generate Audio Podcast"}
          </button>
        </div>
      )}

      {/* Step 4: Results */}
      {step === "done" && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-300 dark:border-green-700 p-4">
          <h3 className="text-sm font-inter font-black uppercase tracking-widest text-green-700 dark:text-green-300 mb-3">
            ✅ {mode === "video" ? "Video" : "Audio"} Generated!
          </h3>

          {audioUrl && (
            <div className="space-y-2">
              <audio controls src={audioUrl} className="w-full" />
              <a href={audioUrl} target="_blank" rel="noopener" className="text-xs font-inter text-primary underline">Download Audio</a>
            </div>
          )}

          {videoId && (
            <div className="space-y-2">
              <p className="text-sm font-inter dark:text-white">Video ID: <code className="bg-gray-100 dark:bg-white/10 px-1">{videoId}</code></p>
              <button onClick={checkVideo} className="px-4 py-2 bg-purple-600 text-white text-xs font-inter font-bold uppercase tracking-widest">
                Check Video Status
              </button>
              {videoStatus && (
                <div className="p-3 bg-white dark:bg-[#111] border text-sm font-inter dark:text-white">
                  <p>Status: <span className="font-bold">{videoStatus.status}</span></p>
                  {videoStatus.videoUrl && (
                    <a href={videoStatus.videoUrl} target="_blank" rel="noopener" className="text-primary underline block mt-1">
                      🎬 Download Video
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 p-4">
        <p className="text-xs font-inter font-bold text-yellow-800 dark:text-yellow-300 mb-1">Environment Setup</p>
        <ul className="text-xs font-inter text-yellow-700 dark:text-yellow-400 space-y-1 list-disc ml-4">
          <li><strong>Audio:</strong> Set <code>ELEVENLABS_API_KEY</code> (or uses Gemini TTS as free fallback)</li>
          <li><strong>Video:</strong> Set <code>HEYGEN_API_KEY</code> from <a href="https://app.heygen.com/settings" target="_blank" className="underline">HeyGen Dashboard</a></li>
          <li><strong>HeyGen Avatar:</strong> Create your avatar at HeyGen → Avatars → Instant Avatar</li>
          <li><strong>Your face:</strong> Record 2-5 min video of yourself → upload to HeyGen → get Avatar ID</li>
          <li><strong>Voice Clone:</strong> FREE — uses OpenVoice V2 on HuggingFace. No API key needed!</li>
        </ul>
      </div>
    </div>
  );
}

function PosterStudio() {
  const [posterType, setPosterType] = useState<"foundation-day" | "jayanti" | "event" | "achievement" | "custom">("event");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<"saffron" | "tricolor" | "lotus" | "dark">("saffron");
  const [posterLang, setPosterLang] = useState<"en" | "hi">("hi");
  const [authorName, setAuthorName] = useState("");
  const [authorDesignation, setAuthorDesignation] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [todayEvents, setTodayEvents] = useState<{ title: string; subtitle: string; description: string; type: string }[]>([]);
  const posterRef = useRef<HTMLDivElement>(null);
  const [firestoreAuthors, setFirestoreAuthors] = useState<{ name: string; nameHi: string; designation: string; designationHi: string }[]>([]);

  // Load authors from Firestore — same source as Authors panel
  useEffect(() => {
    fetch("/api/admin/authors")
      .then(r => r.json())
      .then(d => {
        const list = (d.authors || [])
          .filter((a: Record<string, unknown>) => (a.name as string) !== "LoktantraVani AI")
          .map((a: Record<string, unknown>) => ({
            name: (a.name as string) || "",
            nameHi: (a.nameHi as string) || "",
            designation: (a.designation as string) || "",
            designationHi: (a.designationHi as string) || "",
          }));
        setFirestoreAuthors(list);
      })
      .catch(() => {
        // Fallback to hardcoded AUTHORS if Firestore fails
        setFirestoreAuthors(
          AUTHORS.filter(a => a.name !== "LoktantraVani AI").map(a => ({
            name: a.name, nameHi: a.nameHi, designation: a.designation, designationHi: a.designationHi,
          }))
        );
      });
  }, []);

  const authors = firestoreAuthors;

  const posterTypes = [
    { id: "foundation-day", label: posterLang === "hi" ? "स्थापना दिवस" : "Foundation Day", emoji: "🏛️" },
    { id: "jayanti", label: posterLang === "hi" ? "जयंती / जन्म दिवस" : "Jayanti / Birth Anniversary", emoji: "🙏" },
    { id: "event", label: posterLang === "hi" ? "राष्ट्रीय कार्यक्रम" : "National Event", emoji: "🇮🇳" },
    { id: "achievement", label: posterLang === "hi" ? "सरकारी उपलब्धि" : "Government Achievement", emoji: "🏆" },
    { id: "custom", label: posterLang === "hi" ? "कस्टम पोस्टर" : "Custom Poster", emoji: "✏️" },
  ];

  const styleOptions = [
    { id: "saffron", label: "Saffron", color: "bg-orange-500" },
    { id: "tricolor", label: "Tricolor", color: "bg-gradient-to-r from-orange-500 via-white to-green-600" },
    { id: "lotus", label: "Lotus", color: "bg-pink-500" },
    { id: "dark", label: "Dark", color: "bg-gray-900" },
  ];

  const fetchTodayEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/poster");
      const data = await res.json();
      setTodayEvents(data.events || []);
    } catch { setTodayEvents([]); }
    setEventsLoading(false);
  }, []);

  useEffect(() => { fetchTodayEvents(); }, [fetchTodayEvents]);

  const selectEvent = (event: { title: string; subtitle: string; description: string; type: string }) => {
    setTitle(event.title);
    setSubtitle(event.subtitle);
    setDescription(event.description);
    setPosterType(event.type as typeof posterType);
  };

  const generatePoster = async () => {
    if (!title) return alert("Enter a title for the poster");
    setLoading(true);
    setGeneratedImage("");
    setGeneratedText("");
    try {
      const res = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: posterType, title, subtitle, description, authorName, authorDesignation, style, date: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (data.image) setGeneratedImage(data.image);
      if (data.text) setGeneratedText(data.text);
      if (data.error) alert("Error: " + data.error);
    } catch (e) { alert("Generation failed: " + String(e)); }
    setLoading(false);
  };

  const downloadPoster = async () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `poster-${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      link.click();
      return;
    }
    if (posterRef.current) {
      try {
        const dataUrl = await toPng(posterRef.current, { pixelRatio: 3 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `poster-${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
        link.click();
      } catch { alert("Download failed"); }
    }
  };

  const copyContent = () => {
    const text = `${title}\n${subtitle ? subtitle + "\n" : ""}${description ? description + "\n" : ""}${authorName ? "\n— " + authorName + (authorDesignation ? ", " + authorDesignation : "") : ""}\n\n🪷 LoktantraVani | loktantravani.in`;
    navigator.clipboard.writeText(text).then(() => alert("Content copied!"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">🪷 Poster Studio</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
            BJP-Style Political Poster Generator — Powered by Gemini AI
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setPosterLang(posterLang === "hi" ? "en" : "hi");
              setAuthorName(""); setAuthorDesignation("");
            }}
            className={cn("px-3 py-2 border-2 text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2",
              posterLang === "hi" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-black hover:bg-black hover:text-white"
            )}
          >
            {posterLang === "hi" ? "हिन्दी ✓" : "EN ✓"} → {posterLang === "hi" ? "EN" : "हिन्दी"}
          </button>
          <button onClick={fetchTodayEvents} className="px-3 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white flex items-center gap-2">
            <RefreshCw className={cn("w-3 h-3", eventsLoading && "animate-spin")} /> Refresh Events
          </button>
        </div>
      </div>

      {/* Today's Events */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-300 p-4">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-3 text-orange-800">
          📅 Today&apos;s Events — Click to Auto-fill
        </h3>
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-sm text-orange-600"><Loader2 className="w-4 h-4 animate-spin" /> Finding today&apos;s events...</div>
        ) : todayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayEvents.map((event, i) => (
              <button key={i} onClick={() => selectEvent(event)} className="text-left bg-white border-2 border-orange-200 p-3 hover:border-orange-500 hover:shadow-md transition-all">
                <p className="font-newsreader font-bold text-sm">{event.title}</p>
                <p className="text-[10px] font-inter opacity-50 mt-1">{event.subtitle}</p>
                <p className="text-[9px] font-inter opacity-40 mt-1 uppercase tracking-widest">{event.type}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-inter opacity-40">No events found. Use custom poster.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-black p-4">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest block mb-2">Poster Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {posterTypes.map(pt => (
                <button key={pt.id} onClick={() => setPosterType(pt.id as typeof posterType)}
                  className={cn("px-3 py-2 border-2 text-xs font-inter font-bold transition-all", posterType === pt.id ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 hover:border-orange-300")}>
                  {pt.emoji} {pt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-black p-4 space-y-3">
            <div>
              <label className="text-[10px] font-inter font-black uppercase tracking-widest block mb-1">
                {posterLang === "hi" ? "शीर्षक *" : "Title *"}
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={posterLang === "hi" ? "जैसे: भाजपा स्थापना दिवस" : "e.g. BJP Foundation Day"}
                className={cn("w-full border-2 border-black px-3 py-2 text-sm font-newsreader font-bold outline-none placeholder:opacity-30", posterLang === "hi" && "hindi")} />
            </div>
            <div>
              <label className="text-[10px] font-inter font-black uppercase tracking-widest block mb-1">
                {posterLang === "hi" ? "उपशीर्षक" : "Subtitle"}
              </label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder={posterLang === "hi" ? "जैसे: 6 अप्रैल 1980 — 6 अप्रैल 2026" : "e.g. 6 April 1980 — 6 April 2026"}
                className={cn("w-full border-2 border-black px-3 py-2 text-sm font-inter outline-none placeholder:opacity-30", posterLang === "hi" && "hindi")} />
            </div>
            <div>
              <label className="text-[10px] font-inter font-black uppercase tracking-widest block mb-1">
                {posterLang === "hi" ? "विवरण" : "Description"}
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder={posterLang === "hi" ? "जैसे: 46 वर्ष राष्ट्रसेवा के" : "e.g. 46 Years of Serving the Nation"} rows={2}
                className={cn("w-full border-2 border-black px-3 py-2 text-sm font-inter outline-none placeholder:opacity-30 resize-none", posterLang === "hi" && "hindi")} />
            </div>
          </div>

          <div className="bg-white border-2 border-black p-4">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest block mb-2">Poster Style</label>
            <div className="flex gap-3 flex-wrap">
              {styleOptions.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id as typeof style)}
                  className={cn("flex items-center gap-2 px-3 py-2 border-2 text-xs font-inter font-bold transition-all", style === s.id ? "border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-gray-200")}>
                  <span className={cn("w-4 h-4 rounded-full", s.color)} /> {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-black p-4 space-y-3">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest block">
              {posterLang === "hi" ? "लेखक / पोस्टर पर नाम" : "Author / Name on Poster"}
            </label>
            <select value={authorName} onChange={e => {
              const a = authors.find(x => (posterLang === "hi" ? x.nameHi : x.name) === e.target.value);
              if (a) {
                setAuthorName(posterLang === "hi" ? a.nameHi : a.name);
                setAuthorDesignation(posterLang === "hi" ? a.designationHi : a.designation);
              } else {
                setAuthorName(e.target.value);
                setAuthorDesignation("");
              }
            }}
              className="w-full border-2 border-black px-3 py-2 text-sm font-inter outline-none bg-white">
              <option value="">{posterLang === "hi" ? "लेखक चुनें..." : "Select author..."}</option>
              {authors.map(a => {
                const displayName = posterLang === "hi" ? a.nameHi : a.name;
                const displayDesig = posterLang === "hi" ? a.designationHi : a.designation;
                return <option key={a.name} value={displayName}>{displayName} — {displayDesig}</option>;
              })}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
                placeholder={posterLang === "hi" ? "कस्टम नाम" : "Custom name"}
                className={cn("border-2 border-black px-3 py-2 text-sm font-inter outline-none placeholder:opacity-30", posterLang === "hi" && "hindi")} />
              <input type="text" value={authorDesignation} onChange={e => setAuthorDesignation(e.target.value)}
                placeholder={posterLang === "hi" ? "पदनाम" : "Designation"}
                className={cn("border-2 border-black px-3 py-2 text-sm font-inter outline-none placeholder:opacity-30", posterLang === "hi" && "hindi")} />
            </div>
          </div>

          <button onClick={generatePoster} disabled={loading || !title}
            className={cn("w-full py-4 text-white font-inter font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3",
              loading ? "bg-gray-400" : "bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:opacity-90 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]")}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating with Gemini AI...</> : <><Sparkles className="w-5 h-5" /> Generate BJP Poster</>}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-inter font-black uppercase tracking-widest">Preview</label>
              <div className="flex gap-2">
                <button onClick={downloadPoster} disabled={!generatedImage && !title}
                  className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50">
                  <Download className="w-3 h-3" /> Download
                </button>
                <button onClick={copyContent} disabled={!title}
                  className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50">
                  <CheckCircle className="w-3 h-3" /> Copy Text
                </button>
              </div>
            </div>

            <div ref={posterRef} className="relative w-full max-w-[540px] mx-auto overflow-hidden border border-gray-200" style={{ aspectRatio: "4/5" }}>
                <div className={cn("w-full h-full flex flex-col relative overflow-hidden",
                  posterType === "event" ? "bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-[#e0f7fa]"
                  : posterType === "foundation-day" ? "bg-gradient-to-b from-[#FF9933]/30 via-[#fff8e1] to-[#FF9933]/20"
                  : style === "dark" ? "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
                  : style === "tricolor" ? "bg-gradient-to-b from-[#FF9933]/20 via-white to-[#138808]/20"
                  : "bg-gradient-to-b from-[#f5e6c8] via-[#faf0d7] to-[#e8d5a8]"
                )}>
                  {/* Decorative sparkle elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 opacity-30">
                    <svg viewBox="0 0 40 40"><path d="M20 0L22 15L40 20L22 25L20 40L18 25L0 20L18 15Z" fill={posterType === "event" ? "#0284c7" : style === "dark" ? "#FFD700" : "#c4993c"} /></svg>
                  </div>
                  <div className="absolute top-14 left-6 w-5 h-5 opacity-20">
                    <svg viewBox="0 0 40 40"><path d="M20 0L22 15L40 20L22 25L20 40L18 25L0 20L18 15Z" fill={posterType === "event" ? "#0284c7" : style === "dark" ? "#FFD700" : "#c4993c"} /></svg>
                  </div>
                  {(posterType === "jayanti" || posterType === "foundation-day") && (
                    <div className="absolute top-2 left-3 text-2xl opacity-40">🚩</div>
                  )}

                  {/* Top descriptive text */}
                  <div className="pt-4 px-5 text-center">
                    {subtitle && (
                      <p className={cn("text-[11px] leading-relaxed font-semibold italic",
                        posterLang === "hi" ? "hindi" : "font-inter",
                        posterType === "event" ? "text-sky-700" : style === "dark" ? "text-amber-300/80" : "text-[#8b6914]"
                      )}>
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Center illustration — AI generated or placeholder */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                    {generatedImage ? (
                      <div className="relative z-10 w-[70%] aspect-square rounded-lg overflow-hidden shadow-xl border-2 border-white/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={generatedImage} alt={title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <>
                        <div className={cn("absolute w-40 h-40 rounded-full blur-3xl opacity-30",
                          posterType === "event" ? "bg-sky-300" : style === "dark" ? "bg-amber-500" : "bg-amber-200"
                        )} />
                        <div className={cn("relative z-10 w-28 h-28 rounded-full flex items-center justify-center border-4",
                          posterType === "event" ? "border-sky-400/30 bg-white/50" : style === "dark" ? "border-amber-500/30 bg-white/5" : "border-amber-600/20 bg-white/40"
                        )}>
                          <span className="text-5xl">
                            {posterType === "jayanti" ? "🙏" : posterType === "foundation-day" ? "🏛️" : posterType === "event" ? "🌍" : posterType === "achievement" ? "🏆" : "🪷"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Title + tribute text — always rendered by HTML for perfect Hindi */}
                  <div className="px-5 pb-2 text-center">
                    {posterType === "event" && (
                      <p className={cn("text-sm font-semibold mb-1",
                        posterLang === "hi" ? "hindi" : "font-inter",
                        "text-gray-600"
                      )}>
                        {posterLang === "hi" ? "आप सभी को" : "Wishing you all"}
                      </p>
                    )}
                    <h3 className={cn("font-black leading-tight",
                      posterType === "event" ? "text-xl text-sky-700" : "text-xl",
                      posterLang === "hi" ? "hindi" : "font-newsreader",
                      posterType !== "event" && (style === "dark" ? "text-white" : "text-[#FF6600]")
                    )}>
                      {title || (posterLang === "hi" ? "शीर्षक दर्ज करें..." : "Enter a title...")}
                    </h3>
                    <p className={cn("mt-1 text-xs text-center",
                      posterLang === "hi" ? "hindi" : "font-inter",
                      posterType === "event" ? "text-gray-600" : style === "dark" ? "text-amber-200" : "text-[#6b4c1e]"
                    )}>
                      {posterType === "jayanti" ? (posterLang === "hi" ? "की जयंती पर उन्हें कोटि-कोटि नमन" : "Birth Anniversary Tribute")
                       : posterType === "foundation-day" ? (posterLang === "hi" ? "स्थापना दिवस की हार्दिक शुभकामनाएं" : "Foundation Day Greetings")
                       : posterType === "event" ? (posterLang === "hi" ? "की ढेरों शुभकामनाएं" : "Best Wishes")
                       : posterType === "achievement" ? (posterLang === "hi" ? "पर गौरवान्वित भारत" : "Proud India")
                       : description || ""}
                    </p>
                  </div>

                  {/* Decorative divider */}
                  <div className="flex items-center justify-center gap-2 px-6 mb-1 opacity-30">
                    <div className={cn("h-px flex-1", posterType === "event" ? "bg-sky-400" : "bg-amber-700")} />
                    <svg viewBox="0 0 40 20" className="w-6 h-3"><path d="M0,10 Q10,0 20,10 Q30,20 40,10" fill="none" stroke={posterType === "event" ? "#0284c7" : "#c4993c"} strokeWidth="1.5" /></svg>
                    <div className={cn("h-px flex-1", posterType === "event" ? "bg-sky-400" : "bg-amber-700")} />
                  </div>

                  {/* Bottom bar — BJP style */}
                  <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-[#004d40] via-[#00695c] to-[#004d40]">
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <span className="text-2xl">🪷</span>
                      <div className="w-8 flex flex-col">
                        <div className="h-[2px] bg-[#FF9933]" />
                        <div className="h-[2px] bg-white" />
                        <div className="h-[2px] bg-[#138808]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-base font-black text-white leading-tight truncate",
                        posterLang === "hi" ? "hindi" : "font-newsreader"
                      )}>
                        {authorName || (posterLang === "hi" ? "लेखक का नाम" : "Author Name")}
                      </p>
                      {(authorDesignation || !authorName) && (
                        <p className={cn("text-[9px] text-white/70 mt-0.5 truncate",
                          posterLang === "hi" ? "hindi" : "font-inter"
                        )}>
                          {authorDesignation || (posterLang === "hi" ? "पदनाम" : "Designation")}
                        </p>
                      )}
                    </div>
                    {/* Author photo placeholder */}
                    <div className="w-12 h-12 rounded-lg bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0 overflow-hidden">
                      <Users className="w-5 h-5 text-white/60" />
                    </div>
                  </div>
                </div>
            </div>

            {generatedText && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-xs font-inter whitespace-pre-wrap">{generatedText}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BjpEpaperGenerator() {
  const [topic, setTopic] = useState("");
  const [authorName, setAuthorName] = useState("Aditya Vani");
  const [authorBio, setAuthorBio] = useState("Chief Editor, LoktantraVani");
  const [theme, setTheme] = useState<"saffron" | "dark">("saffron");
  const [generating, setGenerating] = useState(false);
  const [queuedId, setQueuedId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [trending, setTrending] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchTrending = async () => {
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trending-topics", topic: "BJP NDA Government development schemes", category: "Politics" }),
      });
      const data = await res.json();
      if (data.topics) setTrending(data.topics.slice(0, 10));
    } catch { /* */ }
  };

  useEffect(() => { fetchTrending(); }, []);

  const handleGenerate = async (genTopic: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "twitter-trending",
          topic: genTopic,
          tone: "nationalist",
          category: "Politics",
          language: "en",
          wordCount: 500
        }),
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
        if (data.savedId) setQueuedId(data.savedId);
      }
      else if (data.topics) setTrending(data.topics.slice(0, 10)); // Handle fallback
    } catch { /* */ }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase text-[#FF9933]">BJP+ Social E-Paper</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
            Generate Saffron-themed digital news clippings from social news
          </p>
        </div>
        <button onClick={fetchTrending} className="px-3 py-1.5 border-2 border-[#FF9933] text-[#FF9933] text-[10px] font-inter font-black uppercase">Refresh Trend</button>
      </div>

      <div className="bg-white border-4 border-[#FF9933] p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-inter font-black uppercase text-[#FF9933] opacity-60">Author Name</label>
            <input 
              type="text" 
              value={authorName} 
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Aditya Vani"
              className="w-full border-2 border-black p-2 font-inter text-sm outline-none bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-inter font-black uppercase text-[#FF9933] opacity-60">Author Bio</label>
            <input 
              type="text" 
              value={authorBio} 
              onChange={(e) => setAuthorBio(e.target.value)}
              placeholder="e.g. Political Analyst"
              className="w-full border-2 border-black p-2 font-inter text-sm outline-none bg-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-inter font-black uppercase text-[#FF9933] opacity-60">Enter Topic or URL (X/Twitter Link)</label>
          <div className="flex gap-2">
             <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste X/Twitter link or enter a development topic..."
              className="flex-1 border-2 border-black p-3 font-inter text-sm outline-none"
             />
             <button 
              onClick={() => { setQueuedId(null); handleGenerate(topic); }}
              disabled={generating}
              className="bg-[#FF9933] text-white px-8 font-inter font-black uppercase text-xs hover:bg-black transition-colors flex items-center gap-2"
             >
               {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract & Queue"}
             </button>
          </div>
          {queuedId && (
            <p className="text-[9px] font-inter font-black text-green-600 uppercase tracking-widest mt-1">
              ✓ Article Draft Queued for Editorial Review (ID: {queuedId})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-inter font-black uppercase text-[#FF9933] opacity-60">Choose Design Theme</label>
          <div className="flex gap-4">
            {[
              { id: "saffron", label: "Saffron Pride", color: "bg-[#FF9933]" },
              { id: "dark", label: "Deep Night", color: "bg-black" },
              { id: "lok-post", label: "2x2 Lok Post", color: "bg-primary" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={cn(
                  "flex-1 py-3 px-4 text-[10px] font-inter font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all",
                  theme === t.id ? "border-[#FF9933] scale-105" : "border-black/5 opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", t.color)} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {trending.map(t => (
            <button 
              key={t} 
              onClick={() => { setTopic(t); handleGenerate(t); }}
              className="px-2 py-1 bg-[#FF9933]/10 border border-[#FF9933]/30 text-[#FF9933] text-[9px] font-inter font-bold uppercase hover:bg-[#FF9933] hover:text-white transition-all"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="text-sm font-inter font-black uppercase text-black/40">Canvas Preview</h3>
              <div 
                ref={cardRef} 
                className={cn(
                  "w-full aspect-square border-8 p-8 flex flex-col relative overflow-hidden transition-all duration-500 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)]",
                  theme === "saffron" && "bg-[#fff8f0] border-[#FF9933] text-black",
                  theme === "dark" && "bg-[#0d0d0d] border-black text-white",
                  false && "bg-white border-black text-black" // white theme removed
                )}
              >
                <div className={cn(
                  "border-b-4 pb-4 mb-6 flex justify-between items-end",
                  theme === "dark" ? "border-white/20" : "border-black"
                )}>
                   <div>
                     <h2 className={cn(
                       "text-4xl font-newsreader font-black uppercase leading-none",
                       theme === "saffron" ? "text-[#FF9933]" : theme === "dark" ? "text-white" : "text-black"
                     )}>
                       BJP<span className={cn(theme === "dark" ? "text-[#FF9933]" : "text-black", "italic")}>+</span>
                     </h2>
                     <p className="text-[10px] font-inter font-black opacity-60 uppercase mt-1">Digital Samvaad</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-inter font-black opacity-30 uppercase">{new Date().toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="flex-1 space-y-6">
                   <h1 className={cn("text-3xl font-newsreader font-black leading-tight", result.headlineHi && "hindi")}>
                      {result.headlineHi || result.headline}
                   </h1>
                   <div className="aspect-video w-full border-4 border-black overflow-hidden bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <img src={result.imageUrl} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" />
                   </div>

                   <p className="text-sm font-inter leading-relaxed opacity-80 font-bold italic">
                      {result.summary}
                   </p>
                </div>

                <div className={cn(
                  "mt-8 pt-4 border-t-2 flex items-center justify-between",
                  theme === "dark" ? "border-white/10" : "border-black/10"
                )}>
                   <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-[#FF9933] flex items-center justify-center font-newsreader font-black text-white text-lg rounded-full">
                        {authorName[0]}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[10px] font-inter font-black uppercase leading-none">{authorName}</div>
                        <div className="text-[8px] font-inter opacity-60 uppercase mt-1">{authorBio}</div>
                      </div>
                   </div>
                   <div className="bg-white p-1.5 border-2 border-black">
                      <QRCodeSVG value={`https://loktantravani.in/politics/${result.headline?.toLowerCase().replace(/\s+/g,'-')}`} size={48} />
                   </div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-150">
                   <h1 className="text-9xl font-black rotate-[-45deg] whitespace-nowrap">NEO BHARAT</h1>
                </div>
              </div>
           </div>

           <div className="space-y-6 flex flex-col justify-center">
              <div className="bg-white border-2 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="text-sm font-inter font-black uppercase mb-4">Sharing Controls</h4>
                <div className="space-y-4">
                  <button 
                    onClick={async () => {
                      if (!cardRef.current) return;
                      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
                      const link = document.createElement('a');
                      link.download = `bjp-plus-${Date.now()}.png`;
                      link.href = dataUrl;
                      link.click();
                    }}
                    className="w-full py-4 bg-black text-white font-inter font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#FF9933] transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Social Copy
                  </button>
                  <p className="text-[9px] font-inter font-bold opacity-40 uppercase text-center">Optimized for WhatsApp Status & Instagram Story</p>
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-black/20 text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#FF9933]" />
                <p className="text-[10px] font-inter font-black uppercase opacity-60">AI is analyzing BJP+ impacts on social media to keep your feed updated.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function AuthModalInline({ onSuccess }: { onSuccess: () => void }) {

  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErr] = useState("");
  const [loading, setLd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErr("Enter email and password"); return; }
    setLd(true); setErr("");
    try {
      await signInWithEmail(email, password);
      onSuccess();
    } catch (err: unknown) {
      setErr((err as Error).message);
    }
    setLd(false);
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-[11px] font-inter text-red-600 bg-red-50 p-2 border border-red-200">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border-2 border-black p-3 text-sm font-inter outline-none" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border-2 border-black p-3 text-sm font-inter outline-none" />
        <button type="submit" disabled={loading} className="w-full py-3 bg-black text-white font-inter font-black text-xs uppercase tracking-widest hover:bg-primary disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-black/10" /><span className="text-[9px] font-inter opacity-40 uppercase">or</span><span className="flex-1 h-px bg-black/10" />
      </div>
      <button onClick={async () => { try { await signInWithGoogle(); onSuccess(); } catch {} }} className="w-full py-3 border-2 border-black font-inter font-black text-xs uppercase tracking-widest hover:bg-black/5 flex items-center justify-center gap-2">
        Continue with Google
      </button>
    </div>
  );
}

/* ── BJP Toolkit Panel ─────────────────────────────────────────── */
function BjpToolkitPanel() {
  const [tab, setTab] = useState<"fact-checker" | "modi-scorecard" | "talking-points">("fact-checker");

  // Fact Checker state
  const [fcLoading, setFcLoading] = useState(false);
  const [fcProgress, setFcProgress] = useState("");
  const [fcResults, setFcResults] = useState<Array<{ id: string; title: string; verdict: string; claim: string; bjpCounter: string }>>([]);

  // Govt Report Card state
  const [msLoading, setMsLoading] = useState(false);
  const [msSchemes, setMsSchemes] = useState<Array<{ name: string; beneficiaries: string; growth: string; achievement: string }>>([]);

  // Talking Points state
  const [tpLoading, setTpLoading] = useState(false);
  const [tpBrief, setTpBrief] = useState<{ headline: string; points: Array<{ title: string; point: string; data: string; hashtag: string }> } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateFactChecks = async () => {
    setFcLoading(true);
    setFcProgress("Scanning opposition statements...");
    try {
      const res = await fetch("/api/opposition-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.type === "progress") setFcProgress(msg.message || "Processing...");
              if (msg.type === "article") {
                setFcResults(prev => [msg.article, ...prev]);
              }
            } catch {}
          }
        }
      }
      setFcProgress("");
    } catch {
      setFcProgress("Generation failed");
    }
    setFcLoading(false);
  };

  const refreshScorecard = async () => {
    setMsLoading(true);
    try {
      const res = await fetch("/api/modi-scorecard", { method: "POST" });
      const data = await res.json();
      setMsSchemes(data.schemes || []);
    } catch {}
    setMsLoading(false);
  };

  const generateTalkingPoints = async () => {
    setTpLoading(true);
    try {
      const res = await fetch("/api/talking-points", { method: "POST" });
      const data = await res.json();
      if (data.points) setTpBrief(data);
    } catch {}
    setTpLoading(false);
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `talking-points-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download card", err);
    }
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const TABS = [
    { id: "fact-checker" as const, label: "Fact Checker" },
    { id: "modi-scorecard" as const, label: "Govt Report Card" },
    { id: "talking-points" as const, label: "Talking Points" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[#FF9933]" />
        <h2 className="text-3xl font-newsreader font-black uppercase">BJP Toolkit</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-black/10 pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-5 py-3 text-xs font-inter font-black uppercase tracking-widest transition-all border-b-2 -mb-[2px]",
              tab === t.id
                ? "border-[#FF9933] text-[#FF9933]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Fact Checker Tab ─── */}
      {tab === "fact-checker" && (
        <div className="bg-white border-2 border-black p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-newsreader font-black">Fact Checker</h3>
              <p className="text-xs font-inter opacity-50">Generate AI fact-checks of opposition claims</p>
            </div>
            <button
              onClick={generateFactChecks}
              disabled={fcLoading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {fcLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {fcLoading ? (fcProgress || "Scanning...") : "Generate Fact Checks"}
            </button>
          </div>
          {fcResults.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fcResults.map((fc, i) => (
                <div key={fc.id || i} className="border border-black/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-inter font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 text-red-600 rounded">
                      {fc.verdict}
                    </span>
                    <h4 className="text-sm font-newsreader font-black flex-1">{fc.title}</h4>
                  </div>
                  <p className="text-xs font-inter opacity-60"><strong>Claim:</strong> {fc.claim}</p>
                  <p className="text-xs font-inter opacity-60"><strong>Facts:</strong> {fc.bjpCounter}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Govt Report Card Tab ─── */}
      {tab === "modi-scorecard" && (
        <div className="bg-white border-2 border-black p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-newsreader font-black">Govt Report Card</h3>
              <p className="text-xs font-inter opacity-50">Refresh government scheme data with latest figures</p>
            </div>
            <button
              onClick={refreshScorecard}
              disabled={msLoading}
              className="px-5 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-white text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {msLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {msLoading ? "Refreshing..." : "Refresh Scorecard"}
            </button>
          </div>
          {msSchemes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {msSchemes.map((s, i) => (
                <div key={i} className="border border-black/10 p-4">
                  <h4 className="text-sm font-newsreader font-black">{s.name}</h4>
                  <p className="text-lg font-newsreader font-black text-[#FF9933]">{s.beneficiaries}</p>
                  {s.growth && <p className="text-[10px] font-inter text-green-600 font-bold">{s.growth}</p>}
                  {s.achievement && <p className="text-xs font-inter opacity-50 mt-1">{s.achievement}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Talking Points Tab ─── */}
      {tab === "talking-points" && (
        <div className="bg-white border-2 border-black p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-newsreader font-black">Talking Points</h3>
              <p className="text-xs font-inter opacity-50">Generate today&apos;s 5 BJP talking points with shareable card</p>
            </div>
            <button
              onClick={generateTalkingPoints}
              disabled={tpLoading}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {tpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {tpLoading ? "Generating..." : "Generate Today's 5 Points"}
            </button>
          </div>

          {tpBrief && (
            <div className="space-y-4">
              {/* Shareable card */}
              <div
                ref={cardRef}
                style={{ background: "linear-gradient(135deg, #FF9933 0%, #FF6600 50%, #CC5200 100%)" }}
                className="rounded-xl p-8 text-white max-w-lg mx-auto"
              >
                <div className="text-center mb-5">
                  <p className="text-[10px] font-inter font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                    {todayStr}
                  </p>
                  <h3 className="text-2xl font-newsreader font-black mb-1">Today&apos;s 5 Points</h3>
                  <p className="text-xs font-inter text-white/70">Every BJP supporter should know these facts today</p>
                </div>
                <div className="space-y-2.5">
                  {tpBrief.points.map((tp, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/15 backdrop-blur-sm rounded-lg p-3">
                      <div className="w-6 h-6 shrink-0 bg-white text-[#FF6600] rounded-full flex items-center justify-center font-black text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-inter font-bold leading-snug">{tp.title}</p>
                        {tp.data && <p className="text-[10px] font-inter text-white/60 mt-0.5">📊 {tp.data}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 text-center border-t border-white/20 pt-3">
                  <p className="text-[10px] font-inter font-black uppercase tracking-[0.2em] text-white/50">
                    LoktantraVani — India&apos;s 1st AI Newspaper
                  </p>
                </div>
              </div>

              {/* Download button */}
              <div className="text-center">
                <button
                  onClick={downloadCard}
                  className="px-6 py-2.5 bg-black text-white text-xs font-inter font-black uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-gray-800"
                >
                  <Download className="w-4 h-4" /> Download as PNG
                </button>
              </div>

              {/* Points list */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tpBrief.points.map((tp, i) => (
                  <div key={i} className="border border-black/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 shrink-0 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-newsreader font-black">{tp.title}</h4>
                        <p className="text-xs font-inter opacity-60 mt-1">{tp.point}</p>
                        {tp.hashtag && (
                          <span className="inline-block mt-1 text-[10px] font-inter font-bold text-orange-500">#{tp.hashtag}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { userRole, isLoggedIn, authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const { setTheme, theme: currentTheme } = useTheme();
  const prevTheme = useRef(currentTheme);

  // Force light mode on admin page
  useEffect(() => {
    prevTheme.current = currentTheme;
    if (currentTheme !== "light") setTheme("light");
    return () => { if (prevTheme.current && prevTheme.current !== "light") setTheme(prevTheme.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard — must be logged in as admin or author
  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FDF5E6] flex items-center justify-center" data-theme="light" style={{ colorScheme: "light" }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-inter opacity-40">Loading admin panel...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || (userRole !== "admin" && userRole !== "author")) {
    return (
      <main className="min-h-screen bg-[#FDF5E6] flex items-center justify-center" data-theme="light" style={{ colorScheme: "light" }}>
        <div className="bg-[#FFF8EE] border-2 border-[#D4A574] p-12 shadow-[8px_8px_0px_0px_rgba(180,120,60,0.3)] text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-600 text-white flex items-center justify-center font-newsreader font-black text-2xl mx-auto mb-6">
            LV
          </div>
          <h1 className="text-3xl font-newsreader font-black uppercase mb-2">LoktantraVani</h1>
          <p className="text-sm font-inter opacity-60 mb-6">
            Sign in to continue
          </p>
          {!isLoggedIn ? (
            <div className="text-left">
              <AuthModalInline onSuccess={() => {}} />
            </div>
          ) : (
            <div>
              <p className="text-sm font-inter text-red-600 mb-4">
                Access restricted. Contact the editor for access.
              </p>
              <Link href="/" className="text-sm font-inter text-primary hover:underline">
                ← Back to Homepage
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF5E6]" data-theme="light" style={{ colorScheme: "light" }}>
      {/* Top Header */}
      <div className="bg-[#1a1a1a] text-white py-3 px-4 md:py-4 md:px-8 border-b-4 border-red-600 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 flex items-center justify-center text-white font-newsreader font-black text-lg md:text-xl">
            LV
          </div>
          <h1 className="text-sm md:text-xl font-newsreader font-black uppercase tracking-tighter">
            VANI ADMIN
          </h1>
        </div>
        <div className="flex items-center gap-3 md:gap-8">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-inter font-black tracking-widest opacity-60">
              FIREBASE CONNECTED
            </span>
          </div>
          <Link
            href="/"
            className="text-[10px] font-inter font-black tracking-widest hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">VIEW LIVE SITE</span>
            <span className="sm:hidden">SITE</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#FFF8EE] pt-16 p-4 overflow-y-auto space-y-2" onClick={e => e.stopPropagation()}>
            <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-3">
              Content Control
            </p>
            {sidebarItems.filter(i => !["card-studio","video-studio"].includes(i.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-inter font-black uppercase tracking-widest transition-all rounded",
                  activeTab === item.id
                    ? "bg-red-600 text-white"
                    : "hover:bg-red-50 text-gray-500 hover:text-red-600"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t border-black/5 space-y-2 mt-3">
              <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-3">Studio</p>
              {sidebarItems.filter(i => ["card-studio","video-studio"].includes(i.id)).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-inter font-black uppercase tracking-widest transition-all rounded",
                    activeTab === item.id
                      ? "bg-black text-white"
                      : "hover:bg-primary/5 text-gray-600 hover:text-primary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#FFF8EE] border-r-2 border-[#D4A574] min-h-screen p-6 space-y-8 hidden md:block shrink-0">
          <div className="space-y-2">
            <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-4">
              Content Control
            </p>
            {sidebarItems.filter(i => !["card-studio","video-studio"].includes(i.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-xs font-inter font-black uppercase tracking-widest transition-all",
                  activeTab === item.id
                    ? "bg-red-600 text-white"
                    : "hover:bg-red-50 text-gray-500 hover:text-red-600"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-black/5 space-y-2">
            <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-4">
              Lok Post Studio
            </p>
            {sidebarItems.filter(i => ["card-studio","video-studio"].includes(i.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-xs font-inter font-black uppercase tracking-widest transition-all",
                  activeTab === item.id
                    ? "bg-red-600 text-white"
                    : "hover:bg-red-50 text-gray-500 hover:text-red-600"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-8 border-t border-black/5 space-y-2">
            <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-4">
              Identity
            </p>
            <div className="flex items-center gap-3 p-2 bg-red-600 text-white border-l-4 border-red-800">
              <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-bold">
                A
              </div>
              <div>
                <p className="text-[10px] font-inter font-black leading-none">Aditya Vani</p>
                <p className="text-[9px] font-inter opacity-60 leading-none mt-1 uppercase tracking-tighter font-bold">
                  Chief Editor
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-inter font-black uppercase tracking-widest text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Exit Admin
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-3 sm:p-4 md:p-8 min-w-0">
          {activeTab === "dashboard" && <DashboardStats />}
          {activeTab === "approval" && <ApprovalQueue />}
          {activeTab === "user-submissions" && <UserSubmissionsPanel />}
          {activeTab === "posts" && <PostsList />}
          {activeTab === "new-post" && <NewPostPanel />}
          {activeTab === "bulk-generate" && <BulkGeneratePanel />}
          {/* mandala tab removed — merged into lokpost */}
          {activeTab === "lokpost" && <LokPostCardPanel />}
          {activeTab === "daily" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-newsreader font-black uppercase">Daily Edition Manager</h2>
              <div className="bg-white border-2 border-black p-8">
                <p className="text-sm font-inter opacity-60">
                  Select featured posts for today&apos;s edition, write editor&apos;s note, and manage the daily newspaper layout.
                </p>
                <Link href="/daily" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white text-xs font-inter font-black uppercase tracking-widest">
                  <Newspaper className="w-4 h-4" /> Preview Today&apos;s Edition
                </Link>
              </div>
            </div>
          )}
          {activeTab === "authors" && <AuthorsManagementPanel />}
          {activeTab === "my-profile" && <AuthorProfilePanel />}
          {activeTab === "comments" && <CommentsModeration />}
          {activeTab === "subscribers" && <SubscribersPanel />}
          {activeTab === "polls" && <PollsPanel />}
          {activeTab === "push-notifs" && <PushNotificationsPanel />}
          <div style={{ display: activeTab === "news-agent" ? "block" : "none" }}><DeepSearchAgentPanel /></div>
          {activeTab === "poster-studio" && <PosterStudio />}
          {activeTab === "podcast-studio" && <PodcastStudio />}
          {activeTab === "bjp-toolkit" && <BjpToolkitPanel />}
          {activeTab === "card-studio" && (
            <div className="space-y-4 h-[calc(100vh-80px)]">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-newsreader font-black uppercase">Card Studio</h2>
                <span className="text-[9px] font-inter font-black opacity-40 uppercase tracking-widest">Lok Post Pro</span>
              </div>
              <iframe
                src="/lok-post/v24.html"
                className="w-full border-2 border-black bg-white"
                style={{ height: "calc(100vh - 140px)" }}
                title="Card Studio"
              />
            </div>
          )}
          {activeTab === "video-studio" && (
            <div className="space-y-4 h-[calc(100vh-80px)]">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-newsreader font-black uppercase">Video Studio</h2>
                <span className="text-[9px] font-inter font-black opacity-40 uppercase tracking-widest">Lok Post Video</span>
              </div>
              <iframe
                src="/lok-post/video.html"
                className="w-full border-2 border-black bg-white"
                style={{ height: "calc(100vh - 140px)" }}
                title="Video Studio"
              />
            </div>
          )}
          {activeTab === "epaper" && <EPaperPanel />}
          {activeTab === "ads" && <AdvertisementPanel />}
          {activeTab === "settings" && <BjpEpaperGenerator />}
        </section>
      </div>
    </main>
  );
}
