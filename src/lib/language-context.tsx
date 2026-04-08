"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type Lang = "en" | "hi";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (en: string, hi?: string) => string;
  isHindiDomain: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (en) => en,
  isHindiDomain: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isHindiDomain, setIsHindiDomain] = useState(false);

  // Detect Hindi subdomain from cookie or hostname
  const getInitialLang = (): Lang => {
    if (typeof window !== "undefined") {
      if (window.location.hostname.startsWith("hindi.")) return "hi";
      if (document.cookie.includes("lang=hi")) return "hi";
    }
    return "en";
  };

  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const detected = getInitialLang();
    setLang(detected);
    setIsHindiDomain(typeof window !== "undefined" && window.location.hostname.startsWith("hindi."));
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  }, []);

  const t = useCallback(
    (en: string, hi?: string) => {
      if (lang === "hi" && hi) return hi;
      return en;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isHindiDomain }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
