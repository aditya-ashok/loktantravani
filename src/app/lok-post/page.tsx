"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import CartoonCard from "@/components/CartoonCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";
import type { Post } from "@/lib/types";

export default function CartoonMandalaPage() {
  const { lang, t } = useLanguage();

  const cartoonPosts: Post[] = useMemo(
    () =>
      SEED_POSTS.filter((p) => p.category === "Lok Post").map((p, i) => ({
        ...p,
        id: `seed-cm-${i}`,
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(),
      })),
    []
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-inter font-black tracking-[0.5em] text-primary uppercase">
                Satyricon Bharat
              </span>
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-6xl md:text-9xl font-newsreader font-black uppercase tracking-tighter mb-6 dark:text-white">
              {t("Lok Post", "कार्टून मंडला")}
            </h1>
            <p className="text-xl font-newsreader italic opacity-60 max-w-2xl mx-auto dark:text-white/60">
              {t(
                "Where satirical art meets democratic dissent. Visual commentary on Bharat's paradoxes, from the chai tapri to the corridors of power.",
                "जहाँ व्यंग्यात्मक कला लोकतांत्रिक असहमति से मिलती है। चाय टपरी से सत्ता के गलियारों तक, भारत के विरोधाभासों पर दृश्य टिप्पणी।"
              )}
            </p>
          </motion.div>

          {/* Quote Banner */}
          <div className="bg-black dark:bg-white text-white dark:text-black p-12 mb-16 text-center">
            <blockquote className="text-3xl md:text-4xl font-newsreader font-black italic leading-tight max-w-3xl mx-auto">
              {t(
                '"A cartoon is a democratic weapon that cuts deeper than a thousand articles."',
                '"एक कार्टून एक लोकतांत्रिक हथियार है जो हजार लेखों से गहरा काटता है।"'
              )}
            </blockquote>
            <p className="mt-4 text-[10px] font-inter font-black uppercase tracking-widest opacity-60">
              — LoktantraVani Editorial Manifesto
            </p>
          </div>

          {/* Cartoon Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {cartoonPosts.map((post, idx) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <CartoonCard post={post} />
              </motion.div>
            ))}
          </div>

          {cartoonPosts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                {t("Cartoons coming soon...", "कार्टून जल्द आ रहे हैं...")}
              </p>
            </div>
          )}

          {/* Submit Cartoon CTA */}
          <div className="border-4 border-primary p-12 text-center bg-primary/5">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-3xl font-newsreader font-black uppercase mb-4 dark:text-white">
              {t("Submit Your Cartoon", "अपना कार्टून भेजें")}
            </h3>
            <p className="font-inter text-sm opacity-60 max-w-lg mx-auto mb-6 dark:text-white/60">
              {t(
                "Have a satirical take on Indian democracy, tech culture, or the ancient-modern paradox? Submit your cartoon for editorial review.",
                "भारतीय लोकतंत्र, तकनीकी संस्कृति, या प्राचीन-आधुनिक विरोधाभास पर कोई व्यंग्यात्मक दृष्टिकोण? संपादकीय समीक्षा के लिए अपना कार्टून भेजें।"
              )}
            </p>
            <button className="inline-flex items-center gap-3 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors">
              {t("Submit Dissent", "असहमति भेजें")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Newsletter */}
          <div className="mt-16 max-w-md mx-auto">
            <NewsletterSignup />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
