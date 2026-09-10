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

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "en";

  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "hi" || urlLang === "en") return urlLang;
  if (window.location.hostname.startsWith("hindi.")) return "hi";

  const cookieLang = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("lang="))
    ?.slice(5);
  if (cookieLang === "hi" || cookieLang === "en") return cookieLang;

  const savedLang = window.localStorage.getItem("lang");
  return savedLang === "hi" || savedLang === "en" ? savedLang : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isHindiDomain, setIsHindiDomain] = useState(false);

  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    if (typeof window === "undefined") return;

    window.localStorage.setItem("lang", nextLang);
    document.cookie = `lang=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLang === "hi" ? "hi" : "en";

    const url = new URL(window.location.href);
    if (nextLang === "hi") url.searchParams.set("lang", "hi");
    else url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLang(detectInitialLang());
      setIsHindiDomain(window.location.hostname.startsWith("hindi."));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [setLang]);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

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
