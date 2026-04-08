"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Loader2, Check, Heart } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { Post, PostCategory } from "@/lib/types";

const ALL_CATEGORIES: { id: PostCategory; label: string; labelHi: string; emoji: string }[] = [
  { id: "Politics", label: "Politics", labelHi: "राजनीति", emoji: "🏛️" },
  { id: "India", label: "India", labelHi: "भारत", emoji: "🇮🇳" },
  { id: "World", label: "World", labelHi: "विश्व", emoji: "🌍" },
  { id: "Economy", label: "Economy", labelHi: "अर्थव्यवस्था", emoji: "📈" },
  { id: "Tech", label: "Tech", labelHi: "तकनीक", emoji: "💻" },
  { id: "Defence", label: "Defence", labelHi: "रक्षा", emoji: "🛡️" },
  { id: "Sports", label: "Sports", labelHi: "खेल", emoji: "🏏" },
  { id: "Geopolitics", label: "Geopolitics", labelHi: "भू-राजनीति", emoji: "🗺️" },
  { id: "Culture", label: "Culture", labelHi: "संस्कृति", emoji: "🎭" },
  { id: "Opinion", label: "Opinion", labelHi: "विचार", emoji: "💬" },
  { id: "Markets", label: "Markets", labelHi: "बाज़ार", emoji: "📊" },
  { id: "Cities", label: "Cities", labelHi: "शहर", emoji: "🏙️" },
];

/**
 * Enhanced Personalized "For You" feed with:
 * - Interest picker for new users (cold-start)
 * - ML scoring: category relevance × recency × engagement (views + reactions)
 * - Saves interests to Firestore for logged-in users
 */
export default function ForYouFeed() {
  const { lang, t } = useLanguage();
  const { userId, isLoggedIn } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [savingInterests, setSavingInterests] = useState(false);

  const getRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get interests from server (logged in) or localStorage
      let interests: string[] = [];
      if (isLoggedIn && userId) {
        try {
          const res = await fetch("/api/auth/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: userId, email: "" }),
          });
          const data = await res.json();
          interests = data.interests || [];
        } catch {}
      }

      // Fallback to localStorage interests
      if (interests.length === 0) {
        const saved = localStorage.getItem("lv_interests");
        if (saved) interests = JSON.parse(saved);
      }

      // 2. Get reading history
      const history = JSON.parse(localStorage.getItem("lv_read_history") || "[]") as {
        id: string;
        cat: string;
        ts: number;
      }[];

      // Show interest picker for new users with no data
      if (interests.length === 0 && history.length < 3) {
        setShowPicker(true);
        setLoading(false);
        return;
      }

      // 3. Build category scores (hybrid: interests + reading history)
      const catScores: Record<string, number> = {};

      // Explicit interests get high weight
      interests.forEach((cat) => (catScores[cat] = (catScores[cat] || 0) + 3.0));

      // Reading history with recency decay
      const now = Date.now();
      history.forEach((h) => {
        const ageHours = (now - h.ts) / (1000 * 60 * 60);
        const recencyWeight = Math.max(0.1, 1 - ageHours / 168); // decays over 7 days
        catScores[h.cat] = (catScores[h.cat] || 0) + recencyWeight;
      });

      const topCats = Object.entries(catScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat);

      // 4. Fetch articles
      const res = await fetch("/api/admin/list-posts?status=published");
      const data = await res.json();
      const allPosts = (data.posts || []) as Post[];

      const readIds = new Set(history.map((h) => h.id));

      // 5. Score posts: category relevance × recency × engagement
      const recs = allPosts
        .filter((p) => {
          const pLang = p.language;
          if (lang === "hi" && pLang && pLang !== "hi" && pLang !== "bilingual") return false;
          if (lang !== "hi" && pLang === "hi") return false;
          return topCats.includes(p.category) && !readIds.has(p.id);
        })
        .map((p) => {
          const createdAtValue = p.createdAt as any;
          const createdAt = createdAtValue?.toDate
            ? createdAtValue.toDate().getTime()
            : new Date(createdAtValue).getTime();

          // Category relevance (0-3)
          const catScore = catScores[p.category] || 0;

          // Recency factor (exponential decay, half-life = 24h)
          const ageHours = (now - createdAt) / (1000 * 60 * 60);
          const recencyFactor = Math.exp(-0.03 * ageHours);

          // Engagement factor (log scale)
          const totalReactions = Object.values(p.reactions || {}).reduce(
            (sum: number, v: unknown) => sum + (typeof v === "number" ? v : 0),
            0
          );
          const engagementFactor = 1 + Math.log1p((p.viewCount || 0) * 0.1 + totalReactions);

          const score = catScore * recencyFactor * engagementFactor;
          return { post: p, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((r) => r.post);

      setPosts(recs);
      setShowPicker(false);
    } catch (e) {
      console.error("Rec engine error", e);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userId, lang]);

  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  const toggleInterest = (cat: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const saveInterests = async () => {
    if (selectedInterests.size < 2) return;
    setSavingInterests(true);
    const arr = Array.from(selectedInterests);

    // Save to localStorage
    localStorage.setItem("lv_interests", JSON.stringify(arr));

    // Save to Firestore if logged in
    if (isLoggedIn && userId) {
      try {
        await fetch("/api/auth/check-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: userId, email: "", setInterests: arr }),
        });
      } catch {}
    }

    setSavingInterests(false);
    // Trigger recommendations with new interests
    getRecommendations();
  };

  if (loading)
    return (
      <div className="py-12 flex justify-center border-b border-[var(--nyt-border)]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );

  // ── Interest Picker (Cold-Start) ────────────────────────────────────
  if (showPicker)
    return (
      <div className="py-10 bg-gradient-to-b from-primary/5 to-transparent border-b border-[var(--nyt-border)]">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-newsreader font-bold dark:text-white">
              {t("What topics interest you?", "आपकी रुचि किन विषयों में है?")}
            </h2>
            <p className="text-sm font-inter opacity-60 mt-1 dark:text-white/60">
              {t("Pick at least 2 to get personalized recommendations", "व्यक्तिगत सुझाव पाने के लिए कम से कम 2 चुनें")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto mb-6">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleInterest(cat.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-inter font-bold border-2 transition-all flex items-center gap-2",
                  selectedInterests.has(cat.id)
                    ? "border-primary bg-primary text-white"
                    : "border-black/15 dark:border-white/20 hover:border-primary dark:text-white"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{lang === "hi" ? cat.labelHi : cat.label}</span>
                {selectedInterests.has(cat.id) && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={saveInterests}
              disabled={selectedInterests.size < 2 || savingInterests}
              className="px-8 py-3 bg-primary text-white font-inter font-black text-xs uppercase tracking-widest disabled:opacity-40 transition-opacity"
            >
              {savingInterests ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 inline mr-2" />
              )}
              {t(
                `Show My Feed (${selectedInterests.size} selected)`,
                `मेरी फ़ीड दिखाएं (${selectedInterests.size} चयनित)`
              )}
            </button>
          </div>
        </div>
      </div>
    );

  if (posts.length === 0) return null;

  return (
    <div className="py-8 bg-slate-50/50 dark:bg-white/5 border-b border-[var(--nyt-border)]">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="nyt-section-header mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-inter font-black uppercase tracking-widest text-[var(--nyt-black)] dark:text-white leading-none">
                {t("Just For You", "आपके लिए विशेष")}
              </h2>
              <p className="text-[9px] font-inter font-bold text-primary uppercase tracking-tighter mt-1">
                AI-Powered Recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowPicker(true);
              setPosts([]);
            }}
            className="text-[9px] font-inter font-black uppercase tracking-widest text-primary hover:underline"
          >
            {t("Edit Interests", "रुचियां बदलें")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col h-full bg-white dark:bg-[#111] border border-[var(--nyt-border)] hover:border-primary transition-all"
            >
              {post.imageUrl && (
                <div className="relative overflow-hidden aspect-[16/9]">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 p-5">
                <p className="text-[10px] font-inter font-black text-primary uppercase tracking-widest mb-2 opacity-70">
                  {post.category}
                </p>
                <h4 className="text-lg font-newsreader font-black leading-tight text-[var(--nyt-black)] dark:text-white group-hover:text-primary transition-colors mb-2">
                  {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-inter line-clamp-2 leading-relaxed">
                  {lang === "hi" && post.summaryHi ? post.summaryHi : post.summary}
                </p>
              </div>
              <div className="px-5 pb-4 pt-0">
                <div className="pt-3 border-t border-[var(--nyt-border)] flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {post.author?.charAt(0) || "L"}
                  </div>
                  <p className="text-[10px] font-inter font-bold text-gray-400 uppercase tracking-tighter">
                    {post.author} · {post.readingTimeMin || 3} MIN
                  </p>
                  {(post.viewCount || 0) > 10 && (
                    <span className="ml-auto text-[9px] font-inter font-bold text-primary/60">
                      🔥 {post.viewCount} views
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
