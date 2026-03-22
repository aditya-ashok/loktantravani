"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubscriptionBanner from "@/components/SubscriptionBanner";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        {children}
      </main>
      <Footer />
      <SubscriptionBanner />
    </>
  );
}
