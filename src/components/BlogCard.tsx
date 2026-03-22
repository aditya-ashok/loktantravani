"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import CategoryBadge from "./CategoryBadge";
import type { Post } from "@/lib/types";

interface BlogCardProps {
  post: Post;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const { lang } = useLanguage();
  const title = lang === "hi" && post.titleHi ? post.titleHi : post.title;
  const summary = lang === "hi" && post.summaryHi ? post.summaryHi : post.summary;

  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <article
        className={cn(
          "group cursor-pointer hover:bg-[#fff9f3] dark:hover:bg-white/5 transition-all p-4 border border-black/5 dark:border-white/5",
          featured
            ? "grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            : "space-y-4"
        )}
      >
        <div
          className={cn(
            "overflow-hidden bg-muted",
            featured ? "aspect-[16/9]" : "aspect-[3/2]"
          )}
        >
          <img
            src={post.imageUrl}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
            alt={post.title}
          />
        </div>
        <div className="space-y-4">
          <CategoryBadge category={post.category} />
          <h3
            className={cn(
              "font-newsreader font-black leading-tight text-black dark:text-white group-hover:text-primary transition-colors",
              featured ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl",
              lang === "hi" && "hindi"
            )}
          >
            {title}
          </h3>
          {featured && (
            <p className="text-sm font-inter opacity-60 dark:text-white/60 line-clamp-2">
              {summary}
            </p>
          )}
          <div className="flex items-center gap-3 text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
            <span>BY {post.author}</span>
            <span className="w-1 h-1 bg-primary rounded-full" />
            <span>{post.readingTimeMin} MIN READ</span>
            <span className="w-1 h-1 bg-primary rounded-full" />
            <span>{timeAgo(post.createdAt as Date)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
