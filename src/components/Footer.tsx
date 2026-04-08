"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const footerLinks = [
  { en: "Bharat Pulse", hi: "भारत पल्स", href: "/category/India" },
  { en: "Neta Watch", hi: "नेता वॉच", href: "/category/Politics" },
  { en: "Power Moves", hi: "पावर मूव्स", href: "/category/Geopolitics" },
  { en: "Paisa Talk", hi: "पैसा टॉक", href: "/category/Economy" },
  { en: "Game On", hi: "गेम ऑन", href: "/category/Sports" },
  { en: "Tech Bro", hi: "टेक ब्रो", href: "/category/Tech" },
  { en: "Shield & Sword", hi: "शील्ड & स्वॉर्ड", href: "/category/Defence" },
  { en: "Hot Takes", hi: "हॉट टेक्स", href: "/category/Opinion" },
  { en: "City Vibes", hi: "सिटी वाइब्स", href: "/category/Cities" },
  { en: "Lok Post", hi: "कार्टून मंडला", href: "/lok-post" },
  { en: "Daily Edition", hi: "दैनिक संस्करण", href: "/daily" },
  { en: "About", hi: "हमारे बारे में", href: "/about" },
  { en: "Privacy", hi: "गोपनीयता", href: "/privacy" },
  { en: "Terms", hi: "शर्तें", href: "/terms" },
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
    <footer className="mt-16 border-t-4 border-black dark:border-white/20 pt-10 pb-8 px-6 md:px-12 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        {/* Newsletter — compact */}
        <div className="mb-10 p-6 border-2 border-black dark:border-white/20 bg-[#fafafa] dark:bg-white/5">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-newsreader font-black uppercase dark:text-white">
                {t("Subscribe to the Vani", "वाणी की सदस्यता लें")}
              </h3>
              <p className="text-[11px] font-inter opacity-50 dark:text-white/50">
                {t("Daily digest. Zero spam.", "दैनिक संग्रह। शून्य स्पैम।")}
              </p>
            </div>
            {subscribed ? (
              <div className="text-primary font-inter font-bold text-xs uppercase tracking-widest">
                {t("Subscribed ✓", "सदस्यता ✓")}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("your@email.com", "आपका@ईमेल.com")}
                  className="px-4 py-2.5 border-2 border-black dark:border-white/30 border-r-0 font-inter text-xs flex-1 md:w-56 bg-transparent dark:text-white placeholder:opacity-40"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  {t("Subscribe", "सदस्यता")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Brand + Links */}
        <div className="flex flex-col items-center text-center space-y-8">
          <Link href="/">
            <h2 className="text-xl md:text-2xl font-newsreader font-black tracking-tighter text-black dark:text-white uppercase">
              Loktantra<span className="text-primary">Vani</span>
            </h2>
            <p className="text-[8px] font-inter font-bold uppercase tracking-[0.3em] text-[var(--nyt-gray)] dark:text-white/30 mt-0.5">
              India&apos;s 1st AI Newspaper
            </p>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-inter font-bold tracking-[0.2em] uppercase opacity-40 dark:text-white/40">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary hover:opacity-100 transition-all">
                {lang === "hi" ? link.hi : link.en}
              </Link>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex gap-2.5">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 border border-black/20 dark:border-white/20 flex items-center justify-center font-inter font-bold text-[10px] hover:bg-primary hover:text-white hover:border-primary transition-all dark:text-white/60"
                title={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>

          <div className="w-full h-px bg-black/10 dark:bg-white/10" />

          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-[9px] font-inter font-bold opacity-25 tracking-[0.15em] uppercase dark:text-white/25">
            <p>&copy; 2026 LoktantraVani by <a href="https://kautilya.world" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 underline">Kautilya World</a></p>
            <div className="flex gap-6">
              <a href="https://kautilya.world" target="_blank" rel="noopener noreferrer" className="hover:opacity-60">Kautilya World</a>
              <a href="/about" className="hover:opacity-60">Ethics</a>
              <a href="/privacy" className="hover:opacity-60">Privacy</a>
              <a href="/terms" className="hover:opacity-60">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
