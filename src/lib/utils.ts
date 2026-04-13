import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Convert Gregorian date to approximate Vikram Samvat date */
export function toVikramSamvat(date: Date = new Date()): { year: number; month: string; monthHi: string; tithi: number } {
  // Use Intl Indian National Calendar (Saka) for accurate month/day,
  // then convert to Vikram Samvat (VS = Saka + 135)
  const partsEn = new Intl.DateTimeFormat("en-u-ca-indian", {
    year: "numeric", month: "long", day: "numeric",
  }).formatToParts(date);

  const partsHi = new Intl.DateTimeFormat("hi-u-ca-indian", {
    month: "long",
  }).formatToParts(date);

  const monthEn = partsEn.find(p => p.type === "month")?.value || "Chaitra";
  const monthHi = partsHi.find(p => p.type === "month")?.value || "चैत्र";
  const day = parseInt(partsEn.find(p => p.type === "day")?.value || "1", 10);
  const sakaYear = parseInt(partsEn.find(p => p.type === "year")?.value || "1948", 10);
  const vsYear = sakaYear + 135;

  return { year: vsYear, month: monthEn, monthHi, tithi: day };
}

export function formatDate(date: Date | { toDate?: () => Date }, lang: "en" | "hi" = "en"): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  const gregorian = d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return gregorian;
}

export function timeAgo(date: Date | { toDate?: () => Date }): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
