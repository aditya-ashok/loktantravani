"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Menu,
  X,
  Bell,
  Zap,
  History,
  Sun,
  Moon,
  Bookmark,
  PenSquare,
  LayoutDashboard,
  LogIn,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { useTheme } from "next-themes";
import NotificationBell from "./NotificationBell";

const topNavItems = {
  en: [
    { label: "Live TV", href: "#" },
    { label: "Latest News", href: "/blog" },
    { label: "Elections 2026", href: "/category/Politics" },
    { label: "Loktantra Hub", href: "/daily" },
  ],
  hi: [
    { label: "लाइव टीवी", href: "#" },
    { label: "ताज़ा ख़बर", href: "/blog" },
    { label: "चुनाव 2026", href: "/category/Politics" },
    { label: "लोकतंत्र हब", href: "/daily" },
  ],
};

const mainNavItems = {
  en: [
    { label: "IR", href: "/category/IR", icon: null },
    { label: "Politics", href: "/category/Politics", icon: null },
    { label: "Tech", href: "/category/Tech", icon: null },
    { label: "Geopolitics", href: "/category/Geopolitics", icon: null },
    { label: "GenZ", href: "/category/GenZ", icon: Zap },
    { label: "Ancient India", href: "/category/Ancient India", icon: History },
  ],
  hi: [
    { label: "अंतर्राष्ट्रीय", href: "/category/IR", icon: null },
    { label: "राजनीति", href: "/category/Politics", icon: null },
    { label: "टेक", href: "/category/Tech", icon: null },
    { label: "भू-राजनीति", href: "/category/Geopolitics", icon: null },
    { label: "जेन-ज़ी", href: "/category/GenZ", icon: Zap },
    { label: "प्राचीन भारत", href: "/category/Ancient India", icon: History },
  ],
};

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const { userRole, setUserRole, isLoggedIn, userName, userPhotoUrl, signInWithGoogle, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a]">
      {/* Top Banner */}
      <div className="bg-[#1a1c1c] text-white py-1.5 px-8 md:px-16 flex justify-between items-center text-[10px] uppercase font-inter font-black tracking-widest border-b border-white/5">
        <div className="flex gap-6 items-center">
          {topNavItems[lang].map((item) => (
            <Link key={item.label} href={item.href} className="hover:text-primary transition-colors hidden sm:block">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <span className="text-primary flex items-center gap-2 font-black">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            LIVE STREAM
          </span>
          <div className="h-3 w-px bg-white/20 mx-2 hidden sm:block" />
          <span className="opacity-60 hidden sm:block">MARCH 21, 2026</span>
        </div>
      </div>

      {/* Main Brand Area */}
      <div className="border-b border-black dark:border-white/20 py-8 px-8 md:px-16 flex items-center justify-between relative">
        <div className="flex-1 hidden md:flex items-center gap-8">
          <Link href="/search">
            <Search className="w-5 h-5 text-black dark:text-white cursor-pointer hover:text-primary transition-colors" />
          </Link>
          <NotificationBell />
          <Link href="/bookmarks">
            <Bookmark className="w-5 h-5 text-black dark:text-white cursor-pointer hover:text-primary transition-colors" />
          </Link>
        </div>

        <Link href="/" className="flex flex-col items-center">
          <h1 className="text-4xl md:text-7xl font-newsreader font-black tracking-tighter text-black dark:text-white uppercase select-none">
            Loktantra<span className="text-primary">Vani</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="h-px w-8 bg-black/20 dark:bg-white/20" />
            <p className="text-[9px] font-inter font-black tracking-[0.5em] opacity-40 uppercase">
              NEO BHARAT EDITORIAL
            </p>
            <span className="h-px w-8 bg-black/20 dark:bg-white/20" />
          </div>
        </Link>

        <div className="flex-1 flex justify-end items-center gap-6">
          {/* Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-primary/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-black" />
              )}
            </button>
          )}

          {/* Role-based quick links */}
          {userRole === "admin" && (
            <Link href="/admin" className="hidden md:flex items-center gap-2 text-xs font-inter font-black uppercase tracking-widest text-primary hover:underline">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}
          {userRole === "author" && (
            <Link href="/author/dashboard" className="hidden md:flex items-center gap-2 text-xs font-inter font-black uppercase tracking-widest text-primary hover:underline">
              <PenSquare className="w-4 h-4" />
              Write
            </Link>
          )}

          {/* Google Sign-In / Out */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              {userPhotoUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30">
                  <Image src={userPhotoUrl} alt={userName} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 bg-primary text-white flex items-center justify-center font-inter font-black text-sm">
                  {userName[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={signOut}
                title="Sign out"
                className="flex items-center gap-1 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-primary transition-all dark:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="hidden md:flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest text-black dark:text-white hover:text-primary transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden lg:inline">{lang === "hi" ? "साइन इन" : "Sign In"}</span>
            </button>
          )}

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-inter font-black tracking-widest opacity-40 uppercase leading-none">
                  Access Level
                </p>
                <p className="text-sm font-newsreader font-bold italic leading-none mt-1 dark:text-white capitalize">
                  {isLoggedIn ? userName.split(" ")[0] : userRole}
                </p>
              </div>
              <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-newsreader font-bold text-lg hover:bg-primary hover:text-white transition-colors overflow-hidden">
                {isLoggedIn && userPhotoUrl ? (
                  <Image src={userPhotoUrl} alt={userName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                ) : (
                  (isLoggedIn ? userName[0] : userRole[0]).toUpperCase()
                )}
              </div>
            </button>
            <AnimatePresence>
              {showRoles && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-4 w-48 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 shadow-2xl p-2 z-50 ring-4 ring-primary/5"
                >
                  {/* Google auth row */}
                  {isLoggedIn ? (
                    <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 mb-1">
                      <p className="text-[10px] font-inter font-black dark:text-white truncate">{userName}</p>
                      <button
                        onClick={() => { signOut(); setShowRoles(false); }}
                        className="text-[10px] font-inter font-bold text-red-500 hover:underline mt-1 flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" /> Sign out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { signInWithGoogle(); setShowRoles(false); }}
                      className="w-full text-left px-4 py-3 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2 border-b border-black/10 dark:border-white/10 mb-1 dark:text-white"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign in with Google
                    </button>
                  )}
                  {(["admin", "author", "guest"] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setUserRole(role);
                        setShowRoles(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-xs font-inter font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all dark:text-white",
                        userRole === role && "bg-black text-white dark:bg-white dark:text-black"
                      )}
                    >
                      {role === "admin" ? "Admin Dashboard" : role === "author" ? "Author Panel" : "Guest Reader"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2 hidden sm:block" />

          <button
            onClick={toggleLang}
            className="px-4 py-1.5 border-2 border-black dark:border-white font-inter font-black text-xs uppercase transition-all hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap dark:text-white"
          >
            {lang === "en" ? "हिन्दी" : "Eng"}
          </button>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-black dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-black dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Menu */}
      <div className="border-b-[6px] border-black dark:border-white/20 border-double py-4 px-8 md:px-16 hidden md:flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex gap-16 font-inter font-black text-xs uppercase tracking-widest text-black dark:text-white">
          {mainNavItems[lang].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-primary relative group flex items-center gap-2"
            >
              {item.icon && <item.icon className="w-3.5 h-3.5 text-primary" />}
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
          <Link href="/cartoon-mandala" className="hover:text-primary relative group flex items-center gap-2">
            Cartoon Mandala
            <span className="absolute -bottom-1 left-0 w-0 h-1 bg-primary transition-all group-hover:w-full" />
          </Link>
        </div>
        <Link href="/daily" className="flex items-center gap-3">
          <span className="text-[10px] font-inter font-black text-primary animate-pulse tracking-widest">
            TODAY&apos;S EDITION
          </span>
          <div className="w-1.5 h-1.5 bg-black dark:bg-white rotate-45" />
        </Link>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-[#0a0a0a] border-b-4 border-black dark:border-white/20 overflow-hidden"
          >
            <div className="px-8 py-6 space-y-4">
              {mainNavItems[lang].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-inter font-black uppercase tracking-widest py-3 border-b border-black/10 dark:border-white/10 dark:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/cartoon-mandala"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-inter font-black uppercase tracking-widest py-3 border-b border-black/10 dark:border-white/10 text-primary"
              >
                Cartoon Mandala
              </Link>
              <Link
                href="/daily"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-inter font-black uppercase tracking-widest py-3 text-primary"
              >
                Today&apos;s Edition
              </Link>
              <div className="flex gap-4 pt-4">
                <Link href="/search" className="p-3 border-2 border-black dark:border-white">
                  <Search className="w-5 h-5 dark:text-white" />
                </Link>
                <Link href="/bookmarks" className="p-3 border-2 border-black dark:border-white">
                  <Bookmark className="w-5 h-5 dark:text-white" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
