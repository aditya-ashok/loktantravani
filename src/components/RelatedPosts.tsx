"use client";

import { useLanguage } from "@/lib/language-context";
import BlogCard from "./BlogCard";
import type { Post } from "@/lib/types";

interface RelatedPostsProps {
  posts: Post[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  const { t } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t-4 border-double border-black dark:border-white/20">
      <h3 className="text-2xl font-newsreader font-black uppercase tracking-tight mb-8 dark:text-white">
        {t("Continue Reading", "पढ़ना जारी रखें")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
