"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, Send, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Opinion", "India", "Politics", "Economy", "Tech", "Culture", "Cities", "World", "Defence", "Sports"];

interface GrammarResult {
  overallScore: number;
  corrections: { original: string; corrected: string; reason: string }[];
  suggestions: string[];
  readabilityGrade: string;
  wordCount: number;
}

export default function WriteNewPage() {
  const { isLoggedIn, userId, userName, userRole } = useAuth();
  const router = useRouter();
  const isContributor = userRole === "contributor" || userRole === "author" || userRole === "admin";

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Opinion");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [checking, setChecking] = useState(false);
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const wordCount = content.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length;

  const handleGrammarCheck = async () => {
    setChecking(true);
    setGrammarResult(null);
    try {
      const res = await fetch("/api/write/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.success) setGrammarResult(data);
      else setError(data.error || "Grammar check failed");
    } catch { setError("Grammar check failed"); }
    setChecking(false);
  };

  const handleSubmit = async () => {
    if (!title || !content || wordCount < 100) {
      setError("Title and content (min 100 words) required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/write/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          title,
          summary,
          content: content.includes("<p>") ? content : `<p>${content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
          category,
          tags,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setError(data.error || "Submission failed");
    } catch { setError("Submission failed"); }
    setSubmitting(false);
  };

  // Redirect if not logged in or not contributor
  if (!isLoggedIn || !isContributor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-newsreader font-black mb-4 dark:text-white">Access Required</h1>
            <p className="text-sm font-inter opacity-60 mb-6 dark:text-white/60">You need to register as a contributor first.</p>
            <Link href="/write" className="inline-block bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary dark:bg-white dark:text-black">
              Register Now →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Success
  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-3xl font-newsreader font-black mb-4 dark:text-white">Submitted!</h1>
            <p className="text-sm font-inter opacity-60 mb-6 dark:text-white/60">
              Your article is now under editorial review. You&apos;ll receive an email when it&apos;s published.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/write/dashboard" className="border-2 border-black dark:border-white/30 px-6 py-3 text-xs font-inter font-black uppercase tracking-widest dark:text-white hover:bg-black hover:text-white transition-colors">
                My Submissions
              </Link>
              <button onClick={() => { setSubmitted(false); setTitle(""); setSummary(""); setContent(""); setGrammarResult(null); }} className="bg-black text-white px-6 py-3 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary dark:bg-white dark:text-black">
                Write Another
              </button>
            </div>
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
          {/* Header */}
          <Link href="/write" className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-primary mb-6 dark:text-white/40">
            <ArrowLeft className="w-4 h-4" /> Write With Us
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-newsreader font-black dark:text-white">Write Your Article</h1>
              <p className="text-xs font-inter opacity-40 mt-1 dark:text-white/40">By {userName} • {wordCount} words</p>
            </div>
            <span className="text-[9px] font-inter font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary">Contributor</span>
          </div>

          {/* Editor */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Headline *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your compelling headline..." className="w-full border-b-2 border-black dark:border-white/30 px-0 py-3 text-2xl md:text-3xl font-newsreader font-black bg-transparent dark:text-white placeholder:opacity-20 focus:outline-none focus:border-primary" />
            </div>

            {/* Category + Tags */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-[10px] font-inter font-bold uppercase tracking-widest border-2 transition-colors ${category === c ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-black/20 dark:border-white/20 dark:text-white/60 hover:border-black dark:hover:border-white"}`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Summary (2-3 sentences)</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="Brief summary of your article..." className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1 resize-none" />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Article Content *</label>
                <span className={`text-[9px] font-inter font-bold ${wordCount < 100 ? "text-red-500" : wordCount > 2000 ? "text-orange-500" : "text-green-600"}`}>
                  {wordCount} words {wordCount < 100 ? "(min 100)" : wordCount > 2000 ? "(consider trimming)" : "✓"}
                </span>
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={20} placeholder="Write your article here...

You can use HTML tags like <h2>, <p>, <blockquote> for formatting, or just write plain text — we'll format it for you.

Tips:
- Start with a strong opening paragraph
- Use subheadings to break up sections
- Support claims with evidence
- End with a clear conclusion" className="w-full border-2 border-black dark:border-white/30 px-4 py-4 font-inter text-sm leading-relaxed bg-transparent dark:text-white placeholder:opacity-30 mt-1 resize-y min-h-[400px]" />
            </div>

            {/* Image URL */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Image URL (optional — editors may assign one)</label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
            </div>

            {/* Tags */}
            <div>
              <label className="text-[9px] font-inter font-black uppercase tracking-widest opacity-60 dark:text-white/60">Tags (comma-separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="politics, modi, parliament" className="w-full border-2 border-black dark:border-white/30 px-4 py-3 font-inter text-sm bg-transparent dark:text-white placeholder:opacity-40 mt-1" />
            </div>

            {/* AI Grammar Check */}
            <div className="border-2 border-primary/30 p-4 md:p-6 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-inter font-black uppercase tracking-widest text-primary">AI Grammar Assistant</span>
                </div>
                <button onClick={handleGrammarCheck} disabled={checking || wordCount < 50} className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest hover:bg-primary/80 disabled:opacity-40 transition-colors">
                  {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {checking ? "Checking..." : "Run Grammar Check"}
                </button>
              </div>

              {grammarResult && (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm font-inter">
                    <span className={`font-bold ${grammarResult.overallScore >= 8 ? "text-green-600" : grammarResult.overallScore >= 5 ? "text-orange-500" : "text-red-500"}`}>
                      Score: {grammarResult.overallScore}/10
                    </span>
                    <span className="opacity-60">Level: {grammarResult.readabilityGrade}</span>
                    <span className="opacity-60">{grammarResult.wordCount} words</span>
                  </div>

                  {grammarResult.corrections.length > 0 && (
                    <div>
                      <p className="text-[9px] font-inter font-bold uppercase tracking-widest opacity-60 mb-2">Corrections</p>
                      {grammarResult.corrections.map((c, i) => (
                        <div key={i} className="flex gap-2 text-xs font-inter py-1.5 border-b border-black/10 dark:border-white/10">
                          <span className="text-red-500 line-through">{c.original}</span>
                          <span>→</span>
                          <span className="text-green-600 font-bold">{c.corrected}</span>
                          <span className="opacity-40 ml-auto">{c.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {grammarResult.suggestions.length > 0 && (
                    <div>
                      <p className="text-[9px] font-inter font-bold uppercase tracking-widest opacity-60 mb-2">Suggestions</p>
                      {grammarResult.suggestions.map((s, i) => (
                        <p key={i} className="text-xs font-inter opacity-60 flex gap-2"><AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" /> {s}</p>
                      ))}
                    </div>
                  )}

                  {grammarResult.corrections.length === 0 && (
                    <p className="text-xs font-inter text-green-600 flex gap-2"><CheckCircle className="w-3 h-3" /> No errors found. Well written!</p>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 p-4 text-sm font-inter text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between border-t-2 border-black dark:border-white/20 pt-6">
              <p className="text-[9px] font-inter opacity-40 dark:text-white/40">
                Articles go through editorial review before publishing.
              </p>
              <button onClick={handleSubmit} disabled={submitting || !title || wordCount < 100} className="flex items-center gap-2 bg-black text-white px-8 py-4 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary disabled:opacity-40 transition-colors dark:bg-white dark:text-black dark:hover:bg-primary dark:hover:text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
