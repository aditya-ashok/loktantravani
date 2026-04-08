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
  // Vikram Samvat = Gregorian + 57 (before Chaitra ~mid-March) or +56 (after)
  const gMonth = date.getMonth(); // 0-indexed
  const gDay = date.getDate();
  // Chaitra starts ~March 22. Before that, we're in the previous VS year
  const vsYear = gMonth < 2 || (gMonth === 2 && gDay < 22) ? date.getFullYear() + 56 : date.getFullYear() + 57;

  // Approximate Hindu month mapping (solar months, simplified)
  const MONTHS = [
    { en: "Paush", hi: "पौष" },        // Jan
    { en: "Magh", hi: "माघ" },         // Feb
    { en: "Phalguna", hi: "फाल्गुन" }, // Mar (before 22)
    { en: "Chaitra", hi: "चैत्र" },     // Mar 22 - Apr
    { en: "Vaishakha", hi: "वैशाख" },  // Apr - May
    { en: "Jyeshtha", hi: "ज्येष्ठ" },  // May - Jun
    { en: "Ashadha", hi: "आषाढ़" },     // Jun - Jul
    { en: "Shravana", hi: "श्रावण" },   // Jul - Aug
    { en: "Bhadrapada", hi: "भाद्रपद" },// Aug - Sep
    { en: "Ashvina", hi: "आश्विन" },    // Sep - Oct
    { en: "Kartika", hi: "कार्तिक" },   // Oct - Nov
    { en: "Margashirsha", hi: "मार्गशीर्ष" }, // Nov - Dec
    { en: "Paush", hi: "पौष" },        // Dec - Jan
  ];

  // Map Gregorian month to Hindu month (simplified)
  let monthIdx: number;
  if (gMonth === 0) monthIdx = 0;      // Jan → Paush
  else if (gMonth === 1) monthIdx = 1;  // Feb → Magh
  else if (gMonth === 2 && gDay < 22) monthIdx = 2; // early Mar → Phalguna
  else if (gMonth === 2 || (gMonth === 3 && gDay < 21)) monthIdx = 3; // late Mar/early Apr → Chaitra
  else if (gMonth === 3 || (gMonth === 4 && gDay < 21)) monthIdx = 4;
  else if (gMonth === 4 || (gMonth === 5 && gDay < 21)) monthIdx = 5;
  else if (gMonth === 5 || (gMonth === 6 && gDay < 22)) monthIdx = 6;
  else if (gMonth === 6 || (gMonth === 7 && gDay < 22)) monthIdx = 7;
  else if (gMonth === 7 || (gMonth === 8 && gDay < 22)) monthIdx = 8;
  else if (gMonth === 8 || (gMonth === 9 && gDay < 22)) monthIdx = 9;
  else if (gMonth === 9 || (gMonth === 10 && gDay < 21)) monthIdx = 10;
  else if (gMonth === 10 || (gMonth === 11 && gDay < 21)) monthIdx = 11;
  else monthIdx = 12;

  const m = MONTHS[monthIdx];
  // Approximate tithi — day offset from start of Hindu month
  // Each Hindu month starts ~21-22nd of Gregorian month
  const MONTH_STARTS = [0, 0, 0, 22, 21, 21, 21, 22, 22, 22, 22, 21, 21]; // day of Gregorian month when Hindu month starts
  const startDay = MONTH_STARTS[monthIdx] || 22;
  let tithi: number;
  if (gDay >= startDay) {
    tithi = gDay - startDay + 1;
  } else {
    // We're past the start day in the previous Gregorian month
    tithi = gDay + (30 - startDay) + 1;
  }

  return { year: vsYear, month: m.en, monthHi: m.hi, tithi };
}

export function formatDate(date: Date | { toDate?: () => Date }, lang: "en" | "hi" = "en"): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  const gregorian = d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (lang === "hi") {
    const vs = toVikramSamvat(d);
    return `${vs.monthHi} ${vs.tithi}, विक्रम संवत ${vs.year}\n${gregorian}`;
  }

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
