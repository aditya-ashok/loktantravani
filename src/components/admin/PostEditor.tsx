"use client";

import React, { useState, useCallback } from "react";
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
  Loader2,
  Wand2,
  Search,
  ShieldCheck,
  BarChart3,
  Type,
  FileText,
  Zap,
  X,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, estimateReadingTime } from "@/lib/utils";
import { generateSlug } from "@/lib/slug";
import type { PostCategory, PostSection, PostStatus } from "@/lib/types";

const CATEGORIES: PostCategory[] = ["India", "World", "Politics", "Geopolitics", "IR", "Economy", "Markets", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Viral", "Ancient India", "Lok Post"];
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
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ── AI Tools State ──
  const [aiPanel, setAiPanel] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [writePrompt, setWritePrompt] = useState("");

  const callAI = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI failed");
      setAiResult(data);
    } catch (err) {
      setAiResult({ error: err instanceof Error ? err.message : "AI tool failed" });
    } finally {
      setAiLoading(false);
    }
  }, []);

  const aiTools = [
    { id: "headline-optimize", label: "Headline", icon: Type, color: "text-purple-600", run: () => callAI("headline-optimize", { title: formData.title, category: formData.category }) },
    { id: "auto-tag", label: "Auto-Tag", icon: Tag, color: "text-blue-600", run: () => callAI("auto-tag", { title: formData.title, content: formData.content, category: formData.category }) },
    { id: "quality-score", label: "Quality", icon: BarChart3, color: "text-green-600", run: () => callAI("quality-score", { title: formData.title, content: formData.content }) },
    { id: "seo-recommend", label: "SEO", icon: Search, color: "text-orange-600", run: () => callAI("seo-recommend", { title: formData.title, content: formData.content, tags: formData.tags.split(",") }) },
    { id: "fact-check", label: "Fact Check", icon: ShieldCheck, color: "text-red-600", run: () => callAI("fact-check", { title: formData.title, content: formData.content }) },
    { id: "caption-image", label: "Caption", icon: ImageIcon, color: "text-teal-600", run: () => callAI("caption-image", { imageUrl: formData.imageUrl, title: formData.title, category: formData.category }) },
    { id: "writing-assist", label: "Write", icon: Wand2, color: "text-indigo-600", run: () => {} },
  ];

  return (
    <div className="flex gap-6">
    {/* Main Editor */}
    <div className="flex-1 min-w-0 max-w-4xl p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mt-4 mb-24">
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

      {/* AI Tools Quick Bar */}
      <div className="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 border border-gray-200">
        <span className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 flex items-center mr-1">
          <Sparkles className="w-3 h-3 mr-1" /> AI Tools
        </span>
        {aiTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => {
              setAiPanel(aiPanel === tool.id ? null : tool.id);
              if (tool.id !== "writing-assist" && aiPanel !== tool.id) tool.run();
            }}
            disabled={aiLoading && aiPanel === tool.id}
            className={cn(
              "px-3 py-1.5 text-[9px] font-inter font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all",
              aiPanel === tool.id
                ? "border-black bg-black text-white"
                : "border-gray-300 hover:border-black"
            )}
          >
            {aiLoading && aiPanel === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <tool.icon className={`w-3 h-3 ${tool.color}`} />}
            {tool.label}
          </button>
        ))}
      </div>

      {/* AI Results Panel */}
      {aiPanel && (
        <div className="mb-6 border-2 border-black bg-white">
          <div className="flex items-center justify-between px-4 py-2 bg-black text-white">
            <span className="text-[10px] font-inter font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {aiTools.find(t => t.id === aiPanel)?.label} Results
            </span>
            <button onClick={() => { setAiPanel(null); setAiResult(null); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {aiLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-sm font-inter opacity-60">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Analyzing with AI...
              </div>
            ) : aiResult?.error ? (
              <div className="text-red-600 text-sm font-inter">{String(aiResult.error)}</div>
            ) : aiPanel === "headline-optimize" && aiResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black">{String(aiResult.score || 0)}</div>
                    <div className="text-[8px] font-inter font-bold uppercase opacity-50">/10</div>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {Object.entries((aiResult.analysis as Record<string, number>) || {}).map(([k, v]) => (
                      <div key={k} className="text-center">
                        <div className="text-sm font-black">{v}</div>
                        <div className="text-[8px] font-inter uppercase opacity-50">{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(aiResult.suggestions as { headline: string; reason: string }[] || []).map((s, i) => (
                  <button key={i} type="button" onClick={() => setFormData({ ...formData, title: s.headline })}
                    className="w-full text-left p-3 border hover:border-primary hover:bg-primary/5 transition-all">
                    <p className="text-sm font-newsreader font-bold">{s.headline}</p>
                    <p className="text-[10px] font-inter opacity-50 mt-1">{s.reason}</p>
                  </button>
                ))}
                {aiResult.tip ? <p className="text-xs font-inter text-primary"><Zap className="w-3 h-3 inline mr-1" />{String(aiResult.tip)}</p> : null}
              </div>
            ) : aiPanel === "auto-tag" && aiResult ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] font-inter font-black uppercase opacity-50 mb-1">Suggested Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(aiResult.suggestedTags as string[] || []).map((tag) => (
                      <button key={tag} type="button"
                        onClick={() => {
                          const current = formData.tags ? formData.tags.split(",").map(t => t.trim()) : [];
                          if (!current.includes(tag)) setFormData({ ...formData, tags: [...current, tag].join(", ") });
                        }}
                        className="px-2 py-1 text-xs font-inter font-bold border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-inter font-black uppercase opacity-50 mb-1">Suggested Category</p>
                  <button type="button"
                    onClick={() => setFormData({ ...formData, category: (aiResult.suggestedCategory as string) as PostCategory })}
                    className="px-3 py-1.5 text-xs font-inter font-bold border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all">
                    {String(aiResult.suggestedCategory)} ({String(aiResult.categoryConfidence)}% confident)
                  </button>
                </div>
                {(aiResult.entities as string[] || []).length > 0 && (
                  <div>
                    <p className="text-[9px] font-inter font-black uppercase opacity-50 mb-1">Entities Detected</p>
                    <p className="text-xs font-inter">{(aiResult.entities as string[]).join(" · ")}</p>
                  </div>
                )}
              </div>
            ) : aiPanel === "quality-score" && aiResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn("text-4xl font-black", Number(aiResult.overallScore) >= 70 ? "text-green-600" : Number(aiResult.overallScore) >= 40 ? "text-yellow-600" : "text-red-600")}>
                    {String(aiResult.overallScore)}
                  </div>
                  <div className="text-xs font-inter opacity-60">/100 — {String(aiResult.readingLevel)} level · ~{String(aiResult.wordCount)} words</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries((aiResult.grades as Record<string, { score: number; note: string }>) || {}).map(([k, v]) => (
                    <div key={k} className="p-2 border text-center">
                      <div className="text-lg font-black">{v.score}</div>
                      <div className="text-[8px] font-inter font-bold uppercase opacity-50">{k}</div>
                      <div className="text-[9px] font-inter opacity-40 mt-0.5">{v.note}</div>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-inter font-bold border-l-4 border-primary pl-3">{String(aiResult.verdict)}</p>
                <div className="grid grid-cols-2 gap-4 text-xs font-inter">
                  <div><p className="font-bold text-green-600 mb-1">Strengths</p>{(aiResult.strengths as string[] || []).map((s, i) => <p key={i} className="opacity-60">+ {s}</p>)}</div>
                  <div><p className="font-bold text-red-600 mb-1">Improvements</p>{(aiResult.improvements as string[] || []).map((s, i) => <p key={i} className="opacity-60">- {s}</p>)}</div>
                </div>
              </div>
            ) : aiPanel === "seo-recommend" && aiResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("text-3xl font-black", Number(aiResult.seoScore) >= 70 ? "text-green-600" : "text-yellow-600")}>{String(aiResult.seoScore)}</div>
                  <span className="text-xs font-inter opacity-50">SEO Score · {String(aiResult.estimatedSearchVolume)} search volume</span>
                </div>
                {aiResult.metaDescription ? (
                  <div className="p-3 bg-gray-50 border"><p className="text-[9px] font-inter font-bold uppercase opacity-50 mb-1">Meta Description</p><p className="text-xs font-inter">{String(aiResult.metaDescription)}</p></div>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {(aiResult.suggestedKeywords as string[] || []).map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-[10px] font-inter font-bold text-orange-700">{kw}</span>
                  ))}
                </div>
                {(aiResult.issues as { severity: string; issue: string; fix: string }[] || []).map((issue, i) => (
                  <div key={i} className={cn("p-2 border-l-4 text-xs font-inter", issue.severity === "high" ? "border-red-500 bg-red-50" : issue.severity === "medium" ? "border-yellow-500 bg-yellow-50" : "border-gray-300")}>
                    <p className="font-bold">{issue.issue}</p><p className="opacity-60">{issue.fix}</p>
                  </div>
                ))}
              </div>
            ) : aiPanel === "fact-check" && aiResult ? (
              <div className="space-y-3">
                <div className={cn("px-3 py-2 text-sm font-inter font-bold uppercase tracking-wider",
                  aiResult.riskLevel === "high" ? "bg-red-100 text-red-700" : aiResult.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                )}>
                  Risk: {String(aiResult.riskLevel)} — {String(aiResult.recommendation)}
                </div>
                <p className="text-xs font-inter">{String(aiResult.overallAssessment)}</p>
                {(aiResult.claims as { claim: string; status: string; note: string }[] || []).map((c, i) => (
                  <div key={i} className="p-2 border text-xs font-inter">
                    <p className="font-bold">"{c.claim}"</p>
                    <span className={cn("text-[9px] font-black uppercase", c.status === "verified" ? "text-green-600" : c.status === "questionable" ? "text-red-600" : "text-yellow-600")}>{c.status}</span>
                    <p className="opacity-50 mt-0.5">{c.note}</p>
                  </div>
                ))}
              </div>
            ) : aiPanel === "caption-image" && aiResult ? (
              <div className="space-y-2 text-xs font-inter">
                <div><span className="font-bold">Alt Text:</span> {String(aiResult.altText)}</div>
                <div><span className="font-bold">Caption:</span> {String(aiResult.caption)}</div>
                <div><span className="font-bold">Hindi:</span> {String(aiResult.captionHi)}</div>
                <div><span className="font-bold">Credit:</span> {String(aiResult.credit)}</div>
              </div>
            ) : aiPanel === "writing-assist" ? (
              <div className="space-y-3">
                <p className="text-xs font-inter opacity-50">Tell the AI what to write or improve. It can see your current content.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={writePrompt}
                    onChange={(e) => setWritePrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && writePrompt.trim()) {
                        callAI("writing-assist", { text: formData.content.slice(-500), instruction: writePrompt, context: `Title: ${formData.title}\nCategory: ${formData.category}` });
                        setWritePrompt("");
                      }
                    }}
                    placeholder="e.g. Write 2 more paragraphs about economic impact..."
                    className="flex-1 px-3 py-2 text-sm font-inter border-2 border-black outline-none"
                  />
                  <button type="button" disabled={aiLoading || !writePrompt.trim()}
                    onClick={() => {
                      callAI("writing-assist", { text: formData.content.slice(-500), instruction: writePrompt, context: `Title: ${formData.title}\nCategory: ${formData.category}` });
                      setWritePrompt("");
                    }}
                    className="px-4 bg-black text-white font-inter font-black text-[10px] uppercase disabled:opacity-40">
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Write intro paragraph", "Add a concluding paragraph", "Make it more engaging", "Add data/statistics", "Simplify the language", "Translate to Hindi"].map((suggestion) => (
                    <button key={suggestion} type="button"
                      onClick={() => {
                        callAI("writing-assist", { text: formData.content.slice(-500), instruction: suggestion, context: `Title: ${formData.title}\nCategory: ${formData.category}` });
                      }}
                      className="px-2 py-1 text-[9px] font-inter border border-gray-300 hover:border-primary hover:text-primary transition-all">
                      {suggestion}
                    </button>
                  ))}
                </div>
                {aiResult && !aiResult.error && (
                  <div className="border-2 border-primary p-3 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-inter font-black uppercase text-primary">AI Generated</span>
                      <button type="button"
                        onClick={() => setFormData({ ...formData, content: formData.content + "\n" + String(aiResult.result) })}
                        className="px-3 py-1 text-[9px] font-inter font-black uppercase bg-primary text-white hover:bg-primary/80">
                        + Append to Content
                      </button>
                    </div>
                    <div className="text-sm font-inter prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: String(aiResult.result || "") }} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

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
    </div>
  );
}
