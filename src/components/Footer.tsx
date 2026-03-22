"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const footerLinks = [
  { en: "Geopolitics", hi: "भू-राजनीति", href: "/category/Geopolitics" },
  { en: "International Relations", hi: "अंतर्राष्ट्रीय संबंध", href: "/category/IR" },
  { en: "Mental Models", hi: "मानसिक मॉडल", href: "/category/GenZ" },
  { en: "Ancient Wisdom", hi: "प्राचीन ज्ञान", href: "/category/Ancient India" },
  { en: "Cartoon Mandala", hi: "कार्टून मंडला", href: "/cartoon-mandala" },
  { en: "Daily Edition", hi: "दैनिक संस्करण", href: "/daily" },
  { en: "About", hi: "हमारे बारे में", href: "/about" },
];

const socialLinks = [
  { label: "X / Twitter", href: "https://twitter.com/loktantravani", icon: "𝕏" },
  { label: "Discord", href: "https://discord.gg/loktantravani", icon: "🎮" },
  { label: "WhatsApp", href: "https://whatsapp.com/channel/loktantravani", icon: "💬" },
  { label: "LinkedIn", href: "https://linkedin.com/company/loktantravani", icon: "in" },
  { label: "Facebook", href: "https://facebook.com/loktantravani", icon: "f" },
];

export default function Footer() {
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="mt-24 border-t-[20px] border-black dark:border-white pt-24 pb-12 px-8 md:px-16 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        {/* Newsletter */}
        <div className="mb-20 p-12 border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)]">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-newsreader font-black uppercase mb-2 dark:text-white">
                {t("Subscribe to the Vani", "वाणी की सदस्यता लें")}
              </h3>
              <p className="text-sm font-inter opacity-60 dark:text-white/60">
                {t(
                  "Daily editorial digest. Neo Bharat perspective. Zero spam.",
                  "दैनिक संपादकीय संग्रह। नव भारत परिप्रेक्ष्य। शून्य स्पैम।"
                )}
              </p>
            </div>
            {subscribed ? (
              <div className="text-primary font-inter font-black text-sm uppercase tracking-widest">
                {t("Welcome to the discourse!", "विमर्श में स्वागत है!")}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("your@email.com", "आपका@ईमेल.com")}
                  className="px-6 py-4 border-2 border-black dark:border-white border-r-0 font-inter text-sm flex-1 md:w-72 bg-transparent dark:text-white placeholder:opacity-40"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t("Subscribe", "सदस्यता")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Brand + Links */}
        <div className="flex flex-col items-center text-center space-y-12">
          <Link href="/">
            <h2 className="text-6xl md:text-9xl font-newsreader font-black tracking-tighter text-black dark:text-white uppercase">
              Loktantra<span className="text-primary">Vani</span>
            </h2>
          </Link>

          <div className="flex flex-wrap justify-center gap-12 text-xs font-inter font-black tracking-[0.3em] uppercase opacity-40 dark:text-white/40">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary hover:opacity-100 transition-all">
                {lang === "hi" ? link.hi : link.en}
              </Link>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 border-2 border-black dark:border-white flex items-center justify-center font-inter font-black text-sm hover:bg-primary hover:text-white hover:border-primary transition-all dark:text-white"
                title={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Discord CTA */}
          <a
            href="https://discord.gg/loktantravani"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#5865F2] text-white font-inter font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-5 h-5" />
            {t("Join our Discord Community", "हमारे Discord समुदाय से जुड़ें")}
          </a>

          <div className="w-full h-px bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-8 text-[10px] font-inter font-black opacity-30 tracking-[0.2em] uppercase dark:text-white/30">
            <p>&copy; 2026 LOKTANTRAVANI MEDIA GROUP &bull; THE NEO BHARAT VOICE.</p>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-black dark:bg-white rounded-full" />
              <span>VERIFIED AUTHORITATIVE SOURCE</span>
              <div className="w-1 h-1 bg-black dark:bg-white rounded-full" />
            </div>
            <div className="flex gap-8">
              <a href="#">NEO BHARAT ETHICS</a>
              <a href="#">DATA SOVEREIGNTY</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
