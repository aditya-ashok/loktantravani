"use client";

import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

const DANGEROUS_TAGS = [
  "script", "iframe", "object", "embed", "form", "input", "textarea",
  "button", "link", "style", "meta", "base", "applet",
];

function sanitizeHtml(html: string): string {
  // Remove dangerous tags and their contents (for script/style/applet which have meaningful content to strip)
  for (const tag of ["script", "style", "applet"]) {
    const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    html = html.replace(re, "");
  }

  // Remove dangerous self-closing or open/close tags (without stripping inner content for layout tags)
  for (const tag of DANGEROUS_TAGS) {
    const openClose = new RegExp(`</?${tag}(\\s[^>]*)?>`, "gi");
    html = html.replace(openClose, "");
  }

  // Remove all on* event attributes (onclick, onerror, onload, etc.)
  html = html.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove javascript: URLs from href and src attributes
  html = html.replace(/(href|src)\s*=\s*["']\s*javascript\s*:[^"']*["']/gi, "");
  html = html.replace(/(href|src)\s*=\s*javascript\s*:[^\s>]*/gi, "");

  // Remove data: URLs from src attributes (except data:image/)
  html = html.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, "");
  html = html.replace(/src\s*=\s*data:(?!image\/)[^\s>]*/gi, "");

  return html;
}

interface PostContentProps {
  content: string;
  contentHi?: string;
}

export default function PostContent({ content, contentHi }: PostContentProps) {
  const { lang } = useLanguage();
  const raw = lang === "hi" && contentHi ? contentHi : content;
  const html = sanitizeHtml(raw);

  return (
    <div
      className={cn(
        "post-content newspaper-text max-w-none",
        lang === "hi" && "hindi"
      )}
      style={{ textAlign: "left", hyphens: "auto" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
