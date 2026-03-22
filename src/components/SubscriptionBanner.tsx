"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Star, Zap, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const PLANS = [
  {
    id: "free",
    name: { en: "Free Reader", hi: "मुफ़्त पाठक" },
    price: "₹0",
    period: { en: "/forever", hi: "/हमेशा" },
    features: {
      en: ["5 articles/day", "Basic search", "Comments", "Bookmarks"],
      hi: ["5 लेख/दिन", "बुनियादी खोज", "टिप्पणियाँ", "बुकमार्क"],
    },
    current: true,
  },
  {
    id: "premium",
    name: { en: "Vani Premium", hi: "वाणी प्रीमियम" },
    price: "₹199",
    period: { en: "/month", hi: "/माह" },
    features: {
      en: ["Unlimited articles", "Ad-free reading", "Daily edition PDF", "Author Q&A access", "Regional editions"],
      hi: ["असीमित लेख", "विज्ञापन-मुक्त पढ़ना", "दैनिक संस्करण PDF", "लेखक Q&A एक्सेस", "क्षेत्रीय संस्करण"],
    },
    popular: true,
  },
  {
    id: "annual",
    name: { en: "Vani Annual", hi: "वाणी वार्षिक" },
    price: "₹1,499",
    period: { en: "/year", hi: "/वर्ष" },
    features: {
      en: ["Everything in Premium", "Exclusive cartoons", "Print edition delivery", "Discord VIP access", "Early article access"],
      hi: ["प्रीमियम की सब सुविधाएं", "विशेष कार्टून", "प्रिंट संस्करण डिलीवरी", "Discord VIP एक्सेस", "लेखों की जल्दी एक्सेस"],
    },
    savings: "Save 37%",
  },
];

export default function SubscriptionBanner() {
  const { lang, t } = useLanguage();
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <>
      {/* Floating CTA */}
      <button
        onClick={() => setShowPlans(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 bg-primary text-white font-inter font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform no-print"
      >
        <Crown className="w-4 h-4" />
        {t("Go Premium", "प्रीमियम लें")}
      </button>

      {/* Plans Modal */}
      <AnimatePresence>
        {showPlans && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPlans(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0a0a0a] max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-black dark:border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-8 border-b-4 border-black dark:border-white/20">
                <div>
                  <h2 className="text-3xl font-newsreader font-black uppercase dark:text-white">
                    {t("Subscribe to LoktantraVani", "लोकतंत्रवाणी की सदस्यता लें")}
                  </h2>
                  <p className="text-sm font-inter opacity-60 mt-1 dark:text-white/60">
                    {t(
                      "Support independent Neo Bharat journalism",
                      "स्वतंत्र नव भारत पत्रकारिता का समर्थन करें"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowPlans(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-6 h-6 dark:text-white" />
                </button>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 p-6 relative transition-all cursor-pointer ${
                      selectedPlan === plan.id
                        ? "border-primary shadow-[6px_6px_0px_0px_#FF9933]"
                        : plan.popular
                        ? "border-primary"
                        : "border-black/10 dark:border-white/10"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-4 bg-primary text-white px-3 py-1 text-[9px] font-inter font-black uppercase tracking-widest flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t("Most Popular", "सबसे लोकप्रिय")}
                      </div>
                    )}
                    {plan.savings && (
                      <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 text-[9px] font-inter font-black uppercase tracking-widest">
                        {plan.savings}
                      </div>
                    )}
                    <h3 className="text-lg font-newsreader font-black uppercase mt-2 dark:text-white">
                      {lang === "hi" ? plan.name.hi : plan.name.en}
                    </h3>
                    <div className="mt-4 mb-6">
                      <span className="text-4xl font-newsreader font-black text-primary">{plan.price}</span>
                      <span className="text-sm font-inter opacity-40 dark:text-white/40">
                        {lang === "hi" ? plan.period.hi : plan.period.en}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {(lang === "hi" ? plan.features.hi : plan.features.en).map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm font-inter dark:text-white/80">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full mt-6 py-3 font-inter font-black text-xs uppercase tracking-widest transition-all ${
                        plan.current
                          ? "border-2 border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 cursor-default"
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-primary"
                      }`}
                    >
                      {plan.current ? t("Current Plan", "वर्तमान योजना") : t("Subscribe", "सदस्यता लें")}
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-8 pb-8 text-center">
                <p className="text-[10px] font-inter opacity-40 dark:text-white/40">
                  {t(
                    "Secure payment via Razorpay. Cancel anytime. 7-day free trial for premium plans.",
                    "Razorpay के माध्यम से सुरक्षित भुगतान। कभी भी रद्द करें। प्रीमियम योजनाओं के लिए 7-दिन का मुफ़्त ट्रायल।"
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
