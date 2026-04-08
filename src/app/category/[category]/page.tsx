"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Globe, Zap, History, ShieldAlert, Sparkles, Cpu, Vote, Swords, Building2, TrendingUp, Megaphone, MapPin, Newspaper } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import type { Post, PostCategory } from "@/lib/types";

const CATEGORY_META: Record<string, { icon: typeof Globe; descEn: string; descHi: string; nameHi: string }> = {
  India: { icon: Newspaper, descEn: "The pulse of the nation — politics, policy, and the people.", descHi: "राष्ट्र की नब्ज — राजनीति, नीति और जनता।", nameHi: "भारत" },
  World: { icon: Globe, descEn: "Global affairs through an Indian lens.", descHi: "भारतीय दृष्टि से वैश्विक मामले।", nameHi: "विश्व" },
  Politics: { icon: Vote, descEn: "Democracy in action — Parliament, elections, and governance.", descHi: "कार्यरत लोकतंत्र — संसद, चुनाव और शासन।", nameHi: "राजनीति" },
  Geopolitics: { icon: Globe, descEn: "Strategic analysis of global power dynamics and India's role.", descHi: "वैश्विक शक्ति गतिशीलता और भारत की भूमिका का रणनीतिक विश्लेषण।", nameHi: "भू-राजनीति" },
  Economy: { icon: TrendingUp, descEn: "Markets, trade, and India's economic ascent.", descHi: "बाजार, व्यापार और भारत की आर्थिक उन्नति।", nameHi: "अर्थव्यवस्था" },
  Sports: { icon: Zap, descEn: "Cricket, kabaddi, and India's sporting revolution.", descHi: "क्रिकेट, कबड्डी और भारत की खेल क्रांति।", nameHi: "खेल" },
  Tech: { icon: Cpu, descEn: "AI, startups, ISRO, and India's digital transformation.", descHi: "AI, स्टार्टअप, ISRO और भारत का डिजिटल परिवर्तन।", nameHi: "टेक" },
  Defence: { icon: Swords, descEn: "Military modernization, Atmanirbhar defence, and strategic capabilities.", descHi: "सैन्य आधुनिकीकरण, आत्मनिर्भर रक्षा और रणनीतिक क्षमताएं।", nameHi: "रक्षा" },
  Opinion: { icon: Megaphone, descEn: "Perspectives, editorials, and the national debate.", descHi: "दृष्टिकोण, संपादकीय और राष्ट्रीय बहस।", nameHi: "राय" },
  Cities: { icon: MapPin, descEn: "New Delhi, Patna, Guwahati, Kolkata — urban India's stories.", descHi: "नई दिल्ली, पटना, गुवाहाटी, कोलकाता — शहरी भारत की कहानियां।", nameHi: "शहर" },
  "West Asia": { icon: ShieldAlert, descEn: "Conflict, diplomacy, and India's stakes in the Middle East.", descHi: "संघर्ष, कूटनीति और मध्य पूर्व में भारत के हित।", nameHi: "पश्चिम एशिया" },
  IR: { icon: Globe, descEn: "International Relations and India's foreign policy.", descHi: "अंतर्राष्ट्रीय संबंध और भारत की विदेश नीति।", nameHi: "अंतर्राष्ट्रीय संबंध" },
  Culture: { icon: Sparkles, descEn: "Art, heritage, cinema, and the cultural fabric of India.", descHi: "कला, विरासत, सिनेमा और भारत का सांस्कृतिक ताना-बाना।", nameHi: "संस्कृति" },
  Viral: { icon: Zap, descEn: "Trending stories the internet can't stop talking about.", descHi: "ट्रेंडिंग कहानियां जिनकी चर्चा थमने का नाम नहीं लेती।", nameHi: "वायरल" },
  "Ancient India": { icon: History, descEn: "Civilizational wisdom for contemporary challenges.", descHi: "समकालीन चुनौतियों के लिए सभ्यतागत ज्ञान।", nameHi: "प्राचीन भारत" },
  "Lok Post": { icon: Sparkles, descEn: "Satirical commentary on Bharat's paradoxes.", descHi: "भारत के विरोधाभासों पर व्यंग्यात्मक टिप्पणी।", nameHi: "कार्टून मंडला" },
  Markets: { icon: TrendingUp, descEn: "Sensex, Nifty, and the world of finance.", descHi: "सेंसेक्स, निफ्टी और वित्त की दुनिया।", nameHi: "बाजार" },
};

export default function CategoryPage() {
  const params = useParams();
  const category = decodeURIComponent(params?.category as string);
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = CATEGORY_META[category];
  const Icon = meta?.icon || Globe;

  // Fetch real articles from Firestore
  useEffect(() => {
    let cancelled = false;
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/admin/list-posts?status=published`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (cancelled) return;
        const filtered = (data.posts || [])
          .filter((p: Post) => p.category === category)
          .sort((a: Post, b: Post) => {
            const da = typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() : 0;
            const db = typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() : 0;
            return db - da;
          });
        setPosts(filtered);
      } catch {
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPosts();
    return () => { cancelled = true; };
  }, [category]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[180px] md:pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-primary mb-8 dark:text-white/40">
            <ArrowLeft className="w-4 h-4" /> {t("All Articles", "सभी लेख")}
          </Link>

          {/* Category Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 md:mb-16 pb-6 md:pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="flex items-center gap-3 md:gap-4 mb-4">
              <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-newsreader font-black uppercase tracking-tighter dark:text-white">
                {lang === "hi" && meta ? meta.nameHi : category}
              </h1>
            </div>
            {meta && (
              <p className="text-base md:text-lg font-newsreader italic opacity-60 max-w-2xl dark:text-white/60">
                {lang === "hi" ? meta.descHi : meta.descEn}
              </p>
            )}
            {!loading && (
              <p className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 mt-4 dark:text-white/40">
                {posts.length} {t("articles", "लेख")}
              </p>
            )}
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-white/10 h-48 mb-4" />
                  <div className="bg-gray-200 dark:bg-white/10 h-4 w-20 mb-2" />
                  <div className="bg-gray-200 dark:bg-white/10 h-6 w-3/4 mb-2" />
                  <div className="bg-gray-200 dark:bg-white/10 h-4 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div className="grid grid-cols-12 gap-6 md:gap-12">
              <div className="col-span-12 lg:col-span-8">
                {posts.length > 0 && (
                  <div className="mb-8 md:mb-12">
                    <BlogCard post={posts[0]} featured />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {posts.slice(1).map((post, idx) => (
                    <motion.div key={post.id || post.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <BlogCard post={post} />
                    </motion.div>
                  ))}
                </div>
                {posts.length === 0 && (
                  <div className="text-center py-24">
                    <p className="text-xl md:text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                      {t("No articles found in this category yet.", "इस श्रेणी में अभी तक कोई लेख नहीं।")}
                    </p>
                    <Link href="/blog" className="inline-block mt-6 text-xs font-inter font-bold uppercase tracking-widest text-primary hover:underline">
                      {t("Browse all articles →", "सभी लेख देखें →")}
                    </Link>
                  </div>
                )}
              </div>
              <aside className="col-span-12 lg:col-span-4">
                <NewsletterSignup />
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
