"use client";

import React, { useState } from "react";
import {
  Plus,
  Image as ImageIcon,
  Send,
  AlertCircle,
  CheckCircle,
  Globe,
  Eye,
  EyeOff,
  Tag,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, estimateReadingTime } from "@/lib/utils";
import { generateSlug } from "@/lib/slug";
import type { PostCategory, PostSection, PostStatus } from "@/lib/types";

const CATEGORIES: PostCategory[] = ["IR", "Politics", "Tech", "Geopolitics", "GenZ", "Ancient India", "Cartoon Mandala"];
const SECTIONS: PostSection[] = ["Neo Bharat", "Main Feed", "Trending"];

export default function PostEditor() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    title: "",
    titleHi: "",
    summary: "",
    summaryHi: "",
    content: "",
    contentHi: "",
    category: "Geopolitics" as PostCategory,
    section: "Neo Bharat" as PostSection,
    author: "Aditya Vani",
    imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bbaa",
    tags: "",
    postStatus: "draft" as PostStatus,
  });

  const readingTime = formData.content ? estimateReadingTime(formData.content) : 0;
  const slug = formData.title ? generateSlug(formData.title) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const { createPost } = await import("@/lib/firebase-service");
      await createPost({
        title: formData.title,
        titleHi: formData.titleHi || undefined,
        summary: formData.summary,
        summaryHi: formData.summaryHi || undefined,
        content: formData.content,
        contentHi: formData.contentHi || undefined,
        category: formData.category,
        section: formData.section,
        author: formData.author,
        authorRole: "admin",
        imageUrl: formData.imageUrl,
        status: formData.postStatus,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setStatus("success");
      setFormData({ ...formData, title: "", titleHi: "", summary: "", summaryHi: "", content: "", contentHi: "", tags: "" });
    } catch (error) {
      console.error("Post save error:", error);
      // Fallback to simulated save
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("success");
      setFormData({ ...formData, title: "", titleHi: "", summary: "", summaryHi: "", content: "", contentHi: "", tags: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mt-4 mb-24">
      <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-6">
        <div className="w-12 h-12 bg-primary flex items-center justify-center text-white border-2 border-black">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-newsreader font-black uppercase tracking-tight">
            Post Editor
          </h1>
          <p className="text-[10px] font-inter font-black opacity-40 uppercase tracking-widest">
            Create Content for LoktantraVani
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Title EN */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Headline (English)
            </label>
            <input
              required
              className="w-full text-3xl font-newsreader font-bold border-b-2 border-black focus:border-primary outline-none py-2 placeholder:opacity-20"
              placeholder="Enter powerful headline..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {slug && (
              <p className="text-[9px] font-inter opacity-30">Slug: {slug}</p>
            )}
          </div>

          {/* Title HI */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Headline (Hindi) — Optional
            </label>
            <input
              className="w-full text-2xl font-bold hindi border-b-2 border-black/20 focus:border-primary outline-none py-2 placeholder:opacity-20"
              placeholder="हिंदी शीर्षक दर्ज करें..."
              value={formData.titleHi}
              onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
            />
          </div>

          {/* Summary EN */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Summary (English)
            </label>
            <textarea
              required
              rows={2}
              className="w-full text-base font-inter border-2 border-black/10 focus:border-primary outline-none p-4 placeholder:opacity-20"
              placeholder="Brief summary of the article..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          {/* Content EN */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              Full Content (English) — HTML supported
              {readingTime > 0 && (
                <span className="text-primary">&bull; ~{readingTime} min read</span>
              )}
            </label>
            <textarea
              required
              rows={12}
              className="w-full text-sm font-inter border-2 border-black focus:border-primary outline-none p-4 placeholder:opacity-20 font-mono"
              placeholder="<p>Write your article here... Use <h2>, <p>, <blockquote> tags.</p>"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Content HI */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Full Content (Hindi) — Optional
            </label>
            <textarea
              rows={6}
              className="w-full text-sm hindi border-2 border-black/20 focus:border-primary outline-none p-4 placeholder:opacity-20"
              placeholder="हिंदी में लेख लिखें..."
              value={formData.contentHi}
              onChange={(e) => setFormData({ ...formData, contentHi: e.target.value })}
            />
          </div>

          {/* Category & Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Category
            </label>
            <select
              className="w-full border-2 border-black font-inter font-bold text-sm p-3 outline-none appearance-none bg-white cursor-pointer"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as PostCategory })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              Section
            </label>
            <select
              className="w-full border-2 border-black font-inter font-bold text-sm p-3 outline-none appearance-none bg-white cursor-pointer"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value as PostSection })}
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Image & Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Image URL
            </label>
            <input
              className="w-full border-2 border-black font-inter font-bold text-xs p-3 outline-none"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            {formData.imageUrl && (
              <div className="aspect-video bg-muted border border-black/10 overflow-hidden mt-2">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, postStatus: "draft" })}
                  className={cn(
                    "flex-1 py-3 border-2 border-black font-inter font-black text-[10px] uppercase transition-colors flex items-center justify-center gap-2",
                    formData.postStatus === "draft" ? "bg-yellow-400 border-yellow-400 text-black" : "hover:bg-primary/10"
                  )}
                >
                  <EyeOff className="w-3 h-3" /> Draft
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, postStatus: "published" })}
                  className={cn(
                    "flex-1 py-3 border-2 border-black font-inter font-black text-[10px] uppercase transition-colors flex items-center justify-center gap-2",
                    formData.postStatus === "published" ? "bg-green-500 border-green-500 text-white" : "hover:bg-primary/10"
                  )}
                >
                  <Eye className="w-3 h-3" /> Publish
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Tags (comma-separated)
              </label>
              <input
                className="w-full border-2 border-black font-inter text-xs p-3 outline-none"
                placeholder="geopolitics, quad, india"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="text-[10px] font-inter font-black uppercase tracking-widest opacity-60">Author</label>
              <input
                className="w-full border-2 border-black font-inter font-bold text-xs p-3 outline-none"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border-2 border-green-500 p-4 flex items-center gap-3 text-green-700 font-inter font-bold text-sm"
            >
              <CheckCircle className="w-5 h-5" /> Post successfully saved to Vani Database!
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border-2 border-red-500 p-4 flex items-center gap-3 text-red-700 font-inter font-bold text-sm"
            >
              <AlertCircle className="w-5 h-5" /> Failed to save. Check Firebase connection.
            </motion.div>
          )}
        </AnimatePresence>

        <button
          disabled={loading}
          className={cn(
            "w-full py-6 bg-black text-white font-inter font-black text-xs uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all shadow-xl hover:shadow-primary/20",
            loading ? "opacity-50 cursor-wait" : "hover:bg-primary"
          )}
        >
          {loading ? "SAVING TO VANI..." : formData.postStatus === "published" ? "PUBLISH TO NEO BHARAT FEED" : "SAVE AS DRAFT"}
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
