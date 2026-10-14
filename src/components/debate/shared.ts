export const SUGGESTED_MOTIONS: { en: string; hi: string }[] = [
  { en: "One Nation, One Election is good for Indian democracy", hi: "एक राष्ट्र, एक चुनाव भारतीय लोकतंत्र के लिए अच्छा है" },
  { en: "India should implement a Uniform Civil Code", hi: "भारत को समान नागरिक संहिता लागू करनी चाहिए" },
  { en: "Delimitation by population is fair to southern states", hi: "जनसंख्या के आधार पर परिसीमन दक्षिणी राज्यों के साथ न्यायसंगत है" },
  { en: "Freebies by political parties harm the economy", hi: "राजनीतिक दलों की मुफ्त योजनाएं अर्थव्यवस्था को नुकसान पहुंचाती हैं" },
  { en: "The voting age should be lowered to 16", hi: "मतदान की आयु घटाकर 16 वर्ष कर देनी चाहिए" },
  { en: "Social media should be regulated during elections", hi: "चुनाव के दौरान सोशल मीडिया को नियंत्रित किया जाना चाहिए" },
];

export async function debateApi<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data.result as T;
}

export type FactCheck = {
  claims: { claim: string; rating: "accurate" | "misleading" | "false" | "unverified"; note: string; source?: string }[];
};

export const RATING_STYLE: Record<string, string> = {
  accurate: "bg-green-500/15 text-green-400 border-green-500/30",
  misleading: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  false: "bg-red-500/15 text-red-400 border-red-500/30",
  unverified: "bg-white/10 text-white/60 border-white/20",
};
