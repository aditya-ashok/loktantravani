"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Sparkles, Newspaper, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import ArticleAIBar from "@/components/ArticleAIBar";
import ReadingProgress from "@/components/ReadingProgress";
import CategoryBadge from "@/components/CategoryBadge";
import PostContent from "@/components/PostContent";
import Reactions from "@/components/Reactions";
import ShareButtons from "@/components/ShareButtons";
import BookmarkButton from "@/components/BookmarkButton";
import CommentSection from "@/components/CommentSection";
import RelatedPosts from "@/components/RelatedPosts";
import LiveReaderCount from "@/components/LiveReaderCount";
import AdBanner from "@/components/AdBanner";
import GoogleAd, { InArticleAd } from "@/components/GoogleAd";
import EpaperShareModal from "@/components/EpaperShareModal";
import { useLanguage } from "@/lib/language-context";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { AUTHORS, getAuthorHi } from "@/lib/authors";
import { useAuth } from "@/lib/auth-context";

function AuthorCard({ authorName, authorPhoto, authorDesignation, authorBio }: { authorName: string; authorPhoto?: string; authorDesignation?: string; authorBio?: string }) {
  const authorProfile = AUTHORS.find(a => a.name === authorName);
  const photo = authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FF9933&color=fff&size=128&bold=true`;
  const designation = authorDesignation || authorProfile?.designation || "Correspondent";
  const bio = authorBio || authorProfile?.bio || `${authorName} is a journalist at LoktantraVani.`;

  return (
    <div className="mt-12 pt-8 border-t-2 border-black dark:border-white/20">
      <div className="flex items-start gap-5">
        <img src={photo} alt={authorName} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover shrink-0" />
        <div className="flex-1">
          <p className="text-[9px] font-inter font-black uppercase tracking-widest text-primary mb-1">About the Author</p>
          <h4 className="text-lg font-newsreader font-black dark:text-white">{authorName}</h4>
          <p className="text-[10px] font-inter font-bold uppercase tracking-widest opacity-50 mb-2 dark:text-white/50">{designation}</p>
          <p className="text-sm font-inter leading-relaxed text-[var(--nyt-gray)] dark:text-white/60">{bio}</p>
        </div>
      </div>
    </div>
  );
}

export default function ArticleContent({ post }: { post: Post }) {
  const { lang, t } = useLanguage();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const title = lang === "hi" && post.titleHi ? post.titleHi : post.title;
  const summary = lang === "hi" && post.summaryHi ? post.summaryHi : post.summary;
  const cat = post.category.toLowerCase().replace(/\s+/g, "-");
  const url = `https://loktantravani.in/${cat}/${post.slug}`;
  // Lookup author from AUTHORS list for fallback designation/bio
  const authorProfile = AUTHORS.find(a => a.name === post.author);
  const authorHi = getAuthorHi(post.author);
  const profileNameHi = (post as any).authorNameHi;
  const profileDesignationHi = (post as any).authorDesignationHi;
  const profileBioHi = (post as any).authorBioHi;
  const displayAuthor = lang === "hi" ? (profileNameHi || authorHi.nameHi || post.author) : post.author;
  const displayDesignation = lang === "hi"
    ? (profileDesignationHi || post.authorDesignation || authorHi.designationHi || "")
    : (post.authorDesignation || authorProfile?.designation || "");
  const displayBio = lang === "hi"
    ? (profileBioHi || post.authorBio || authorHi.bioHi || "")
    : (post.authorBio || authorProfile?.bio || "");

  // Increment view count on article load (once per session per article)
  useEffect(() => {
    const key = `lv_viewed_${post.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/admin/update-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, viewCount: (post.viewCount || 0) + 1 }),
    }).catch(() => {});
  }, [post.id, post.viewCount]);

  return (
    <>
      <ReadingProgress />
      <article className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 pt-[72px] md:pt-[100px]">
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mb-4 dark:text-white/40">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          <span>/</span>
          <Link href={`/category/${encodeURIComponent(post.category)}`} className="hover:text-primary">{post.category}</Link>
        </motion.nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <CategoryBadge category={post.category} size="md" />
            <div className="flex items-center gap-2 text-[10px] font-inter font-bold opacity-40 uppercase">
              <Clock className="w-3.5 h-3.5" /> <span>{post.readingTimeMin} min read</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-inter font-bold opacity-40 uppercase">
              <Eye className="w-3.5 h-3.5" /> <span>{post.viewCount.toLocaleString()} views</span>
            </div>
            <span className="text-[10px] font-inter font-bold opacity-40 uppercase">{formatDate(post.createdAt as Date, lang)}</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-newsreader font-black leading-[1.1] tracking-tight mb-6 dark:text-white">{title}</h1>
          <p className="text-xl font-newsreader italic opacity-60 max-w-3xl mb-8 dark:text-white/60">{summary}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <Link
              href={`/author/${encodeURIComponent(post.author)}`}
              rel="author"
              className="flex items-center gap-4 group hover:opacity-90 transition-opacity"
              itemScope
              itemType="https://schema.org/Person"
              itemProp="author"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-white flex items-center justify-center font-newsreader font-bold text-lg sm:text-xl shrink-0">{displayAuthor[0]}</div>
              <div>
                <p className="font-inter font-black text-sm dark:text-white group-hover:text-primary transition-colors" itemProp="name">
                  By <span className="underline-offset-2 group-hover:underline">{displayAuthor}</span>
                </p>
                <p className="text-[10px] font-inter font-bold opacity-40 uppercase tracking-widest" itemProp="jobTitle">{post.section} &bull; {post.category}</p>
                <meta itemProp="url" content={`https://loktantravani.in/author/${encodeURIComponent(post.author)}`} />
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto flex-wrap">
               <BookmarkButton slug={post.slug} />
               <button onClick={() => setShareCardOpen(true)} className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border-2 border-black dark:border-white text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all bg-white dark:bg-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
                 <Newspaper className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Share Card
               </button>
               {isAdmin && (
                 <Link
                   href="/admin"
                   className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-primary text-white text-[9px] sm:text-[10px] font-inter font-black uppercase tracking-widest hover:bg-black transition-all shadow-[2px_2px_0px_0px_#000]"
                 >
                   <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Edit
                 </Link>
               )}
               <ShareButtons url={url} title={post.title} />
            </div>
          </div>
        </motion.div>

        <ArticleAIBar title={title} content={post.content} summary={summary} lang={lang} postId={post.id} category={post.category} />

        <div className="grid grid-cols-12 gap-6 lg:gap-12 mt-8 lg:mt-12">
          <div className="col-span-12 lg:col-span-8">
            <div className="aspect-[16/9] overflow-hidden mb-8 lg:mb-12 border border-black/20 sm:border-2 sm:border-black dark:border-white/10">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
            <PostContent content={post.content} contentHi={post.contentHi} />
            {/* Ad after article content */}
            <InArticleAd />
            <AuthorCard authorName={displayAuthor} authorPhoto={post.authorPhoto} authorDesignation={displayDesignation} authorBio={displayBio} />
            <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
              <Reactions postId={post.id} reactions={post.reactions} />
            </div>
            <CommentSection postId={post.id} />
          </div>
          <aside className="col-span-12 lg:col-span-4 space-y-8">
             <div className="sticky top-[240px]">
               {post.content.match(/<h2>(.*?)<\/h2>/g)?.length ? (
                 <div className="border-4 border-black dark:border-white/20 p-6 mb-8">
                   <h4 className="text-sm font-inter font-black uppercase tracking-widest mb-4">In This Article</h4>
                   <div className="space-y-3 text-sm font-newsreader">
                     {post.content.match(/<h2>(.*?)<\/h2>/g)?.map((match, idx) => (
                       <p key={idx} className="border-l-2 border-black/10 pl-3 hover:border-primary cursor-pointer transition-colors">{match.replace(/<\/?h2>/g, "")}</p>
                     ))}
                   </div>
                 </div>
               ) : null}
               {/* Sidebar ad — sticky */}
               <GoogleAd format="rectangle" />
             </div>
          </aside>
        </div>
      </article>
      <EpaperShareModal
        isOpen={shareCardOpen}
        onClose={() => setShareCardOpen(false)}
        post={{
          title,
          summary,
          category: post.category,
          author: displayAuthor,
          authorPhoto: post.authorPhoto || "",
          authorDesignation: displayDesignation || "",
          authorBio: displayBio || "",
          imageUrl: post.imageUrl,
          url,
          date: formatDate(post.createdAt as Date, lang),
          readingTimeMin: post.readingTimeMin,
          content: post.content,
        }}
      />
    </>
  );
}
