"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PostNotFound() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 text-center py-24">
      <h1 className="text-6xl font-newsreader font-black mb-4 dark:text-white">404</h1>
      <p className="text-xl font-newsreader italic opacity-60 dark:text-white/60 mb-8">
        This article could not be found. It may have been archived or removed.
      </p>
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to articles
      </Link>
    </div>
  );
}
