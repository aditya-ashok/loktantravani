"use client";

import type { LucideIcon } from "lucide-react";

interface SectionHeadingProps {
  children: React.ReactNode;
  icon?: LucideIcon;
}

export default function SectionHeading({ children, icon: Icon }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-4 mb-12 border-l-8 border-primary pl-6 py-2">
      {Icon && <Icon className="w-8 h-8 text-primary" />}
      <h2 className="text-4xl md:text-5xl font-newsreader font-black uppercase tracking-tighter text-black dark:text-white select-none">
        {children}
      </h2>
      <div className="h-px bg-black dark:bg-white flex-1 opacity-10" />
    </div>
  );
}
