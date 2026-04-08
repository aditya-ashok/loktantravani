"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function NewsletterSignup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      // Call subscribe API (saves to Firestore + sends welcome email)
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // fallback: try direct Firestore
      try {
        const { addSubscriber } = await import("@/lib/firebase-service");
        await addSubscriber(email);
      } catch { /* ignore */ }
    }
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] bg-[#fff9f3] dark:bg-white/5">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h4 className="text-lg font-newsreader font-black uppercase dark:text-white">
          {t("The Vani Newsletter", "वाणी समाचार पत्र")}
        </h4>
      </div>
      <p className="text-xs font-inter opacity-60 mb-6 dark:text-white/60">
        {t(
          "Get the Neo Bharat perspective delivered daily. Free, always.",
          "नव भारत का दृष्टिकोण प्रतिदिन प्राप्त करें। मुफ़्त, हमेशा।"
        )}
      </p>
      {subscribed ? (
        <p className="text-sm font-inter font-black text-primary">
          {t("Welcome to the discourse!", "विमर्श में स्वागत!")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("your@email.com", "आपका@ईमेल.com")}
            className="w-full px-4 py-3 border-2 border-black dark:border-white/30 font-inter text-sm bg-white dark:bg-transparent dark:text-white placeholder:opacity-40"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-inter font-black text-xs uppercase tracking-widest hover:bg-primary transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {t("Subscribe", "सदस्यता लें")}
          </button>
        </form>
      )}
    </div>
  );
}
