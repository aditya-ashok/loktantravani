"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-8">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <span className="text-[200px] font-newsreader font-black text-black/5 dark:text-white/5 leading-none block">
            404
          </span>
        </div>
        <Sparkles className="w-10 h-10 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-newsreader font-black uppercase mb-4 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-lg font-newsreader italic opacity-60 mb-8 dark:text-white/60">
          This page has gone the way of ancient manuscripts — lost to time, but perhaps waiting to be rediscovered.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white font-inter font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            Browse Articles
          </Link>
        </div>
      </div>
    </main>
  );
}
