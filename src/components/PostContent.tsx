"use client";

import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

interface PostContentProps {
  content: string;
  contentHi?: string;
}

export default function PostContent({ content, contentHi }: PostContentProps) {
  const { lang } = useLanguage();
  const html = lang === "hi" && contentHi ? contentHi : content;

  return (
    <div
      className={cn(
        "post-content newspaper-text max-w-none",
        lang === "hi" && "hindi"
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
