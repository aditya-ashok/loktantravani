"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Eye, EyeOff, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * One-surface sign-in:
 *  - Google first (popup, falls back to redirect where popups can't live)
 *  - Email underneath — one form; if the account doesn't exist we offer
 *    account creation inline instead of bouncing between tabs
 *  - Phone OTP as a secondary tab
 *  - Guests can bail out any time — reading never requires an account
 */
export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  // After a failed sign-in we surface the create-account path inline
  const [offerSignup, setOfferSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const confirmationRef = React.useRef<{ confirm: (code: string) => Promise<unknown> } | null>(null);
  const verifierRef = React.useRef<{ clear: () => void } | null>(null);

  // Open on whichever method worked for this person last time
  useEffect(() => {
    if (!open) return;
    try {
      const last = localStorage.getItem("lv_auth_method");
      if (last === "phone") setTab("phone");
    } catch { /* */ }
  }, [open]);

  const rememberMethod = (m: string) => {
    try { localStorage.setItem("lv_auth_method", m); } catch { /* */ }
  };

  const reset = () => {
    setEmail(""); setPassword(""); setName("");
    setError(""); setNotice(""); setLoading(false); setShowPassword(false);
    setOfferSignup(false);
    setPhone(""); setOtp(""); setOtpSent(false);
    confirmationRef.current = null;
    try { verifierRef.current?.clear(); } catch { /* */ }
    verifierRef.current = null;
  };

  const handleClose = () => { reset(); onClose(); };

  const switchTab = (t: "email" | "phone") => {
    setTab(t); setError(""); setNotice(""); setOfferSignup(false);
  };

  // ── Email: one form. Sign in; if that identity doesn't exist, offer signup inline.
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Enter your email and a password."); return; }
    if (offerSignup) {
      if (!name.trim()) { setError("Tell us your name to create the account."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      setLoading(true); setError("");
      try {
        await signUpWithEmail(email, password, name.trim());
        rememberMethod("email");
        handleClose();
      } catch (err: unknown) {
        const msg = (err as Error).message || "Sign up failed.";
        if (/already exists/i.test(msg)) {
          setOfferSignup(false);
          setError("This email already has an account — the password above must be wrong. Try again or use Google.");
        } else {
          setError(msg);
        }
      } finally { setLoading(false); }
      return;
    }
    setLoading(true); setError(""); setNotice("");
    try {
      await signInWithEmail(email, password);
      rememberMethod("email");
      handleClose();
    } catch (err: unknown) {
      const msg = (err as Error).message || "Sign in failed.";
      if (/No account found|Incorrect password/i.test(msg)) {
        // Enumeration protection makes these indistinguishable — offer both paths
        setOfferSignup(true);
        setNotice("No account matches that email and password. New here? Add your name below and we'll create your account with these details — or fix the password and try again.");
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  // ── Phone OTP
  const handleSendOtp = async () => {
    const clean = phone.replace(/[\s-]/g, "");
    const full = clean.startsWith("+") ? clean : `+91${clean}`;
    if (!/^\+\d{10,14}$/.test(full)) {
      setError("Enter a valid mobile number (10 digits, or with country code.)");
      return;
    }
    setLoading(true); setError("");
    try {
      const { auth, isFirebaseConfigured } = await import("@/lib/firebase");
      if (!isFirebaseConfigured) throw new Error("Sign-in is temporarily unavailable.");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, "lv-recaptcha", { size: "invisible" });
      }
      confirmationRef.current = await signInWithPhoneNumber(auth, full, verifierRef.current as never);
      setOtpSent(true);
      setNotice("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(
        code === "auth/too-many-requests" ? "Too many attempts — try again in a while."
        : code === "auth/invalid-phone-number" ? "That phone number doesn't look right."
        : code === "auth/operation-not-allowed" || code === "auth/billing-not-enabled"
          ? "SMS sign-in is being enabled — meanwhile Google or email works instantly."
        : code === "auth/invalid-app-credential" || code === "auth/captcha-check-failed"
          ? "Verification hiccup — reload the page and try once more, or use Google/email."
        : `Could not send OTP${code ? ` (${code.replace("auth/", "")})` : ""}.`
      );
      try { verifierRef.current?.clear(); } catch { /* */ }
      verifierRef.current = null;
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6 || !confirmationRef.current) {
      setError("Enter the 6-digit code sent to your phone.");
      return;
    }
    setLoading(true); setError("");
    try {
      await confirmationRef.current.confirm(otp);
      rememberMethod("phone");
      handleClose();
    } catch {
      setError("Incorrect code. Please check and try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first, then tap Forgot password."); return; }
    setLoading(true); setError("");
    try {
      const { auth, isFirebaseConfigured } = await import("@/lib/firebase");
      if (!isFirebaseConfigured) throw new Error("Sign-in is temporarily unavailable.");
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, email).catch(() => { /* don't reveal which emails exist */ });
      setNotice(`If an account exists for ${email}, a password-reset link is on its way. Check your inbox.`);
    } catch (err: unknown) {
      setError((err as Error).message || "Could not send the reset email.");
    } finally { setLoading(false); }
  };

  const handleEmailLink = async () => {
    if (!email) { setError("Enter your email first — we'll send a one-tap sign-in link."); return; }
    setLoading(true); setError("");
    try {
      const { auth, isFirebaseConfigured } = await import("@/lib/firebase");
      if (!isFirebaseConfigured) throw new Error("Sign-in is temporarily unavailable.");
      const { sendSignInLinkToEmail } = await import("firebase/auth");
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/auth/finish`,
        handleCodeInApp: true,
      });
      try { localStorage.setItem("lv_link_email", email); } catch { /* */ }
      setNotice(`Sign-in link sent to ${email} — open it on this device and you're in. No password needed.`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(code === "auth/operation-not-allowed"
        ? "One-tap links aren't switched on yet — use password or Google meanwhile."
        : (err as Error).message || "Could not send the link.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      await signInWithGoogle();
      rememberMethod("google");
      handleClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Google sign-in failed.");
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-9 pr-3 py-2.5 text-sm font-inter bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors";

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
                Continue to LoktantraVani
              </h2>
              <button onClick={handleClose} className="text-[var(--nyt-gray)] hover:text-[var(--nyt-black)] dark:hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-5 space-y-4">
              {/* Google first — the one-tap path */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3 border border-[var(--nyt-border)] text-[12px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-black)] dark:text-white hover:bg-[var(--nyt-light-gray)] dark:hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-[var(--nyt-border)]" />
                <span className="text-[9px] font-inter text-[var(--nyt-gray)] uppercase tracking-widest">or</span>
                <span className="flex-1 h-px bg-[var(--nyt-border)]" />
              </div>

              {/* Method tabs: email | phone */}
              <div className="flex border-b border-[var(--nyt-border)]">
                {(["email", "phone"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2 text-[10px] font-inter font-bold uppercase tracking-widest transition-colors ${
                      tab === t
                        ? "text-[var(--nyt-black)] dark:text-white border-b-2 border-[var(--nyt-black)] dark:border-white"
                        : "text-[var(--nyt-gray)]"
                    }`}
                  >
                    {t === "email" ? "Email" : "Phone OTP"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); if (tab === "phone") { otpSent ? handleVerifyOtp() : handleSendOtp(); } else { handleEmailContinue(e); } }}
              className="px-6 py-4 space-y-4"
            >
              {error && (
                <div className="text-[11px] font-inter text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
              {notice && !error && (
                <div className="text-[11px] font-inter text-[var(--nyt-black)] dark:text-white bg-[var(--nyt-light-gray)] dark:bg-white/5 px-3 py-2 border border-[var(--nyt-border)]">
                  {notice}
                </div>
              )}

              {tab === "email" && (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOfferSignup(false); setNotice(""); }} placeholder="you@example.com" className={inputCls} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--nyt-gray)] hover:text-[var(--nyt-black)] dark:hover:text-white">
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {offerSignup && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (creates your account)" className={inputCls} autoFocus />
                    </div>
                  )}
                  {!offerSignup && (
                    <div className="flex items-center justify-between -mt-1">
                      <button type="button" onClick={handleForgotPassword} className="text-[9px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary transition-colors">
                        Forgot password?
                      </button>
                      <button type="button" onClick={handleEmailLink} className="text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
                        ✨ Email me a sign-in link
                      </button>
                    </div>
                  )}
                </>
              )}

              {tab === "phone" && (
                <>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nyt-gray)]" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} placeholder="98765 43210 (or +91...)" className={`${inputCls} disabled:opacity-60`} />
                  </div>
                  {otpSent && (
                    <div>
                      <input
                        type="text" inputMode="numeric" maxLength={6} value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit code"
                        className="w-full px-3 py-2.5 text-sm font-inter tracking-[0.4em] text-center bg-white dark:bg-[#0d0d0d] border border-[var(--nyt-border)] text-[var(--nyt-black)] dark:text-white placeholder:text-[var(--nyt-gray)] placeholder:tracking-normal focus:outline-none focus:border-[var(--nyt-black)] dark:focus:border-white transition-colors"
                        autoFocus
                      />
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="mt-1.5 text-[9px] font-inter font-bold uppercase tracking-widest text-primary hover:underline">
                        Change number / resend
                      </button>
                    </div>
                  )}
                  <div id="lv-recaptcha" />
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[var(--nyt-black)] dark:bg-white text-white dark:text-black text-[11px] font-inter font-bold uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..."
                  : tab === "phone" ? (otpSent ? "Verify & Continue" : "Send OTP")
                  : offerSignup ? "Create Account & Continue"
                  : "Continue"}
              </button>

              {/* Guests are first-class — reading never needs an account */}
              <button type="button" onClick={handleClose} className="w-full text-center text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-[var(--nyt-black)] dark:hover:text-white transition-colors pb-1">
                Continue as guest →
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
