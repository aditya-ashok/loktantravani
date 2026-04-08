"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

const CATEGORIES = [
  { id: "Politics", label: "Politics", icon: "⚖️" },
  { id: "Tech", label: "Tech & AI", icon: "🤖" },
  { id: "Economy", label: "Economy", icon: "📈" },
  { id: "Geopolitics", label: "Geopolitics", icon: "🌐" },
  { id: "Defence", label: "Defence", icon: "🛡️" },
  { id: "Culture", label: "Culture", icon: "🎭" },
  { id: "Sports", label: "Sports", icon: "🏆" },
  { id: "Opinion", label: "Opinion", icon: "✍️" },
];

export default function OnboardingModal() {
  const { isLoggedIn, userId, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"welcome" | "interests" | "auth">("welcome");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Show after 5 minutes of browsing for non-logged-in users only
    if (isLoggedIn) return;
    const hasSeenOnboarding = localStorage.getItem("onboarding_seen");
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    localStorage.setItem("onboarding_seen", "true");
    
    if (isLoggedIn && userId) {
      try {
        await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: userId, interests: selectedInterests }),
        });
        window.location.reload(); // Refresh to show personalized content
      } catch (e) {
        console.error("Failed to save interests", e);
      }
    } else {
      setStep("auth");
    }
    setSaving(false);
  };

  const handleClose = () => {
    localStorage.setItem("onboarding_seen", "true");
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-[500px] shadow-2xl overflow-hidden round-none border border-[var(--nyt-border)]"
            >
              {/* Header */}
              <div className="relative p-8 text-center border-b border-[var(--nyt-border)] bg-slate-50 dark:bg-white/5">
                <button 
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-3xl font-playfair font-black text-gray-900 dark:text-white leading-tight">
                  {step === "welcome" ? "Welcome to the Future of News" : "Tailor Your Experience"}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-inter">
                  {step === "welcome" 
                    ? "LoktantraVani uses AI to curate the truth. Let's personalize your morning brief." 
                    : "Select topics that matter to you for an AI-powered personalized feed."}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {step === "welcome" ? (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/10">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">🤖</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">AI-Powered Curation</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Our neural engine filters noise to bring you factual, high-impact stories.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/10">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xl">📊</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Personalized Intelligence</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The more you read, the smarter your feed becomes with ML recommendations.</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setStep("interests")}
                      className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      Get Started <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : step === "interests" ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleInterestToggle(cat.id)}
                          className={`flex items-center gap-3 p-4 border transition-all ${
                            selectedInterests.includes(cat.id)
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-[var(--nyt-border)] bg-gray-50 dark:bg-white/5 hover:border-gray-400"
                          }`}
                        >
                          <span className="text-xl shrink-0">{cat.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-tight ${
                            selectedInterests.includes(cat.id) ? "text-primary" : "text-gray-600 dark:text-gray-300"
                          }`}>
                            {cat.label}
                          </span>
                          {selectedInterests.includes(cat.id) && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={selectedInterests.length === 0 || saving}
                      onClick={handleComplete}
                      className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm hover:bg-primary transition-all disabled:opacity-50"
                    >
                      {saving ? "Optimizing..." : "Finalize Profile"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="p-6 bg-slate-50 dark:bg-white/5 border border-dashed border-[var(--nyt-border)]">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-inter leading-relaxed">
                        To save your preferences permanently and unlock <strong className="text-primary uppercase tracking-tighter">Exclusive AI Clippings</strong>, please create an account.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setShowAuth(true)}
                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-sm hover:shadow-lg transition-all"
                      >
                        Create Account
                      </button>
                      <button
                        onClick={handleClose}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Continue as Guest
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={showAuth} onClose={() => {
        setShowAuth(false);
        handleClose();
      }} />
    </>
  );
}
