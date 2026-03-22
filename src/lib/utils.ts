import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(date: Date | { toDate?: () => Date }, lang: "en" | "hi" = "en"): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(date: Date | { toDate?: () => Date }): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
