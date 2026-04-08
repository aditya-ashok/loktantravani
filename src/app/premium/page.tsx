"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown, Check, Zap, Shield, BarChart3, Globe, Newspaper,
  Star, Sparkles, Lock, TrendingUp, Eye, Headphones,
  Mic, Video, Database, Bell, FileText, Radio, Cpu,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

// ─── Ultra Design Tokens ──────────────────────────────────
const ULTRA = {
  gradient: "from-purple-600 via-pink-600 to-orange-500",
  glow: "shadow-[0_0_80px_rgba(168,85,247,0.3),0_0_160px_rgba(236,72,153,0.15)]",
  card: "bg-white/[0.03] backdrop-blur-xl border border-white/10",
  text: "bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    nameHi: "मुफ्त",
    price: 0,
    priceLabel: "₹0",
    period: "forever",
    periodHi: "हमेशा",
    gradient: "from-gray-600 to-gray-500",
    popular: false,
    features: [
      { text: "All news articles", textHi: "सभी समाचार लेख", included: true },
      { text: "Basic West Asia data", textHi: "बेसिक पश्चिम एशिया डेटा", included: true },
      { text: "Bilingual Hindi-English", textHi: "द्विभाषी हिन्दी-अंग्रेज़ी", included: true },
      { text: "E-Paper access", textHi: "ई-पेपर एक्सेस", included: true },
      { text: "Ad-supported experience", textHi: "विज्ञापन सहित अनुभव", included: true },
      { text: "Ultra analysis & data", textHi: "अल्ट्रा विश्लेषण", included: false },
      { text: "AI Podcast episodes", textHi: "AI पॉडकास्ट", included: false },
      { text: "Market predictions", textHi: "बाज़ार भविष्यवाणी", included: false },
    ],
  },
  {
    id: "monthly",
    name: "ULTRA",
    nameHi: "अल्ट्रा",
    price: 99,
    priceLabel: "₹99",
    period: "/month",
    periodHi: "/माह",
    gradient: "from-purple-600 via-pink-600 to-orange-500",
    popular: true,
    features: [
      { text: "Everything in Free", textHi: "फ्री की सभी सुविधाएं", included: true },
      { text: "Zero ads experience", textHi: "बिना विज्ञापन अनुभव", included: true },
      { text: "Deep geopolitical analysis", textHi: "गहन भू-राजनीतिक विश्लेषण", included: true },
      { text: "West Asia full datasets", textHi: "पश्चिम एशिया पूर्ण डेटा", included: true },
      { text: "30-day market predictions", textHi: "30-दिन बाज़ार भविष्यवाणी", included: true },
      { text: "AI Podcast (ElevenLabs)", textHi: "AI पॉडकास्ट (ElevenLabs)", included: true },
      { text: "Commodity price alerts", textHi: "कमोडिटी मूल्य अलर्ट", included: true },
      { text: "Early access to reports", textHi: "रिपोर्ट में पहली पहुंच", included: true },
    ],
  },
  {
    id: "annual",
    name: "ULTRA PRO",
    nameHi: "अल्ट्रा प्रो",
    price: 799,
    priceLabel: "₹799",
    period: "/year",
    periodHi: "/वर्ष",
    gradient: "from-yellow-500 via-amber-500 to-orange-600",
    popular: false,
    savings: "33% off",
    features: [
      { text: "Everything in Ultra", textHi: "अल्ट्रा की सभी सुविधाएं", included: true },
      { text: "API access for data", textHi: "डेटा API एक्सेस", included: true },
      { text: "Custom commodity alerts", textHi: "कस्टम कमोडिटी अलर्ट", included: true },
      { text: "Weekly PDF research brief", textHi: "साप्ताहिक PDF रिसर्च", included: true },
      { text: "Historical data (5 years)", textHi: "5 वर्ष ऐतिहासिक डेटा", included: true },
      { text: "AI Video News Digest", textHi: "AI वीडियो न्यूज़ डाइजेस्ट", included: true },
      { text: "Priority WhatsApp support", textHi: "प्राथमिकता WhatsApp सहायता", included: true },
      { text: "Founding member badge", textHi: "संस्थापक सदस्य बैज", included: true },
    ],
  },
];

const FEATURES = [
  { icon: Eye, title: "Zero Ads", titleHi: "शून्य विज्ञापन", desc: "Pristine, distraction-free reading across every article, page, and dashboard.", color: "#a855f7" },
  { icon: BarChart3, title: "West Asia Intelligence", titleHi: "पश्चिम एशिया इंटेलिजेंस", desc: "Full commodity datasets, raw data downloads, 5-year historical charts, and live alerts.", color: "#00fff5" },
  { icon: TrendingUp, title: "Market Predictions", titleHi: "बाज़ार भविष्यवाणी", desc: "AI-powered 30-day NIFTY/SENSEX predictions with bull/bear scenarios and confidence intervals.", color: "#39ff14" },
  { icon: Headphones, title: "AI Podcast", titleHi: "AI पॉडकास्ट", desc: "Professional news anchor reads every article. Powered by ElevenLabs — listen on your commute.", color: "#ff006e" },
  { icon: Sparkles, title: "Deep Analysis", titleHi: "गहन विश्लेषण", desc: "Opposition propaganda decoded with data. Government achievements with real PIB numbers.", color: "#facc15" },
  { icon: Database, title: "Raw Datasets", titleHi: "कच्चा डेटा", desc: "Download GDP, inflation, trade, commodity, and market data in CSV/JSON for your own research.", color: "#3b82f6" },
  { icon: Bell, title: "Price Alerts", titleHi: "मूल्य अलर्ट", desc: "Instant email/WhatsApp alerts when oil, gold, or silver hit critical price levels affecting India.", color: "#ef4444" },
  { icon: FileText, title: "Weekly PDF Brief", titleHi: "साप्ताहिक PDF", desc: "Curated 10-page research PDF delivered to your inbox every Sunday — print-ready.", color: "#f97316" },
  { icon: Radio, title: "Breaking Alerts", titleHi: "ब्रेकिंग अलर्ट", desc: "Push notifications for breaking news before it hits mainstream media. Be first to know.", color: "#06b6d4" },
];

const STATS = [
  { value: "50+", label: "Articles/Day", labelHi: "लेख/दिन" },
  { value: "24/7", label: "AI Uptime", labelHi: "AI अपटाइम" },
  { value: "10", label: "Sections", labelHi: "विभाग" },
  { value: "₹0", label: "Employee Cost", labelHi: "कर्मचारी लागत" },
];

export default function UltraPage() {
  const { isLoggedIn, userName } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
    })));
  }, []);

  async function handleSubscribe(planId: string, amount: number) {
    if (!isLoggedIn) {
      alert(t("Please sign in first", "पहले साइन इन करें"));
      return;
    }
    if (amount === 0) return;
    setLoading(planId);
    try {
      const res = await fetch("/api/premium/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount }),
      });
      const order = await res.json();
      if (!order.id) { alert("Failed to create order"); setLoading(null); return; }
      const options = {
        key: order.razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "LoktantraVani",
        description: `${planId === "monthly" ? "Ultra Monthly" : "Ultra Pro Annual"} Subscription`,
        image: "https://loktantravani.in/og-image.png",
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/premium/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, planId }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            alert(t("Welcome to Ultra! ⚡", "अल्ट्रा में स्वागत है! ⚡"));
            window.location.reload();
          }
        },
        prefill: { name: userName || "" },
        theme: { color: "#7c3aed" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch { alert("Something went wrong"); }
    setLoading(null);
  }

  return (
    <>
      <Navbar />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <main className="min-h-screen bg-[#030108] text-white overflow-hidden">
        {/* ─── Animated Particle Background ─── */}
        <div className="fixed inset-0 pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-purple-500/20"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4 + p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-600/10 blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[100px]" />
        </div>

        {/* ─── Hero ─── */}
        <div className="relative pt-[100px] md:pt-[170px] pb-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              {/* Ultra badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border border-purple-500/30"
                style={{ background: "rgba(168,85,247,0.1)", backdropFilter: "blur(12px)" }}
                animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.2)", "0 0 40px rgba(168,85,247,0.4)", "0 0 20px rgba(168,85,247,0.2)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black uppercase tracking-[4px] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  LOKTANTRAVANI ULTRA
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[0.95] mb-6 tracking-tight">
                <span className="text-white/90">{t("Intelligence.", "बुद्धिमत्ता।")}</span>
                <br />
                <span className={`bg-gradient-to-r ${ULTRA.gradient} bg-clip-text text-transparent`}>
                  {t("Amplified.", "प्रवर्धित।")}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                {t(
                  "India's most powerful AI news intelligence platform. Real-time data, market predictions, AI podcasts, opposition fact-checks, and zero ads. Built for patriots who think.",
                  "भारत का सबसे शक्तिशाली AI समाचार प्लेटफॉर्म। रियल-टाइम डेटा, बाज़ार भविष्यवाणी, AI पॉडकास्ट, विपक्ष फैक्ट-चेक। देशभक्तों के लिए बना।"
                )}
              </p>

              {/* Stats bar */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 mb-12">
                {STATS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center">
                    <p className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${ULTRA.gradient} bg-clip-text text-transparent`}>{s.value}</p>
                    <p className="text-[9px] uppercase tracking-[2px] text-white/30 mt-1">{t(s.label, s.labelHi)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Pricing Cards ─── */}
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`relative rounded-2xl p-[1px] ${plan.popular ? ULTRA.glow : ""}`}
                style={{ background: plan.popular ? `linear-gradient(135deg, #a855f7, #ec4899, #f97316)` : "rgba(255,255,255,0.06)" }}
              >
                <div className={`rounded-2xl p-6 sm:p-8 h-full ${plan.popular ? "bg-[#0a0515]" : "bg-[#0a0a10]"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`bg-gradient-to-r ${ULTRA.gradient} text-white text-[9px] font-black uppercase tracking-[3px] px-5 py-1.5 rounded-full`}>
                        {t("MOST POPULAR", "सबसे लोकप्रिय")}
                      </span>
                    </div>
                  )}
                  {plan.savings && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full">{plan.savings}</span>
                    </div>
                  )}

                  <div className="text-center mb-8 pt-2">
                    <h3 className={`text-sm font-black uppercase tracking-[4px] mb-4 bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                      {t(plan.name, plan.nameHi)}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-white">{plan.priceLabel}</span>
                      <span className="text-sm text-white/30">{t(plan.period, plan.periodHi)}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {f.included ? (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Lock className="w-5 h-5 text-white/15 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${f.included ? "text-white/80" : "text-white/25"}`}>
                          {t(f.text, f.textHi)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id, plan.price)}
                    disabled={plan.price === 0 || loading === plan.id}
                    className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
                      plan.popular
                        ? `bg-gradient-to-r ${ULTRA.gradient} text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]`
                        : plan.price === 0
                        ? "bg-white/5 text-white/30 cursor-default"
                        : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02]"
                    }`}
                  >
                    {loading === plan.id
                      ? "..."
                      : plan.price === 0
                      ? t("Current Plan", "वर्तमान प्लान")
                      : `⚡ ${t("Go Ultra", "अल्ट्रा लें")}`}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── Features Grid ─── */}
        <div className="relative py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${ULTRA.gradient} bg-clip-text text-transparent mb-3`}>
                {t("What Ultra Unlocks", "अल्ट्रा से क्या मिलेगा")}
              </h2>
              <p className="text-sm text-white/40">{t("Every feature built for data-driven patriots", "डेटा-संचालित देशभक्तों के लिए")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-xl p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{t(item.title, item.titleHi)}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Zero Employee Banner ─── */}
        <div className="relative py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <Cpu className="w-12 h-12 mx-auto mb-6 text-purple-400/50" />
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                {t("Zero Employees. Pure AI. Your Rupee Goes Further.", "शून्य कर्मचारी। शुद्ध AI। आपका रुपया आगे जाता है।")}
              </h2>
              <p className="text-sm text-white/30 leading-relaxed mb-8 max-w-xl mx-auto">
                {t(
                  "LoktantraVani is India's first fully AI-operated newspaper. No salaries, no office, no overhead. 100% of your subscription funds AI infrastructure, real-time data feeds, and platform improvement.",
                  "लोकतंत्रवाणी भारत का पहला पूर्ण AI-संचालित अखबार है। सदस्यता का 100% AI इन्फ्रास्ट्रक्चर और डेटा फीड में जाता है।"
                )}
              </p>
              <div className="inline-flex items-center gap-3 text-xs text-white/20">
                <Shield className="w-3.5 h-3.5" /> {t("Razorpay Secured", "Razorpay सुरक्षित")}
                <span className="text-white/10">|</span>
                <Zap className="w-3.5 h-3.5" /> {t("Instant Access", "तुरंत पहुंच")}
                <span className="text-white/10">|</span>
                <Star className="w-3.5 h-3.5" /> {t("Cancel Anytime", "कभी भी रद्द करें")}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
