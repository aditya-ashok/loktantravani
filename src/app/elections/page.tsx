import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ElectionTracker from "@/components/ElectionTracker";
import BlogCard from "@/components/BlogCard";
import { getPosts } from "@/lib/data-service";
import type { Post } from "@/lib/types";

export const revalidate = 60;

const SITE_URL = "https://loktantravani.in";

export const metadata: Metadata = {
  title: "Assembly Elections 2026 — Live Results & Coverage | LoktantraVani",
  description: "Live tracker for the 2026 assembly elections — Tamil Nadu, West Bengal, Kerala, Assam, Puducherry. Seat tallies, leading parties, constituency-level updates, and analysis from LoktantraVani's politics desk.",
  alternates: { canonical: `${SITE_URL}/elections` },
  openGraph: {
    title: "Assembly Elections 2026 — Live Results",
    description: "Live tally for the 5-state assembly cycle. TN, WB, Kerala, Assam, Puducherry.",
    url: `${SITE_URL}/elections`,
    type: "website",
    siteName: "LoktantraVani",
  },
};

export default async function ElectionsPage() {
  // Pull recent India + Politics posts to surface as related coverage
  const all = await getPosts("published", 60);
  const relevant: Post[] = all
    .filter((p) => {
      const cat = p.category;
      const tagJoin = (p.tags || []).join(" ").toLowerCase();
      return cat === "Politics" || cat === "India" || /election|chunav|assembly|bjp|samrat|bihar/i.test(tagJoin + " " + p.title);
    })
    .slice(0, 9);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[80px] md:pt-[108px] bg-white dark:bg-[#0d0d0d]">
        <ElectionTracker />

        <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-14">

          {/* Page intro */}
          <header className="mb-8 md:mb-12 max-w-3xl">
            <p className="text-[10px] font-inter font-black uppercase tracking-widest text-red-600 mb-2">
              Live · Counting in progress
            </p>
            <h1 className="text-3xl md:text-5xl font-newsreader font-black tracking-tight mb-4 dark:text-white">
              Assembly Elections 2026
            </h1>
            <p className="text-lg md:text-xl font-newsreader italic opacity-70 dark:text-white/60">
              Tamil Nadu, West Bengal, Kerala, Assam, Puducherry — five states, 1,024 assembly seats, 18 crore voters.
              Live tally, constituency-level updates, and analysis from LoktantraVani&apos;s politics desk.
            </p>
          </header>

          {/* State-by-state primer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-12">
            {[
              { state: "Tamil Nadu", seats: 234, leader: "DMK+", color: "border-red-600" },
              { state: "West Bengal", seats: 294, leader: "TMC", color: "border-green-600" },
              { state: "Kerala", seats: 140, leader: "LDF", color: "border-red-700" },
              { state: "Assam", seats: 126, leader: "BJP+", color: "border-orange-600" },
              { state: "Puducherry", seats: 30, leader: "NDA", color: "border-orange-500" },
            ].map((c) => (
              <div key={c.state} className={`border-l-4 ${c.color} bg-white dark:bg-white/5 p-4`}>
                <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-50 dark:text-white/50 mb-1">{c.state}</p>
                <p className="text-2xl font-newsreader font-black dark:text-white leading-none mb-1">{c.seats}</p>
                <p className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/60">seats</p>
                <p className="text-[11px] font-inter font-bold mt-2 dark:text-white/80">Leading: <span className="text-red-600">{c.leader}</span></p>
              </div>
            ))}
          </div>

          {/* Related coverage */}
          {relevant.length > 0 && (
            <>
              <div className="border-t-2 border-black dark:border-white/30 pt-6 md:pt-10 mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-newsreader font-black tracking-tight dark:text-white">
                  Election Coverage & Analysis
                </h2>
                <p className="text-sm font-inter opacity-60 dark:text-white/50 mt-1">
                  Op-eds, ground reports, and number-crunching from across the cycle.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {relevant.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            </>
          )}

          {/* Footnote */}
          <p className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/40 mt-12 border-t border-black/10 dark:border-white/10 pt-4">
            Source: Election Commission of India · Live tally updated every 60 seconds during counting · Final figures may vary.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
