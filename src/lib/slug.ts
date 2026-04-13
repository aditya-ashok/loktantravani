/**
 * Generate URL-friendly slugs — always ASCII English.
 * For Hindi titles, uses a transliteration map for common words,
 * otherwise falls back to "article-{random}".
 */

/** Common Hindi→English transliterations for news headlines */
const HINDI_WORDS: Record<string, string> = {
  "भारत": "bharat", "भारतीय": "bharatiya", "प्रधानमंत्री": "pm", "मोदी": "modi",
  "सरकार": "sarkar", "देश": "desh", "राज्य": "rajya", "चुनाव": "chunav",
  "संसद": "sansad", "लोकसभा": "loksabha", "राज्यसभा": "rajyasabha",
  "मंत्री": "mantri", "नेता": "neta", "पार्टी": "party", "बीजेपी": "bjp",
  "कांग्रेस": "congress", "विपक्ष": "vipaksh", "सेना": "sena",
  "रक्षा": "raksha", "युद्ध": "yuddh", "शांति": "shanti",
  "अर्थव्यवस्था": "arthvyavastha", "बजट": "budget", "आर्थिक": "arthik",
  "कीमत": "keemat", "बाजार": "bazaar", "व्यापार": "vyapar",
  "तकनीक": "tech", "डिजिटल": "digital", "इंटरनेट": "internet",
  "खेल": "khel", "क्रिकेट": "cricket", "विश्व": "vishwa",
  "पाकिस्तान": "pakistan", "चीन": "china", "अमेरिका": "america",
  "रूस": "russia", "शिक्षा": "shiksha", "स्वास्थ्य": "swasthya",
  "नई": "nai", "दिल्ली": "delhi", "मुंबई": "mumbai",
  "कोलकाता": "kolkata", "बेंगलुरु": "bengaluru", "हैदराबाद": "hyderabad",
  "आतंकवाद": "aatankwad", "सुरक्षा": "suraksha", "पुलिस": "police",
  "न्यायालय": "nyayalay", "कानून": "kanoon", "अदालत": "adalat",
  "किसान": "kisan", "महिला": "mahila", "युवा": "yuva",
  "विकास": "vikas", "योजना": "yojana", "नीति": "neeti",
  "समाचार": "samachar", "ताजा": "taza", "बड़ी": "badi", "बड़ा": "bada",
  "खबर": "khabar", "रिपोर्ट": "report", "आज": "aaj",
};

/** Try to transliterate Hindi title to English slug words */
function transliterateHindi(title: string): string {
  const words = title.split(/\s+/);
  const english: string[] = [];
  for (const word of words) {
    // Strip punctuation from word
    const clean = word.replace(/[।,!?\-:;'"()]/g, "").trim();
    if (!clean) continue;
    // Check if it's already English
    if (/^[a-zA-Z0-9]+$/.test(clean)) {
      english.push(clean.toLowerCase());
      continue;
    }
    // Try transliteration map
    const mapped = HINDI_WORDS[clean];
    if (mapped) {
      english.push(mapped);
    }
    // Skip untranslatable Hindi words
  }
  return english.join("-");
}

export function generateSlug(title: string): string {
  // First try: extract ASCII English words
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  if (ascii.length >= 10) {
    // Good English slug
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${ascii}-${suffix}`;
  }

  // Try transliterating Hindi
  const transliterated = transliterateHindi(title);
  if (transliterated.length >= 5) {
    const combined = ascii ? `${ascii}-${transliterated}` : transliterated;
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${combined.slice(0, 80)}-${suffix}`;
  }

  // Fallback
  const suffix = Date.now().toString(36);
  const base = ascii || "article";
  return `${base}-${suffix}`;
}
