"use client";

/** Completes a passwordless email-link sign-in and returns the reader home. */
import { useEffect, useState } from "react";

export default function FinishSignIn() {
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      try {
        const { auth, isFirebaseConfigured } = await import("@/lib/firebase");
        if (!isFirebaseConfigured) { setStatus("Sign-in is unavailable right now."); return; }
        const { isSignInWithEmailLink, signInWithEmailLink } = await import("firebase/auth");
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setStatus("This sign-in link is invalid or has expired.");
          return;
        }
        let email = "";
        try { email = localStorage.getItem("lv_link_email") || ""; } catch { /* */ }
        if (!email) email = window.prompt("Confirm your email to finish signing in:") || "";
        if (!email) { setStatus("Email confirmation needed — reopen the link and enter your email."); return; }
        await signInWithEmailLink(auth, email, window.location.href);
        try { localStorage.removeItem("lv_link_email"); } catch { /* */ }
        setStatus("You're in! Taking you home…");
        setTimeout(() => { window.location.replace("/"); }, 800);
      } catch {
        setStatus("That link didn't work — it may have expired. Request a fresh one from Sign In.");
      }
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0d0d] px-4">
      <div className="text-center max-w-sm">
        <div className="font-newsreader text-3xl font-black dark:text-white">Loktantra<span className="text-primary">Vani</span></div>
        <p className="mt-4 text-sm font-inter text-[var(--nyt-gray)] dark:text-white/60">{status}</p>
      </div>
    </main>
  );
}
