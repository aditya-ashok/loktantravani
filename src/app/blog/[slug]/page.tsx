"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReadingProgress from "@/components/ReadingProgress";
import CategoryBadge from "@/components/CategoryBadge";
import PostContent from "@/components/PostContent";
import Reactions from "@/components/Reactions";
import ShareButtons from "@/components/ShareButtons";
import BookmarkButton from "@/components/BookmarkButton";
import CommentSection from "@/components/CommentSection";
import RelatedPosts from "@/components/RelatedPosts";
import NewsletterSignup from "@/components/NewsletterSignup";
import LiveReaderCount from "@/components/LiveReaderCount";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/utils";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { lang, t } = useLanguage();

  // Seed data as fallback
  const seedPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `seed-${i}`,
        createdAt: new Date(Date.now() - i * 3600000 * (i + 1)),
        updatedAt: new Date(),
      })),
    []
  );

  const [post, setPost] = useState<Post | null | undefined>(
    seedPosts.find((p) => p.slug === slug)
  );
  const [loadingPost, setLoadingPost] = useState(true);

  // Try Firebase first; fall back to seed data
  useEffect(() => {
    let cancelled = false;
    const fetchPost = async () => {
      try {
        const { getPostBySlug, incrementViewCount } = await import("@/lib/firebase-service");
        const fbPost = await getPostBySlug(slug);
        if (!cancelled) {
          if (fbPost) {
            setPost(fbPost);
            // Fire-and-forget view count increment
            incrementViewCount(fbPost.id).catch(() => {});
          } else {
            // Not in Firebase → use seed fallback + still track (best-effort)
            const seed = seedPosts.find((p) => p.slug === slug);
            setPost(seed ?? null);
          }
        }
      } catch {
        // Firebase not configured — keep seed fallback
        if (!cancelled) setPost(seedPosts.find((p) => p.slug === slug) ?? null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    };
    fetchPost();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loadingPost) {
    return (
      <div className="max-w-4xl mx-auto px-8 md:px-16 py-24 animate-pulse space-y-6">
        <div className="h-4 bg-black/10 dark:bg-white/10 w-48 rounded" />
        <div className="h-16 bg-black/10 dark:bg-white/10 w-3/4 rounded" />
        <div className="h-6 bg-black/5 dark:bg-white/5 w-full rounded" />
        <div className="aspect-[16/9] bg-black/5 dark:bg-white/5 rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-8 md:px-16 text-center py-24">
        <h1 className="text-6xl font-newsreader font-black mb-4 dark:text-white">404</h1>
        <p className="text-xl font-newsreader italic opacity-60 dark:text-white/60 mb-8">
          {t("This article could not be found.", "यह लेख नहीं मिला।")}
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("Back to articles", "लेखों पर वापस जाएं")}
        </Link>
      </div>
    );
  }

  const title = lang === "hi" && post.titleHi ? post.titleHi : post.title;
  const summary = lang === "hi" && post.summaryHi ? post.summaryHi : post.summary;
  const relatedPosts = seedPosts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 3);
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <ReadingProgress />
      <article className="max-w-7xl mx-auto px-8 md:px-16">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mb-8 dark:text-white/40"
        >
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          <span>/</span>
          <Link href={`/category/${encodeURIComponent(post.category)}`} className="hover:text-primary">
            {post.category}
          </Link>
        </motion.nav>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <CategoryBadge category={post.category} size="md" />
            <div className="flex items-center gap-2 text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readingTimeMin} min read</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
              <Eye className="w-3.5 h-3.5" />
              <span>{post.viewCount.toLocaleString()} views</span>
            </div>
            <span className="text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
              {formatDate(post.createdAt as Date, lang)}
            </span>
            <LiveReaderCount postId={post.id} compact />
            {post.authorRole === "agent" && (
              <span className="flex items-center gap-1 text-[10px] font-inter font-black text-primary uppercase">
                <Sparkles className="w-3.5 h-3.5" /> AI-Assisted
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className={`text-5xl md:text-7xl lg:text-8xl font-newsreader font-black leading-[0.9] tracking-tighter mb-8 dark:text-white ${
              lang === "hi" ? "hindi" : ""
            }`}
          >
            {title}
          </h1>

          {/* Summary */}
          <p className="text-xl font-newsreader italic opacity-60 max-w-3xl mb-8 dark:text-white/60">
            {summary}
          </p>

          {/* Author */}
          <div className="flex items-center gap-4 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="w-12 h-12 bg-primary text-white flex items-center justify-center font-newsreader font-bold text-xl">
              {post.author[0]}
            </div>
            <div>
              <p className="font-inter font-black text-sm dark:text-white">{post.author}</p>
              <p className="text-[10px] font-inter font-bold opacity-40 uppercase tracking-widest dark:text-white/40">
                {post.section} &bull; {post.category}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <BookmarkButton slug={post.slug} />
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="grid grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Hero Image */}
            <div className="aspect-[16/9] overflow-hidden mb-12 border-2 border-black dark:border-white/10">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Article Body */}
            <div className="dropcap">
              <PostContent content={post.content} contentHi={post.contentHi} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-black/10 dark:border-white/10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 border border-black/10 dark:border-white/10 text-[10px] font-inter font-black uppercase tracking-widest dark:text-white/60"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Reactions */}
            <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
              <p className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mb-4 dark:text-white/40">
                {t("How did this make you feel?", "इसने आपको कैसा महसूस कराया?")}
              </p>
              <Reactions postId={post.id} reactions={post.reactions} />
            </div>

            {/* Share (bottom) */}
            <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
              <ShareButtons url={url} title={post.title} />
            </div>

            {/* Subscription CTA */}
            <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10 text-center">
              <p className="text-sm font-newsreader italic opacity-60 mb-4 dark:text-white/60">
                {t("Enjoying this article? Support independent Neo Bharat journalism.", "इस लेख का आनंद ले रहे हैं? स्वतंत्र नव भारत पत्रकारिता का समर्थन करें।")}
              </p>
            </div>

            {/* Comments */}
            <CommentSection postId={post.id} />

            {/* Related */}
            <RelatedPosts posts={relatedPosts} />
          </div>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <div className="sticky top-[240px]">
              {/* Table of Contents placeholder */}
              <div className="border-4 border-black dark:border-white/20 p-6 mb-8">
                <h4 className="text-sm font-inter font-black uppercase tracking-widest mb-4 dark:text-white">
                  {t("In This Article", "इस लेख में")}
                </h4>
                <div className="space-y-3 text-sm font-newsreader dark:text-white/80">
                  {post.content.match(/<h2>(.*?)<\/h2>/g)?.map((match, idx) => {
                    const text = match.replace(/<\/?h2>/g, "");
                    return (
                      <p key={idx} className="cursor-pointer hover:text-primary transition-colors border-l-2 border-black/10 dark:border-white/10 pl-3">
                        {text}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Newsletter */}
              <NewsletterSignup />

              {/* More from author */}
              <div className="mt-8 p-6 bg-[#fff9f3] dark:bg-white/5 border-2 border-black/10 dark:border-white/10">
                <p className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mb-3 dark:text-white/40">
                  {t("More from", "और अधिक")} {post.author}
                </p>
                {seedPosts
                  .filter((p) => p.author === post.author && p.slug !== post.slug)
                  .slice(0, 3)
                  .map((p) => (
                    <a
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="block py-3 border-b border-black/5 dark:border-white/5 last:border-0"
                    >
                      <p className="text-sm font-newsreader font-bold hover:text-primary transition-colors dark:text-white">
                        {lang === "hi" && p.titleHi ? p.titleHi : p.title}
                      </p>
                    </a>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}

