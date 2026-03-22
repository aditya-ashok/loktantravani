"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
  linked?: boolean;
}

export default function CategoryBadge({ category, size = "sm", linked = true }: CategoryBadgeProps) {
  const classes = cn(
    "bg-primary text-white font-inter font-black uppercase tracking-widest inline-block",
    size === "sm" ? "px-3 py-1 text-[9px]" : "px-4 py-1.5 text-[11px]"
  );

  if (linked) {
    return (
      <Link href={`/category/${encodeURIComponent(category)}`} className={cn(classes, "hover:bg-black transition-colors")}>
        {category}
      </Link>
    );
  }

  return <span className={classes}>{category}</span>;
}
