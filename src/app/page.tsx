"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  ArrowRight,
  Zap,
  History,
  Sparkles,
  ShieldAlert,
  Newspaper,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHeading from "@/components/SectionHeading";
import BlogCard from "@/components/BlogCard";
import CategoryBadge from "@/components/CategoryBadge";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function LandingPage() {
  const { lang, t } = useLanguage();

  const allPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `home-${i}`,
        createdAt: new Date(Date.now() - i * 3600000 * (i + 1)),
        updatedAt: new Date(),
      })),
    []
  );

  const geoPosts = allPosts.filter((p) => ["Geopolitics", "IR"].includes(p.category));
  const genzPosts = allPosts.filter((p) => ["GenZ", "Ancient India"].includes(p.category));
  const cartoonPosts = allPosts.filter((p) => p.category === "Cartoon Mandala");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 selection:bg-primary/30 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          {/* Breaking News Ticker */}
          <div className="bg-[#fff9f3] dark:bg-primary/5 border-2 border-black dark:border-white/20 py-4 mb-16 flex items-center gap-8 overflow-hidden relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
            <div className="bg-black text-white px-6 py-2 text-[11px] font-inter font-black uppercase shrink-0 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-primary animate-pulse" />
              {t("MANDATORY UPDATES", "अनिवार्य अपडेट")}
            </div>
            <div className="flex gap-16 text-lg font-newsreader font-black italic whitespace-nowrap animate-[marquee_40s_linear_infinite] overflow-visible dark:text-white">
              <span>{t("• The Indo-Pacific Mandala: New Cold War Dynamics Revealed", "• हिंद-प्रशांत मंडला: नए शीत युद्ध की गतिशीलता का खुलासा")}</span>
              <span>{t("• GenZ Voters Prefer Ancient Governance Structures in Recent Poll", "• जेनज़ी मतदाता हाल के सर्वेक्षण में प्राचीन शासन संरचनाओं को पसंद करते हैं")}</span>
              <span>{t("• Silicon Valley Meets Sacred Geometry: The Future of IA", "• सिलिकॉन वैली पवित्र ज्यामिति से मिलती है: IA का भविष्य")}</span>
              <span>{t("• Global South Soft Power: Bharat Leading the Multipolar World", "• ग्लोबल साउथ सॉफ्ट पावर: बहुध्रुवीय विश्व का नेतृत्व करता भारत")}</span>
            </div>
          </div>

          {/* Today's Edition CTA */}
          <Link href="/daily">
            <div className="mb-16 p-6 border-4 border-primary bg-primary/5 flex items-center justify-between group cursor-pointer hover:shadow-[8px_8px_0px_0px_#FF9933] transition-all">
              <div className="flex items-center gap-4">
                <Newspaper className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-xl font-newsreader font-black uppercase dark:text-white">
                    {t("Today's Edition", "आज का संस्करण")}
                  </h3>
                  <p className="text-xs font-inter opacity-60 dark:text-white/60">
                    {t("Read the full broadsheet newspaper edition", "पूर्ण ब्रॉडशीट अखबार संस्करण पढ़ें")}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>

          {/* ═══ IR & Geopolitics Section ═══ */}
          <section className="mb-24">
            <SectionHeading icon={Globe}>
              {t("Neo Bharat Geopolitics", "नव भारत भू-राजनीति")}
            </SectionHeading>
            {geoPosts.length > 0 && (
              <div className="mb-8">
                <BlogCard post={geoPosts[0]} featured />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {geoPosts.slice(1, 4).map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/category/Geopolitics"
                className="inline-flex items-center gap-2 text-xs font-inter font-black uppercase tracking-widest text-primary hover:underline"
              >
                {t("View All Geopolitics", "सभी भू-राजनीति देखें")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* ═══ GenZ & Ancient India Section ═══ */}
          <section className="mb-24 bg-black dark:bg-white/5 text-white p-16 -mx-8 md:-mx-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-6 mb-16">
                <Zap className="w-12 h-12 text-primary fill-primary" />
                <h2 className="text-5xl md:text-8xl font-newsreader font-black tracking-tighter uppercase leading-none">
                  GenZ <span className="text-primary italic opacity-50">&</span> Ancient India
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {genzPosts.slice(0, 2).map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                    <div className="space-y-6 border-l-2 border-white/10 pl-8 hover:border-primary transition-colors">
                      <CategoryBadge category={post.category} linked={false} />
                      <h4 className={cn(
                        "text-4xl font-newsreader font-bold leading-tight underline decoration-primary/20 hover:decoration-primary transition-all underline-offset-8",
                        lang === "hi" && "hindi"
                      )}>
                        {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[10px] font-inter font-bold opacity-40">
                        <span>#{post.tags[0]}</span>
                        <span>{post.viewCount >= 1000 ? `${Math.round(post.viewCount / 1000)}K` : post.viewCount} {t("READS", "पाठक")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link href="/category/GenZ" className="bg-primary/10 border border-primary/20 p-8 flex flex-col justify-between items-start">
                  <Sparkles className="w-10 h-10 text-primary" />
                  <h4 className="text-2xl font-newsreader font-bold italic py-6">
                    {t(
                      "The GenZ perspective on civilizational reclaim. Explore all articles.",
                      "सभ्यतागत पुनर्दावे पर जेनज़ी का दृष्टिकोण। सभी लेख देखें।"
                    )}
                  </h4>
                  <span className="flex items-center gap-3 text-sm font-inter font-black tracking-[0.3em] text-primary uppercase">
                    {t("EXPLORE", "खोजें")} <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          {/* ═══ Cartoon Mandala Section ═══ */}
          <section className="py-24 border-y-8 border-black dark:border-white/20 border-double bg-[#f9f9f9] dark:bg-white/5 -mx-8 md:-mx-16 px-8 md:px-16">
            <div className="max-w-7xl mx-auto">
              <SectionHeading icon={Sparkles}>
                {t("Cartoon Mandala", "कार्टून मंडला")}
              </SectionHeading>
              <div className="grid grid-cols-12 gap-12">
                <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[#111] p-12 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform" />
                  {cartoonPosts[0] ? (
                    <Link href={`/blog/${cartoonPosts[0].slug}`} className="relative z-10 space-y-8 block">
                      <span className="text-xs font-inter font-black tracking-[0.4em] text-primary uppercase underline">
                        Satyricon Bharat
                      </span>
                      <div className="aspect-square bg-muted flex items-center justify-center border-4 border-black dark:border-white/20 overflow-hidden">
                        <img
                          src={cartoonPosts[0].imageUrl}
                          alt={cartoonPosts[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-3xl font-newsreader font-black italic group-hover:text-primary transition-colors dark:text-white">
                        &ldquo;{lang === "hi" && cartoonPosts[0].titleHi ? cartoonPosts[0].titleHi : cartoonPosts[0].title}&rdquo;
                      </h4>
                    </Link>
                  ) : (
                    <div className="relative z-10 space-y-8">
                      <span className="text-xs font-inter font-black tracking-[0.4em] text-primary uppercase underline">
                        Satyricon Bharat
                      </span>
                      <div className="aspect-square bg-muted flex items-center justify-center border-4 border-black dark:border-white/20 p-12">
                        <div className="text-center space-y-6">
                          <Sparkles className="w-16 h-16 text-primary mx-auto" />
                          <h4 className="text-3xl font-newsreader font-black italic dark:text-white">
                            {t("Coming Soon", "जल्द आ रहा है")}
                          </h4>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-12 lg:col-span-5 flex flex-col justify-center space-y-8 pl-0 lg:pl-12">
                  <blockquote className="text-3xl md:text-4xl font-newsreader font-black italic leading-[1.1] text-black dark:text-white">
                    {t(
                      '"A cartoon is a democratic weapon that cuts deeper than a thousand articles."',
                      '"एक कार्टून एक लोकतांत्रिक हथियार है जो हजार लेखों से गहरा काटता है।"'
                    )}
                  </blockquote>
                  <div className="space-y-4">
                    <p className="font-inter font-black text-xs uppercase tracking-widest text-[#1a1c1c] dark:text-white/40 opacity-40">
                      {t("Previous Mandalas", "पिछले मंडला")}
                    </p>
                    {cartoonPosts.slice(1).map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="py-4 border-b border-black/10 dark:border-white/10 group flex items-center justify-between"
                      >
                        <span className="text-lg font-newsreader font-bold group-hover:text-primary dark:text-white">
                          {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-primary" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/cartoon-mandala"
                    className="inline-flex items-center gap-2 text-xs font-inter font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    {t("View All Cartoons", "सभी कार्टून देखें")} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ All Articles CTA ═══ */}
          <div className="mt-24 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-4 px-12 py-6 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-sm uppercase tracking-[0.3em] hover:bg-primary transition-colors shadow-[8px_8px_0px_0px_#FF9933]"
            >
              {t("Read All Articles", "सभी लेख पढ़ें")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
