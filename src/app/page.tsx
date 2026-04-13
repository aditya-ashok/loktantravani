import React from "react";
import { headers } from "next/headers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VaniBot from "@/components/VaniBot";
import OnboardingModal from "@/components/OnboardingModal";
import LandingContent from "@/components/LandingContent";
import BreakingNews from "@/components/BreakingNews";
import { getPosts } from "@/lib/data-service";

export const revalidate = 120; // ISR: regenerate every 2 minutes, on-demand via /api/revalidate

export default async function LandingPage() {
  const headersList = await headers();
  const lang = headersList.get("x-lang");
  const isHindi = lang === "hi";

  // On Hindi subdomain, fetch Hindi articles; on English, filter out Hindi-only
  const allPosts = isHindi
    ? await getPosts("published", 200, "hi")
    : await getPosts("published", 200, "en");

  return (
    <>
      <Navbar />
      <OnboardingModal />
      {/* pt matches navbar height: mobile ~80px, desktop ~148px */}
      <main className="min-h-screen pt-[80px] md:pt-[108px] bg-white dark:bg-[#0d0d0d]">
        <BreakingNews />
        {allPosts.length === 0 ? (
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-24 text-center">
            <h2 className="text-2xl font-newsreader font-black opacity-20">LOKTANTRAVANI IS UPDATING...</h2>
          </div>
        ) : (
          <LandingContent allPosts={allPosts} />
        )}
      </main>
      <VaniBot />
      <Footer />
    </>
  );
}
