"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Sun, Moon, Bookmark, PenSquare, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
// UserRole used internally by auth context
import { useTheme } from "next-themes";
import NotificationBell from "./NotificationBell";

const AuthModal = lazy(() => import("./AuthModal"));

// NYT-style sections (Indian edition — GenZ wording)
const SECTIONS = {
  en: [
    { label: "Bharat Pulse",     href: "/category/India" },
    { label: "Globe Drop",       href: "/category/World" },
    { label: "Neta Watch",       href: "/category/Politics" },
    { label: "Power Moves",      href: "/category/Geopolitics" },
    { label: "Paisa Talk",       href: "/category/Economy" },
    { label: "Game On",          href: "/category/Sports" },
    { label: "Tech Bro",         href: "/category/Tech" },
    { label: "Shield & Sword",   href: "/category/Defence" },
    { label: "Hot Takes",        href: "/category/Opinion" },
    { label: "City Vibes",       href: "/category/Cities" },
    { label: "West Asia ⚡",     href: "/west-asia", special: true },
  ],
  hi: [
    { label: "भारत पल्स",       href: "/category/India" },
    { label: "ग्लोब ड्रॉप",     href: "/category/World" },
    { label: "नेता वॉच",        href: "/category/Politics" },
    { label: "पावर मूव्स",      href: "/category/Geopolitics" },
    { label: "पैसा टॉक",        href: "/category/Economy" },
    { label: "गेम ऑन",          href: "/category/Sports" },
    { label: "टेक ब्रो",        href: "/category/Tech" },
    { label: "शील्ड & स्वॉर्ड",  href: "/category/Defence" },
    { label: "हॉट टेक्स",       href: "/category/Opinion" },
    { label: "सिटी वाइब्स",     href: "/category/Cities" },
    { label: "पश्चिम एशिया ⚡",  href: "/west-asia", special: true },
  ],
};

function formatNavDate(lang: string): { main: string; sub?: string } {
  const d = new Date();
  if (lang === "hi") {
    return {
      main: d.toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  }
  return {
    main: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase(),
  };
}

export default function Navbar() {
  const { lang, toggleLang, t, isHindiDomain } = useLanguage();
  const { userRole, isLoggedIn, userName, userEmail, userPhotoUrl, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sections = SECTIONS[lang];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "frosted-nav shadow-lg shadow-black/[0.03] dark:shadow-black/20" : "bg-white dark:bg-[#0d0d0d]"
    )}>

      {/* ── Row 1: Thin utility bar ───────────────────────────────── */}
      <div className="border-b border-[var(--nyt-border)] dark:border-[var(--nyt-border)] px-4 md:px-8 h-8 flex items-center">
        {/* Left: date — truncates on mobile to avoid overlap */}
        <span className="font-inter text-[var(--nyt-gray)] flex items-baseline gap-1 sm:gap-2 tracking-wide min-w-0 flex-1">
          <span className="text-[9px] sm:text-[11px] font-bold text-[var(--nyt-black)] dark:text-white truncate max-w-[180px] sm:max-w-none">
            {formatNavDate(lang).main}
          </span>
        </span>

        {/* Center: Live tag */}
        <div className="hidden sm:flex items-center gap-1.5 mx-4 shrink-0">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-inter font-bold uppercase tracking-widest text-red-500">
            {t("Live Updates", "लाइव अपडेट")}
          </span>
        </div>

        {/* Right: utilities */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <button
            onClick={toggleLang}
            className="text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hover:text-primary transition-colors"
          >
            {lang === "en" ? "हिन्दी" : "EN"}
          </button>
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-[var(--nyt-gray)] dark:text-white/60 hover:text-primary transition-colors">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}
          {isLoggedIn ? (
            <button onClick={signOut} className="hidden sm:flex text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hover:text-red-500 transition-colors items-center gap-1">
              <LogOut className="w-3 h-3" /> {t("Sign out", "साइन आउट")}
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="hidden sm:flex text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hover:text-primary transition-colors items-center gap-1">
              <LogIn className="w-3 h-3" /> {t("Sign In", "साइन इन")}
            </button>
          )}
          <Link href="/write" className="hidden md:block text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
            ✍️ {t("Write With Us", "हमारे साथ लिखें")}
          </Link>
          <Link href="/premium" className="hidden md:block bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white text-[9px] font-inter font-black uppercase tracking-widest px-4 py-1.5 rounded-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all">
            ⚡ {t("GO ULTRA", "अल्ट्रा")}
          </Link>
        </div>
      </div>

      {/* ── Row 2: Masthead ───────────────────────────────────────── */}
      <div className="border-b border-[var(--nyt-border)] dark:border-[var(--nyt-border)] px-4 md:px-8 py-2 md:py-1 relative flex items-center min-h-[44px] md:min-h-0">
        {/* Left: search + notifications + bookmarks */}
        <div className="flex-1 hidden md:flex items-center gap-5">
          <Link href="/search" className="text-[var(--nyt-gray)] dark:text-white/60 hover:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </Link>
          <NotificationBell />
          <Link href="/bookmarks" className="text-[var(--nyt-gray)] dark:text-white/60 hover:text-primary transition-colors">
            <Bookmark className="w-4 h-4" />
          </Link>
          {userRole === "admin" && (
            <Link href="/admin" className="flex items-center gap-1 text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          {userRole === "author" && (
            <Link href="/author/dashboard" className="flex items-center gap-1 text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
              <PenSquare className="w-3.5 h-3.5" /> Write
            </Link>
          )}
        </div>

        {/* Center: Logo — absolutely centered on all screens */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          {isHindiDomain || lang === "hi" ? (
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[var(--nyt-black)] dark:text-white select-none leading-none whitespace-nowrap hindi">
              लोकतंत्र<span className="text-primary">वाणी</span>
            </h1>
          ) : (
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-newsreader font-black tracking-tight text-[var(--nyt-black)] dark:text-white select-none leading-none whitespace-nowrap">
              Loktantra<span className="text-primary">Vani</span>
            </h1>
          )}
        </Link>

        {/* Right: account */}
        <div className="flex-1 hidden md:flex items-center justify-end gap-4">
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowAccount(!showAccount)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {userPhotoUrl ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--nyt-border)]">
                    <Image src={userPhotoUrl} alt={userName} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center font-inter font-bold text-xs">
                    {userName[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] font-inter text-[var(--nyt-gray)] dark:text-white/50">{userName.split(" ")[0]}</span>
                <span className="text-[8px] text-[var(--nyt-gray)]">▾</span>
              </button>
              <AnimatePresence>
                {showAccount && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-[var(--nyt-border)] shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-[var(--nyt-border)]">
                      <p className="text-[11px] font-inter font-bold dark:text-white truncate">{userName}</p>
                      <p className="text-[9px] font-inter text-[var(--nyt-gray)] dark:text-white/40 truncate">{userEmail}</p>
                      {(userRole === "admin" || userRole === "author") && (
                        <span className="inline-block mt-1.5 text-[8px] font-inter font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5">
                          {userRole}
                        </span>
                      )}
                    </div>
                    {userRole === "admin" && (
                      <Link href="/admin" onClick={() => setShowAccount(false)} className="block px-4 py-2.5 text-[10px] font-inter font-bold hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5 dark:text-white transition-colors">
                        Admin Panel
                      </Link>
                    )}
                    {(userRole === "admin" || userRole === "author") && (
                      <Link href="/author/dashboard" onClick={() => setShowAccount(false)} className="block px-4 py-2.5 text-[10px] font-inter font-bold hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5 dark:text-white transition-colors">
                        My Dashboard
                      </Link>
                    )}
                    <Link href="/bookmarks" onClick={() => setShowAccount(false)} className="block px-4 py-2.5 text-[10px] font-inter font-bold hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5 dark:text-white transition-colors">
                      Saved Articles
                    </Link>
                    <button
                      onClick={() => { signOut(); setShowAccount(false); }}
                      className="w-full text-left px-4 py-2.5 text-[10px] font-inter font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border-t border-[var(--nyt-border)] flex items-center gap-2"
                    >
                      <LogOut className="w-3 h-3" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] dark:text-white/50 hover:text-primary transition-colors"
            >
              {t("Account", "खाता")}
            </button>
          )}
        </div>

        {/* Mobile: hamburger — pushed to right edge */}
        <button className="md:hidden ml-auto z-10" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5 dark:text-white" /> : <Menu className="w-5 h-5 dark:text-white" />}
        </button>
      </div>

      {/* ── Row 3: Section nav ─────────────────────────────────────── */}
      <div className="border-b-2 border-[var(--nyt-black)] dark:border-white/80 hidden md:block bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-sm">
        <div className="px-4 md:px-8 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center">
            {sections.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={cn(
                  "text-[9px] font-inter font-bold uppercase tracking-wider px-2.5 py-1.5 whitespace-nowrap transition-colors hover:text-primary relative group",
                  "special" in s && s.special ? "text-red-600 dark:text-red-400" : "text-[var(--nyt-black)] dark:text-white/90"
                )}
              >
                {s.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" />
              </Link>
            ))}
            <Link
              href="/epaper"
              className="text-[9px] font-inter font-bold uppercase tracking-wider px-2.5 py-1.5 whitespace-nowrap text-[var(--nyt-black)] dark:text-white/90 hover:text-primary transition-colors relative group"
            >
              {t("Today's Paper", "आज का अखबार")}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all" />
            </Link>
          </div>
          <Link
            href="/opposition-tracker"
            className="text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-black)] dark:text-white/90 border-l border-[var(--nyt-border)] pl-3 py-1.5 whitespace-nowrap hover:text-primary transition-colors"
          >
            {t("Fact Check", "फैक्ट चेक")}
          </Link>
        </div>
      </div>

      {/* ── Mobile menu — premium slide-in drawer ─────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] z-50 md:hidden bg-white dark:bg-[#0d0d0d] overflow-y-auto shadow-2xl"
            >
              {/* Drawer header */}
              <div className="sticky top-0 bg-white dark:bg-[#0d0d0d] border-b border-[var(--nyt-border)] px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-newsreader font-black text-lg tracking-tight dark:text-white">
                    Loktantra<span className="text-primary">Vani</span>
                  </p>
                  <p className="text-[8px] font-inter font-bold uppercase tracking-[0.2em] text-[var(--nyt-gray)]">
                    {t("India's 1st AI Newspaper", "भारत का प्रथम AI अखबार")}
                  </p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 dark:text-white" />
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 px-5 py-3 border-b border-[var(--nyt-border)]">
                <Link href="/search" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] font-inter font-bold uppercase tracking-wider dark:text-white">
                  <Search className="w-3.5 h-3.5" /> {t("Search", "खोजें")}
                </Link>
                <Link href="/bookmarks" onClick={() => setMobileOpen(false)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] font-inter font-bold uppercase tracking-wider dark:text-white">
                  <Bookmark className="w-3.5 h-3.5" /> {t("Saved", "सेव्ड")}
                </Link>
              </div>

              {/* Sections */}
              <div className="px-5 py-3">
                <p className="text-[9px] font-inter font-bold uppercase tracking-[0.2em] text-[var(--nyt-gray)] mb-2">{t("Sections", "सेक्शन")}</p>
                {sections.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 active:bg-gray-50 dark:active:bg-white/5 transition-colors",
                      "special" in s && s.special ? "text-red-500" : "text-[var(--nyt-black)] dark:text-white"
                    )}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              {/* Special sections */}
              <div className="px-5 py-3 border-t border-[var(--nyt-border)]">
                <p className="text-[9px] font-inter font-bold uppercase tracking-[0.2em] text-[var(--nyt-gray)] mb-2">{t("Special", "विशेष")}</p>
                <Link href="/opposition-tracker" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-red-500">
                  🎯 {t("Fact Check", "फैक्ट चेक")}
                </Link>
                <Link href="/modi-scorecard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-[#FF9933]">
                  📊 {t("Govt Report Card", "सरकार रिपोर्ट कार्ड")}
                </Link>
                <Link href="/talking-points" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-orange-500">
                  🔥 {t("Daily Brief", "डेली ब्रीफ")}
                </Link>
                <Link href="/lok-post" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-primary">
                  {t("Lok Post", "कार्टून मंडला")}
                </Link>
                <Link href="/daily" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-primary">
                  {t("Today's Paper", "आज का अखबार")}
                </Link>
                <Link href="/epaper" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-primary">
                  {t("E-Paper", "ई-पेपर")}
                </Link>
                <Link href="/write" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[13px] font-inter font-bold uppercase tracking-wider py-3 border-b border-[var(--nyt-border)]/50 text-primary">
                  ✍️ {t("Write With Us", "हमारे साथ लिखें")}
                </Link>
              </div>

              {/* Bottom actions */}
              <div className="px-5 py-4 border-t border-[var(--nyt-border)] space-y-3">
                <div className="flex gap-3">
                  <button onClick={() => { toggleLang(); setMobileOpen(false); }} className="flex-1 py-2.5 text-[10px] font-inter font-bold uppercase tracking-wider border-2 border-[var(--nyt-border)] rounded-lg dark:text-white text-center">
                    {lang === "en" ? "हिन्दी" : "English"}
                  </button>
                  {isLoggedIn ? (
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex-1 py-2.5 text-[10px] font-inter font-bold uppercase tracking-wider text-red-500 border-2 border-red-200 rounded-lg flex items-center justify-center gap-1">
                      <LogOut className="w-3 h-3" /> Sign out
                    </button>
                  ) : (
                    <button onClick={() => { setShowAuthModal(true); setMobileOpen(false); }} className="flex-1 py-2.5 text-[10px] font-inter font-bold uppercase tracking-wider bg-primary text-white rounded-lg flex items-center justify-center gap-1">
                      <LogIn className="w-3 h-3" /> Sign In
                    </button>
                  )}
                </div>
                <Link href="/premium" onClick={() => setMobileOpen(false)} className="block w-full py-3 text-center text-[10px] font-inter font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg">
                  ⚡ {t("GO ULTRA", "अल्ट्रा")}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal — lazy loaded */}
      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </Suspense>
      )}
    </nav>
  );
}
