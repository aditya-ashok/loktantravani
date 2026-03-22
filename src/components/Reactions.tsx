"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/lib/types";

interface ReactionsProps {
  postId: string;
  reactions: Record<ReactionType, number>;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "india", emoji: "🇮🇳", label: "Bharat" },
  { type: "bulb", emoji: "💡", label: "Insightful" },
  { type: "clap", emoji: "👏", label: "Applause" },
];

export default function Reactions({ postId, reactions }: ReactionsProps) {
  const [counts, setCounts] = useState(reactions);
  const [reacted, setReacted] = useState<Set<ReactionType>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(`reactions-${postId}`);
    return stored ? new Set(JSON.parse(stored) as ReactionType[]) : new Set();
  });

  const handleReact = async (type: ReactionType) => {
    if (reacted.has(type)) return;

    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    const newReacted = new Set(reacted).add(type);
    setReacted(newReacted);
    localStorage.setItem(`reactions-${postId}`, JSON.stringify([...newReacted]));

    try {
      const { addReaction } = await import("@/lib/firebase-service");
      await addReaction(postId, type);
    } catch {
      // Firebase not configured — keep local state
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="flex items-center gap-3">
      {REACTION_CONFIG.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={() => handleReact(type)}
          title={label}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 border-2 transition-all text-sm",
            reacted.has(type)
              ? "border-primary bg-primary/10 scale-105"
              : "border-black/10 dark:border-white/10 hover:border-primary hover:scale-105"
          )}
        >
          <span className="text-lg">{emoji}</span>
          <span className="font-inter font-black text-xs dark:text-white">
            {formatCount(counts[type])}
          </span>
        </button>
      ))}
    </div>
  );
}
