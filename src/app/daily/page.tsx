"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Printer, Globe, Zap, Sparkles, History, Clock, MapPin, Users, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryBadge from "@/components/CategoryBadge";
import VaniLivePod from "@/components/VaniLivePod";
import VaniBot from "@/components/VaniBot";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

const REGIONAL_EDITIONS = [
  { id: "national", en: "National", hi: "राष्ट्रीय", icon: "🇮🇳" },
  { id: "delhi", en: "Delhi NCR", hi: "दिल्ली NCR", icon: "🏛️" },
  { id: "bihar", en: "Bihar", hi: "बिहार", icon: "🌾" },
  { id: "patna", en: "Patna", hi: "पटना", icon: "📍" },
  { id: "northeast", en: "North East", hi: "पूर्वोत्तर", icon: "🏔️" },
];

const REGIONAL_NEWS: Record<string, { en: string; hi: string }[]> = {
  delhi: [
    { en: "Delhi Budget 2026: ₹5,000 Cr for Smart Governance", hi: "दिल्ली बजट 2026: स्मार्ट गवर्नेंस के लिए ₹5,000 करोड़" },
    { en: "Yamuna Rejuvenation Phase 3 Begins with AI-Monitored Water Quality", hi: "एआई-मॉनिटर जल गुणवत्ता के साथ यमुना पुनर्जीवन चरण 3 शुरू" },
    { en: "Metro Phase IV Extends to Noida International Airport", hi: "मेट्रो फेज IV नोएडा अंतरराष्ट्रीय हवाई अड्डे तक विस्तारित" },
  ],
  bihar: [
    { en: "Bihar's EdTech Revolution: 10M Students on Digital Platform", hi: "बिहार की एडटेक क्रांति: डिजिटल प्लेटफॉर्म पर 1 करोड़ छात्र" },
    { en: "Nalanda University Campus Expansion Gets Global UNESCO Support", hi: "नालंदा विश्वविद्यालय परिसर विस्तार को वैश्विक यूनेस्को समर्थन" },
    { en: "Bihar Flood Management: AI-Powered Early Warning System Saves 200 Villages", hi: "बिहार बाढ़ प्रबंधन: एआई-संचालित प्रारंभिक चेतावनी प्रणाली ने 200 गांवों को बचाया" },
  ],
  patna: [
    { en: "Patna Smart City 2.0: Heritage Conservation Meets Digital Infrastructure", hi: "पटना स्मार्ट सिटी 2.0: विरासत संरक्षण और डिजिटल अवसंरचना का मिलन" },
    { en: "Ganga Expressway Patna Stretch Opens, Cuts Travel Time by 40%", hi: "गंगा एक्सप्रेसवे पटना स्ट्रेच खुला, यात्रा समय 40% कम" },
    { en: "Patna University Launches Ancient Indian Studies Center with IIT Collaboration", hi: "पटना विश्वविद्यालय ने IIT सहयोग से प्राचीन भारतीय अध्ययन केंद्र शुरू किया" },
  ],
  northeast: [
    { en: "Act East Policy 2.0: Northeast Emerges as India-ASEAN Trade Gateway", hi: "एक्ट ईस्ट नीति 2.0: पूर्वोत्तर भारत-आसियान व्यापार द्वार के रूप में उभरा" },
    { en: "Assam's Tea Tourism Gets ₹2,000 Cr Investment Under Heritage Circuit", hi: "असम के चाय पर्यटन को हेरिटेज सर्किट के तहत ₹2,000 करोड़ निवेश" },
    { en: "Meghalaya Leads India in Community Forest Conservation Model", hi: "मेघालय सामुदायिक वन संरक्षण मॉडल में भारत का नेतृत्व करता है" },
  ],
};

export default function DailyEditionPage() {
  const { lang, t } = useLanguage();
  const [activeRegion, setActiveRegion] = useState("national");
  const [showPod, setShowPod] = useState(false);

  const allPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.map((p, i) => ({
        ...p,
        id: `daily-${i}`,
        createdAt: new Date(Date.now() - i * 3600000),
        updatedAt: new Date(),
      })),
    []
  );

  const leadStory = allPosts[0];
  const geopoliticsPosts = allPosts.filter((p) => ["Geopolitics", "IR"].includes(p.category));
  const genzPosts = allPosts.filter((p) => ["GenZ", "Ancient India"].includes(p.category));
  const politicsPosts = allPosts.filter((p) => p.category === "Politics");
  const techPosts = allPosts.filter((p) => p.category === "Tech");
  const cartoonPosts = allPosts.filter((p) => p.category === "Lok Post");

  // Edition number (days since arbitrary launch date)
  const launchDate = new Date("2026-01-01");
  const editionNumber = Math.floor((Date.now() - launchDate.getTime()) / 86400000);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          {/* ═══════════ MASTHEAD ═══════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-2 pt-4"
          >
            <div className="flex items-center justify-between text-[9px] font-inter font-black uppercase tracking-[0.4em] opacity-30 dark:text-white/30 mb-4">
              <span>Vol. 1</span>
              <span>{t("Neo Bharat Editorial — Est. 2026", "नव भारत संपादकीय — स्था. 2026")}</span>
              <span>No. {editionNumber}</span>
            </div>

            <div className="border-t-[6px] border-b-[2px] border-black dark:border-white/40 py-6 mb-2">
              <h1 className="text-7xl md:text-[120px] font-newsreader font-black tracking-[-0.04em] uppercase leading-none dark:text-white">
                Loktantra<span className="text-primary">Vani</span>
              </h1>
            </div>
            <div className="border-b-[6px] border-black dark:border-white/40 pb-4 flex justify-between items-center text-[10px] font-inter font-black uppercase tracking-widest dark:text-white">
              <span className="opacity-40">
                {t("Saturday, March 21, 2026", "शनिवार, 21 मार्च, 2026")}
              </span>
              <span className="text-primary">{t("DAILY EDITION", "दैनिक संस्करण")}</span>
              <div className="flex items-center gap-6 no-print">
                <button
                  onClick={() => setShowPod(true)}
                  className="flex items-center gap-2 text-primary hover:scale-105 transition-transform"
                >
                  <Sparkles className="w-4 h-4" /> {t("LISTEN TO VANI LIVE", "वाणी लाइव सुनें")}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 opacity-40 hover:opacity-100 hover:text-primary transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> PRINT
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══════════ LEAD STORY (spans full width) ═══════════ */}
          {leadStory && (
            <Link href={`/blog/${leadStory.slug}`}>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8 py-10 border-b-2 border-black dark:border-white/20 group cursor-pointer"
              >
                <div className="md:col-span-7 space-y-4">
                  <CategoryBadge category={leadStory.category} size="md" />
                  <h2
                    className={`text-5xl md:text-7xl font-newsreader font-black leading-[0.9] tracking-tighter group-hover:text-primary transition-colors dark:text-white ${
                      lang === "hi" ? "hindi" : ""
                    }`}
                  >
                    {lang === "hi" && leadStory.titleHi ? leadStory.titleHi : leadStory.title}
                  </h2>
                  <p className="text-lg font-newsreader italic opacity-60 dark:text-white/60">
                    {lang === "hi" && leadStory.summaryHi ? leadStory.summaryHi : leadStory.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-inter font-bold opacity-40 uppercase dark:text-white/40">
                    <span>BY {leadStory.author}</span>
                    <span className="w-1 h-1 bg-primary rounded-full" />
                    <span>{leadStory.readingTimeMin} MIN READ</span>
                    <span className="w-1 h-1 bg-primary rounded-full" />
                    <span>CONTINUED ON PAGE 2 →</span>
                  </div>
                </div>
                <div className="md:col-span-5 aspect-[4/3] overflow-hidden border-2 border-black dark:border-white/10">
                  <img
                    src={leadStory.imageUrl}
                    alt={leadStory.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
              </motion.section>
            </Link>
          )}

          {/* ═══════════ THREE-COLUMN BROADSHEET ═══════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 py-10 border-b-2 border-black dark:border-white/20">
            {/* Column 1: Geopolitics */}
            <div className="column-rule-vertical pr-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-black dark:border-white/20 mb-4">
                <Globe className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">
                  {t("Geopolitics", "भू-राजनीति")}
                </h3>
              </div>
              {geopoliticsPosts.slice(0, 3).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                  <article className="space-y-2 pb-6 border-b border-black/10 dark:border-white/10">
                    <h4 className={`text-xl font-newsreader font-bold leading-tight group-hover:text-primary transition-colors dark:text-white ${lang === "hi" ? "hindi" : ""}`}>
                      {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                    </h4>
                    <p className="text-xs font-inter opacity-50 line-clamp-3 text-justify dark:text-white/50">
                      {lang === "hi" && post.summaryHi ? post.summaryHi : post.summary}
                    </p>
                    <span className="text-[9px] font-inter font-bold opacity-30 uppercase dark:text-white/30">
                      BY {post.author} &bull; {post.readingTimeMin} MIN
                    </span>
                  </article>
                </Link>
              ))}
            </div>

            {/* Column 2: GenZ & Ancient India */}
            <div className="column-rule-vertical px-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-black dark:border-white/20 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">
                  {t("GenZ Pulse", "जेनज़ी पल्स")}
                </h3>
              </div>
              {genzPosts.slice(0, 3).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                  <article className="space-y-2 pb-6 border-b border-black/10 dark:border-white/10">
                    <h4 className={`text-xl font-newsreader font-bold leading-tight group-hover:text-primary transition-colors dark:text-white ${lang === "hi" ? "hindi" : ""}`}>
                      {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                    </h4>
                    <p className="text-xs font-inter opacity-50 line-clamp-3 text-justify dark:text-white/50">
                      {lang === "hi" && post.summaryHi ? post.summaryHi : post.summary}
                    </p>
                    <span className="text-[9px] font-inter font-bold opacity-30 uppercase dark:text-white/30">
                      BY {post.author} &bull; {post.readingTimeMin} MIN
                    </span>
                  </article>
                </Link>
              ))}
            </div>

            {/* Column 3: Politics & Tech + Cartoon of the Day */}
            <div className="pl-8 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-black dark:border-white/20 mb-4">
                <History className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-inter font-black uppercase tracking-widest dark:text-white">
                  {t("Policy & Tech", "नीति और तकनीक")}
                </h3>
              </div>
              {[...politicsPosts, ...techPosts].slice(0, 2).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                  <article className="space-y-2 pb-6 border-b border-black/10 dark:border-white/10">
                    <h4 className={`text-xl font-newsreader font-bold leading-tight group-hover:text-primary transition-colors dark:text-white ${lang === "hi" ? "hindi" : ""}`}>
                      {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                    </h4>
                    <p className="text-xs font-inter opacity-50 line-clamp-3 text-justify dark:text-white/50">
                      {lang === "hi" && post.summaryHi ? post.summaryHi : post.summary}
                    </p>
                    <span className="text-[9px] font-inter font-bold opacity-30 uppercase dark:text-white/30">
                      BY {post.author} &bull; {post.readingTimeMin} MIN
                    </span>
                  </article>
                </Link>
              ))}

              {/* Cartoon of the Day */}
              {cartoonPosts[0] && (
                <Link href={`/blog/${cartoonPosts[0].slug}`}>
                  <div className="border-4 border-black dark:border-white/20 p-4 group cursor-pointer">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-[9px] font-inter font-black uppercase tracking-widest text-primary">
                        {t("Cartoon of the Day", "आज का कार्टून")}
                      </span>
                    </div>
                    <div className="aspect-square bg-muted overflow-hidden mb-3">
                      <img
                        src={cartoonPosts[0].imageUrl}
                        alt={cartoonPosts[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-lg font-newsreader font-bold italic group-hover:text-primary transition-colors dark:text-white">
                      &ldquo;{lang === "hi" && cartoonPosts[0].titleHi ? cartoonPosts[0].titleHi : cartoonPosts[0].title}&rdquo;
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* ═══════════ EDITOR'S NOTE ═══════════ */}
          <div className="py-10 border-b-2 border-black dark:border-white/20">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-[10px] font-inter font-black uppercase tracking-widest text-primary mb-4">
                {t("Editor's Note", "संपादक की टिप्पणी")}
              </p>
              <p className="text-xl font-newsreader italic leading-relaxed dark:text-white/80">
                {t(
                  "In this edition, we examine the evolving mandala of global power — from the Quad's strategic geometry to the GenZ voter's civilizational reclaim. The cartoons, as always, say what our editorials dare not. Read with the discernment of a Chanakya and the curiosity of a first-time voter.",
                  "इस संस्करण में, हम वैश्विक शक्ति के विकसित मंडला की जांच करते हैं — क्वाड की रणनीतिक ज्यामिति से लेकर जेनज़ी मतदाता के सभ्यतागत पुनर्दावे तक। कार्टून, हमेशा की तरह, वह कहते हैं जो हमारे संपादकीय कहने की हिम्मत नहीं करते।"
                )}
              </p>
              <p className="text-sm font-newsreader font-bold mt-6 dark:text-white">— Aditya Vani, {t("Chief Editor", "प्रधान संपादक")}</p>
            </div>
          </div>

          {/* ═══════════ LIVE READER COUNT ═══════════ */}
          <div className="py-6 border-b-2 border-black dark:border-white/20 flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm font-inter font-black dark:text-white">
                <span className="text-primary text-lg">{(2847 + Math.floor(Math.random() * 200)).toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 ml-2">{t("reading now", "अभी पढ़ रहे हैं")}</span>
              </span>
            </div>
            <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 opacity-40 dark:text-white/40" />
              <span className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                {(145200 + Math.floor(Math.random() * 1000)).toLocaleString()} {t("total readers today", "आज कुल पाठक")}
              </span>
            </div>
          </div>

          {/* ═══════════ REGIONAL EDITIONS ═══════════ */}
          <div className="py-10 border-b-2 border-black dark:border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-inter font-black uppercase tracking-widest dark:text-white">
                {t("Regional Editions", "क्षेत्रीय संस्करण")}
              </h3>
            </div>

            {/* Region Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {REGIONAL_EDITIONS.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id)}
                  className={`px-4 py-2 text-[10px] font-inter font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
                    activeRegion === region.id
                      ? "bg-primary text-white border-primary"
                      : "border-black/10 dark:border-white/10 hover:border-primary dark:text-white"
                  }`}
                >
                  <span>{region.icon}</span>
                  {lang === "hi" ? region.hi : region.en}
                </button>
              ))}
            </div>

            {/* Regional News */}
            {activeRegion === "national" ? (
              <div className="text-center py-8">
                <p className="text-sm font-newsreader italic opacity-60 dark:text-white/60">
                  {t(
                    "You are viewing the National edition. Select a region above for local news.",
                    "आप राष्ट्रीय संस्करण देख रहे हैं। स्थानीय समाचारों के लिए ऊपर एक क्षेत्र चुनें।"
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(REGIONAL_NEWS[activeRegion] || []).map((news, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-2 border-black/10 dark:border-white/10 p-6 hover:border-primary transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">
                        {REGIONAL_EDITIONS.find((r) => r.id === activeRegion)?.icon}
                      </span>
                      <span className="text-[9px] font-inter font-black uppercase tracking-widest text-primary">
                        {lang === "hi"
                          ? REGIONAL_EDITIONS.find((r) => r.id === activeRegion)?.hi
                          : REGIONAL_EDITIONS.find((r) => r.id === activeRegion)?.en}
                      </span>
                    </div>
                    <h4 className="text-lg font-newsreader font-bold leading-tight group-hover:text-primary transition-colors dark:text-white">
                      {lang === "hi" ? news.hi : news.en}
                    </h4>
                    <p className="text-[9px] font-inter font-bold opacity-30 uppercase mt-3 dark:text-white/30">
                      {t("2 hours ago", "2 घंटे पहले")} &bull; {t("3 min read", "3 मिनट पढ़ें")}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════ TRENDING CLASSIFIEDS-STYLE SIDEBAR ═══════════ */}
          <div className="py-10">
            <h3 className="text-sm font-inter font-black uppercase tracking-widest text-center mb-8 dark:text-white">
              {t("What Bharat is Reading", "भारत क्या पढ़ रहा है")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allPosts
                .sort((a, b) => b.viewCount - a.viewCount)
                .slice(0, 4)
                .map((post, idx) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group p-4 border border-black/10 dark:border-white/10">
                    <span className="text-4xl font-newsreader font-black text-primary opacity-30">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-newsreader font-bold mt-2 leading-tight group-hover:text-primary transition-colors dark:text-white">
                      {lang === "hi" && post.titleHi ? post.titleHi : post.title}
                    </p>
                    <span className="text-[9px] font-inter font-bold opacity-30 uppercase dark:text-white/30">
                      {post.viewCount.toLocaleString()} {t("reads", "पाठक")}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <VaniLivePod 
        posts={allPosts.slice(0, 10)} 
        isOpen={showPod} 
        onClose={() => setShowPod(false)} 
      />
      <VaniBot articleTitle="Today's Daily Edition" />
    </>
  );
}
