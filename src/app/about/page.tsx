"use client";

import { motion } from "framer-motion";
import { Globe, Zap, Sparkles, History, Shield, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsletterSignup from "@/components/NewsletterSignup";
import { useLanguage } from "@/lib/language-context";

const TEAM = [
  { name: "Aditya Vani", role: "Chief Editor", roleHi: "प्रधान संपादक", focus: "Geopolitics & Strategy" },
  { name: "Meera Iyer", role: "Foreign Affairs Editor", roleHi: "विदेश मामलों की संपादक", focus: "International Relations" },
  { name: "Arjun Kapil", role: "Tech & Ancient Wisdom", roleHi: "तकनीक और प्राचीन ज्ञान", focus: "Technology & Vedic Sciences" },
  { name: "Nandini Rao", role: "Politics Editor", roleHi: "राजनीति संपादक", focus: "Democracy & Governance" },
  { name: "Priya Sharma", role: "GenZ Correspondent", roleHi: "जेनज़ी संवाददाता", focus: "Youth, Web3 & Ethics" },
];

export default function AboutPage() {
  const { lang, t } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-newsreader font-black uppercase tracking-tighter mb-6 dark:text-white">
              {t("About", "हमारे बारे में")}
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto mb-8" />
            <p className="text-2xl font-newsreader italic opacity-60 max-w-2xl mx-auto dark:text-white/60">
              {t(
                "LoktantraVani is the Neo Bharat editorial voice — where ancient civilizational wisdom meets modern geopolitical analysis, and satirical cartoons cut deeper than a thousand opinion pieces.",
                "लोकतंत्रवाणी नव भारत की संपादकीय आवाज है — जहाँ प्राचीन सभ्यतागत ज्ञान आधुनिक भू-राजनीतिक विश्लेषण से मिलता है।"
              )}
            </p>
          </motion.div>

          {/* Manifesto */}
          <div className="border-4 border-black dark:border-white/20 p-12 mb-20 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
            <h2 className="text-3xl font-newsreader font-black uppercase mb-8 dark:text-white">
              {t("The Manifesto", "घोषणापत्र")}
            </h2>
            <div className="space-y-6 text-lg font-newsreader leading-relaxed dark:text-white/80">
              <p>{t(
                "We believe that India's democratic discourse deserves a platform that honors its civilizational depth while engaging with the urgency of the present moment.",
                "हम मानते हैं कि भारत के लोकतांत्रिक विमर्श को एक ऐसे मंच की आवश्यकता है जो इसकी सभ्यतागत गहराई का सम्मान करे।"
              )}</p>
              <p>{t(
                "We are not left. We are not right. We are forward — drawing from 5,000 years of political philosophy to illuminate today's challenges.",
                "हम वामपंथी नहीं हैं। हम दक्षिणपंथी नहीं हैं। हम आगे हैं — आज की चुनौतियों को रोशन करने के लिए 5,000 वर्षों के राजनीतिक दर्शन से प्रेरणा लेते हुए।"
              )}</p>
              <p>{t(
                "Our cartoons are our conscience. Our analysis is our dharma. Our discourse is our democratic duty.",
                "हमारे कार्टून हमारी अंतरात्मा हैं। हमारा विश्लेषण हमारा धर्म है। हमारा विमर्श हमारा लोकतांत्रिक कर्तव्य है।"
              )}</p>
            </div>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Globe, en: "Geopolitical Depth", hi: "भू-राजनीतिक गहराई", descEn: "Analysis rooted in India's strategic autonomy and civilizational perspective on global affairs.", descHi: "भारत की रणनीतिक स्वायत्तता और वैश्विक मामलों पर सभ्यतागत दृष्टिकोण में निहित विश्लेषण।" },
              { icon: Sparkles, en: "Satirical Courage", hi: "व्यंग्यात्मक साहस", descEn: "Cartoons that challenge power with humor. The Lok Post tradition of democratic dissent.", descHi: "कार्टून जो हास्य से सत्ता को चुनौती देते हैं। लोकतांत्रिक असहमति की कार्टून मंडला परंपरा।" },
              { icon: Zap, en: "GenZ Bridge", hi: "जेनज़ी सेतु", descEn: "Bridging ancient dharma with digital disruption. Content for the generation rewriting the rules.", descHi: "प्राचीन धर्म को डिजिटल व्यवधान से जोड़ना। नियमों को फिर से लिखने वाली पीढ़ी के लिए सामग्री।" },
            ].map((pillar) => (
              <div key={pillar.en} className="border-t-4 border-primary pt-6 space-y-4">
                <pillar.icon className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-newsreader font-black uppercase dark:text-white">
                  {lang === "hi" ? pillar.hi : pillar.en}
                </h3>
                <p className="text-sm font-inter opacity-60 dark:text-white/60">
                  {lang === "hi" ? pillar.descHi : pillar.descEn}
                </p>
              </div>
            ))}
          </div>

          {/* Team */}
          <div className="mb-20">
            <h2 className="text-3xl font-newsreader font-black uppercase mb-12 text-center dark:text-white">
              {t("The Editorial Board", "संपादकीय मंडल")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TEAM.map((member) => (
                <div key={member.name} className="border-2 border-black dark:border-white/20 p-6 group hover:shadow-[8px_8px_0px_0px_#FF9933] transition-all">
                  <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-newsreader font-black text-2xl mb-4 group-hover:bg-primary transition-colors">
                    {member.name[0]}
                  </div>
                  <h4 className="text-lg font-newsreader font-black dark:text-white">{member.name}</h4>
                  <p className="text-xs font-inter font-black uppercase tracking-widest text-primary mt-1">
                    {lang === "hi" ? member.roleHi : member.role}
                  </p>
                  <p className="text-sm font-inter opacity-60 mt-3 dark:text-white/60">{member.focus}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="max-w-md mx-auto">
            <NewsletterSignup />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
