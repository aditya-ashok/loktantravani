"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "𝕏",
      title: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "f",
      title: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "in",
      title: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "💬",
      title: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40 mr-2">
        {t("Share", "साझा करें")}
      </span>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          title={link.title}
          className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center font-inter font-black text-xs hover:bg-primary hover:text-white hover:border-primary transition-all dark:text-white"
        >
          {link.label}
        </a>
      ))}
      <button
        onClick={handleCopy}
        title="Copy link"
        className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all dark:text-white"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
