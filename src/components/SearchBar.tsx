"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface SearchBarProps {
  className?: string;
  size?: "sm" | "lg";
}

export default function SearchBar({ className, size = "sm" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search articles...", "लेख खोजें...")}
          className={`flex-1 border-2 border-black dark:border-white border-r-0 font-inter bg-transparent dark:text-white placeholder:opacity-40 ${
            size === "lg" ? "px-6 py-4 text-base" : "px-4 py-2.5 text-sm"
          }`}
        />
        <button
          type="submit"
          className={`bg-black dark:bg-white text-white dark:text-black hover:bg-primary transition-colors flex items-center justify-center ${
            size === "lg" ? "px-6" : "px-4"
          }`}
        >
          <Search className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
        </button>
      </div>
    </form>
  );
}
