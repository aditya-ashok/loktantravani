"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  slug: string;
  className?: string;
}

function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("loktantra-bookmarks");
  return stored ? JSON.parse(stored) : [];
}

function toggleBookmark(slug: string): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(slug);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
    localStorage.setItem("loktantra-bookmarks", JSON.stringify(bookmarks));
    return false;
  }
  bookmarks.push(slug);
  localStorage.setItem("loktantra-bookmarks", JSON.stringify(bookmarks));
  return true;
}

export default function BookmarkButton({ slug, className }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getBookmarks().includes(slug));
  }, [slug]);

  return (
    <button
      onClick={() => setSaved(toggleBookmark(slug))}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 border-2 transition-all text-sm",
        saved
          ? "border-primary bg-primary/10 text-primary"
          : "border-black/10 dark:border-white/10 hover:border-primary dark:text-white",
        className
      )}
      title={saved ? "Remove bookmark" : "Save for later"}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      <span className="font-inter font-black text-xs uppercase tracking-widest">
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
}

export { getBookmarks };
