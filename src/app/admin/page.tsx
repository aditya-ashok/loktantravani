"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import PostEditor from "@/components/admin/PostEditor";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { SEED_POSTS } from "@/lib/seed-data";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: Layout },
  { id: "posts", label: "All Posts", icon: FileText },
  { id: "new-post", label: "New Post", icon: Plus },
  { id: "mandala", label: "Cartoon Mandala", icon: Sparkles },
  { id: "daily", label: "Daily Edition", icon: Newspaper },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "news-agent", label: "News Agent", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];

function DashboardStats() {
  const totalPosts = SEED_POSTS.length;
  const totalViews = SEED_POSTS.reduce((sum, p) => sum + p.viewCount, 0);
  const totalReactions = SEED_POSTS.reduce(
    (sum, p) => sum + Object.values(p.reactions).reduce((a, b) => a + b, 0),
    0
  );

  const stats = [
    { label: "Total Posts", value: totalPosts, icon: FileText, color: "bg-primary" },
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "bg-black" },
    { label: "Reactions", value: totalReactions.toLocaleString(), icon: TrendingUp, color: "bg-green-600" },
    { label: "Subscribers", value: "1,247", icon: Users, color: "bg-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase mb-2">Dashboard</h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
          LoktantraVani Editorial Analytics
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
            <p className="text-3xl font-newsreader font-black">{stat.value}</p>
            <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 mt-1">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="px-4 py-2 bg-primary text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90 flex items-center gap-2">
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

      {/* Recent Posts */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Recent Posts</h3>
        <div className="space-y-3">
          {SEED_POSTS.slice(0, 5).map((post) => (
            <div key={post.slug} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-newsreader font-bold">{post.title}</p>
                <div className="flex items-center gap-3 text-[9px] font-inter font-bold opacity-40 uppercase mt-1">
                  <span>{post.category}</span>
                  <span>&bull;</span>
                  <span>{post.author}</span>
                  <span>&bull;</span>
                  <span className={post.status === "published" ? "text-green-600" : "text-yellow-600"}>
                    {post.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-inter font-bold">{post.viewCount.toLocaleString()}</p>
                <p className="text-[9px] font-inter opacity-40">views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Category Breakdown
        </h3>
        <div className="space-y-3">
          {["Geopolitics", "IR", "Politics", "Tech", "GenZ", "Ancient India", "Cartoon Mandala"].map((cat) => {
            const count = SEED_POSTS.filter((p) => p.category === cat).length;
            const pct = Math.round((count / SEED_POSTS.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-4">
                <span className="text-xs font-inter font-bold w-32 truncate">{cat}</span>
                <div className="flex-1 h-6 bg-black/5 relative">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
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

function PostsList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-newsreader font-black uppercase">All Posts</h2>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
            {SEED_POSTS.length} articles in the database
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-black overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Title</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest hidden md:table-cell">Author</th>
              <th className="text-left px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Status</th>
              <th className="text-right px-4 py-3 text-[10px] font-inter font-black uppercase tracking-widest">Views</th>
            </tr>
          </thead>
          <tbody>
            {SEED_POSTS.map((post) => (
              <tr key={post.slug} className="border-b border-black/5 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-4">
                  <p className="text-sm font-newsreader font-bold">{post.title}</p>
                  <p className="text-[9px] font-inter opacity-40 mt-1">{post.slug}</p>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="bg-primary/10 text-primary px-2 py-1 text-[9px] font-inter font-black uppercase">
                    {post.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-inter hidden md:table-cell">{post.author}</td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "px-2 py-1 text-[9px] font-inter font-black uppercase",
                    post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-sm font-inter font-bold">
                  {post.viewCount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function NewsAgentPanel() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Geopolitics");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 3000));
    setGenerating(false);
    setGenerated(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-newsreader font-black uppercase flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" /> News Agent
        </h2>
        <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest mt-1">
          AI-powered article generation from RSS feeds
        </p>
      </div>

      <div className="bg-white border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-6">Generate Article</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Topic / Keywords</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., India-China border talks, Quad 2026 summit..."
              className="w-full border-2 border-black p-3 font-inter text-sm outline-none placeholder:opacity-30"
            />
          </div>
          <div>
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 block mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-2 border-black p-3 font-inter font-bold text-sm outline-none"
            >
              {["Geopolitics", "IR", "Politics", "Tech", "GenZ", "Ancient India"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !topic}
            className={cn(
              "w-full py-4 font-inter font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              generating
                ? "bg-primary/50 text-white cursor-wait"
                : "bg-black text-white hover:bg-primary"
            )}
          >
            <Bot className="w-4 h-4" />
            {generating ? "COLLECTING & GENERATING..." : "GENERATE FROM RSS FEEDS"}
          </button>
        </div>
      </div>

      {generated && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-green-500 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="text-sm font-inter font-black text-green-600 uppercase tracking-widest">Draft Generated</span>
          </div>
          <h4 className="text-2xl font-newsreader font-black mb-2">
            New Developments in {topic}
          </h4>
          <p className="text-sm font-inter opacity-60 mb-4">
            An AI-generated article based on {category} RSS feeds has been saved as a draft. Review and edit before publishing.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white text-xs font-inter font-black uppercase tracking-widest hover:opacity-90">
              Review & Edit
            </button>
            <button className="px-4 py-2 border-2 border-black text-xs font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white">
              Publish as Draft
            </button>
            <button className="px-4 py-2 text-xs font-inter font-black uppercase tracking-widest text-red-500 hover:bg-red-50">
              Discard
            </button>
          </div>
        </motion.div>
      )}

      {/* RSS Sources */}
      <div className="bg-white border-2 border-black p-6">
        <h3 className="text-sm font-inter font-black uppercase tracking-widest mb-4">Configured RSS Sources</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "NDTV Politics", "The Hindu World", "Hindustan Times",
            "Reuters India", "Al Jazeera Asia", "TechCrunch India",
            "Scroll.in", "The Diplomat", "Foreign Policy"
          ].map((source) => (
            <div key={source} className="flex items-center gap-2 text-xs font-inter py-2 px-3 bg-black/5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {source}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { userRole } = useAuth();

  return (
    <main className="min-h-screen bg-[#f3f4f6]">
      {/* Top Header */}
      <div className="bg-[#1a1c1c] text-white py-4 px-8 border-b-4 border-primary flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary flex items-center justify-center text-white font-newsreader font-black text-xl">
            LV
          </div>
          <h1 className="text-xl font-newsreader font-black uppercase tracking-tighter">
            VANI ADMIN CENTER
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-inter font-black tracking-widest opacity-60">
              FIREBASE CONNECTED
            </span>
          </div>
          <Link
            href="/"
            className="text-[10px] font-inter font-black tracking-widest hover:text-primary transition-colors flex items-center gap-2"
          >
            VIEW LIVE SITE <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r-2 border-black min-h-screen p-6 space-y-8 hidden md:block shrink-0">
          <div className="space-y-2">
            <p className="text-[9px] font-inter font-black opacity-30 uppercase tracking-[0.2em] mb-4">
              Content Control
            </p>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-xs font-inter font-black uppercase tracking-widest transition-all",
                  activeTab === item.id
                    ? "bg-black text-white"
                    : "hover:bg-primary/5 text-gray-400 hover:text-primary"
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
            <div className="flex items-center gap-3 p-2 bg-black text-white border-l-4 border-primary">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">
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
        <section className="flex-1 p-8">
          {activeTab === "dashboard" && <DashboardStats />}
          {activeTab === "posts" && <PostsList />}
          {activeTab === "new-post" && <PostEditor />}
          {activeTab === "mandala" && (
            <div className="space-y-6">
              <h2 className="text-3xl font-newsreader font-black uppercase">Cartoon Mandala</h2>
              <PostsList />
            </div>
          )}
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
          {activeTab === "comments" && <CommentsModeration />}
          {activeTab === "news-agent" && <NewsAgentPanel />}
          {activeTab === "settings" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
              <Settings className="w-16 h-16 text-black opacity-10" />
              <h2 className="text-3xl font-newsreader font-black uppercase">Editorial Settings</h2>
              <p className="text-xs font-inter font-black opacity-40 uppercase tracking-widest">
                Configuration panel under development
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
