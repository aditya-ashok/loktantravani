"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setLoading(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const switchTab = (t: "signin" | "signup") => {
    setTab(t);
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
      handleClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(email, password, name);
      handleClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      handleClose();
    } catch {
      setError("Google sign-in failed.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#1a1a1a] w-full max-w-[400px] border border-[var(--nyt-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nyt-border)]">
              <h2 className="text-lg font-newsreader font-bold text-[var(--nyt-black)] dark:text-white">
                {tab === "signin" ? "Sign In" : "Create Account"}
              </h2>
              <button onClick={handleClose} className="text-[var(--nyt-gray)] hover:text-[var(--nyt-black)] dark:hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--nyt-border)]">
              <button
                onClick={() => switchTab("signin")}
                className={`flex-1 py-2.5 text-[10px] font-inter font-bold uppercase tracking-widest transition-colors ${
                  tab === "signin"
                    ? "text-[var(--nyt-black)] dark:text-white border-b-2 border-[var(--nyt-black)] dark:border-white"
                    : "text-[var(--nyt-gray)]"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchTab("signup")}
                className={`flex-1 py-2.5 text-[10px] font-inter font-bold uppercase tracking-widest transition-colors ${
                  tab === "signup"
                    ? "text-[var(--nyt-black)] dark:text-white border-b-2 border-[var(--nyt-black)] dark:border-white"
                    : "text-[var(--nyt-gray)]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="px-6 py-5 space-y-4">
              {/* Error */}
              {error && (
                <div className="text-[11px] font-inter text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Name (signup only) */}
              {tab === "signup" && (
                <div>
                  <label className="block text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-inter bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-inter bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm font-inter bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--nyt-gray)] hover:text-[var(--nyt-black)] dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {tab === "signup" && (
                <div>
                  <label className="block text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-inter bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[var(--nyt-black)] dark:bg-white text-white dark:text-black text-[11px] font-inter font-bold uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-[var(--nyt-border)]" />
                <span className="text-[9px] font-inter text-[var(--nyt-gray)] uppercase tracking-widest">or</span>
                <span className="flex-1 h-px bg-[var(--nyt-border)]" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-2.5 border border-[var(--nyt-border)] text-[11px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-black)] dark:text-white hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
