"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { Post } from "@/lib/types";

interface CartoonCardProps {
  post: Post;
}

export default function CartoonCard({ post }: CartoonCardProps) {
  const { lang } = useLanguage();
  const title = lang === "hi" && post.titleHi ? post.titleHi : post.title;
  const summary = lang === "hi" && post.summaryHi ? post.summaryHi : post.summary;

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group cursor-pointer bg-white dark:bg-[#111] border-4 border-black dark:border-white/20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[12px_12px_0px_0px_#FF9933] transition-all overflow-hidden">
        <div className="aspect-square bg-muted overflow-hidden relative">
          <img
            src={post.imageUrl}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            alt={title}
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black text-white px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-inter font-black uppercase tracking-widest">
              Lok Post
            </span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <h3 className="text-2xl font-newsreader font-black italic leading-tight group-hover:text-primary transition-colors dark:text-white">
            &ldquo;{title}&rdquo;
          </h3>
          <p className="text-sm font-inter opacity-60 line-clamp-2 dark:text-white/60">
            {summary}
          </p>
          <div className="flex items-center gap-3 text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
            <span>BY {post.author}</span>
            <span className="w-1 h-1 bg-primary rounded-full" />
            <span>{post.readingTimeMin} MIN READ</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
