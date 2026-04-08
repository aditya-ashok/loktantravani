/**
 * POST /api/seed-articles
 * Fetches RSS news for each section and creates 10 draft articles per section.
 * All articles are created as "draft" — admin must approve before publishing.
 *
 * Body (optional): { sections?: string[] }  — limit to specific sections
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchNewsForCategory, generateArticleDraft } from "@/lib/news-agent";
import type { PostCategory } from "@/lib/types";
import { AUTHOR_NAMES } from "@/lib/authors";

const SECTIONS_TO_SEED: PostCategory[] = [
  "India", "World", "Politics", "Geopolitics", "Economy",
  "Sports", "Tech", "Defence", "Opinion", "Cities",
];

// Stock images per category
const CATEGORY_IMAGES: Record<string, string[]> = {
  India: [
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200",
    "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200",
  ],
  World: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200",
  ],
  Politics: [
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200",
    "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1200",
  ],
  Geopolitics: [
    "https://images.unsplash.com/photo-1548013146-72479768bbaa?w=1200",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200",
  ],
  Economy: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200",
  ],
  Sports: [
    "https://images.unsplash.com/photo-1461896836934-bd45ba8aa4f2?w=1200",
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
  ],
  Tech: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200",
  ],
  Defence: [
    "https://images.unsplash.com/photo-1579912437766-7896df6d3cd3?w=1200",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200",
  ],
  Opinion: [
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200",
  ],
  Cities: [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200",
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e13?w=1200",
  ],
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_SEED) {
    return NextResponse.json({ error: "Seed endpoints disabled in production. Set ALLOW_SEED=1 to enable." }, { status: 403 });
  }

  try {
    const { isFirebaseConfigured } = await import("@/lib/firebase");
    if (!isFirebaseConfigured) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const sectionsToProcess: PostCategory[] = body.sections || SECTIONS_TO_SEED;

    const { createPost } = await import("@/lib/firebase-service");

    const results: { section: string; articlesCreated: number; error?: string }[] = [];

    for (const section of sectionsToProcess) {
      try {
        // Fetch RSS items for this category
        const newsItems = await fetchNewsForCategory(section);

        if (newsItems.length === 0) {
          results.push({ section, articlesCreated: 0, error: "No RSS items found" });
          continue;
        }

        // Take up to 10 unique news items
        const uniqueItems = newsItems.filter(
          (item, idx, arr) => arr.findIndex(i => i.title === item.title) === idx
        ).slice(0, 10);

        let created = 0;
        for (let i = 0; i < uniqueItems.length; i++) {
          const item = uniqueItems[i];
          const authorName = AUTHOR_NAMES[i % AUTHOR_NAMES.length];
          const images = CATEGORY_IMAGES[section] || CATEGORY_IMAGES["India"];
          const imageUrl = images[i % images.length];

          // Generate a proper article body from the news item
          const content = `<p class="text-xl font-newsreader italic mb-8">${item.description || item.title}</p>
<h2>Key Developments</h2>
<p>${item.title} — This story was sourced from ${item.source} and is pending editorial review by the LoktantraVani desk.</p>
<p>The developments signal significant shifts in the ${section.toLowerCase()} landscape, with implications for India's strategic positioning.</p>
<blockquote>This article was generated from RSS feeds and requires admin approval before publication.</blockquote>`;

          try {
            await createPost({
              title: item.title,
              titleHi: "",
              summary: item.description || `Latest ${section} news sourced from ${item.source}.`,
              summaryHi: "",
              content,
              contentHi: "",
              category: section,
              section: "Main Feed",
              author: authorName,
              authorRole: "agent",
              imageUrl,
              status: "draft", // DRAFT — admin must approve
              tags: [section.toLowerCase().replace(/\s+/g, "-"), "rss-feed", "pending-review"],
            });
            created++;
          } catch (postErr) {
            console.warn(`Failed to create article "${item.title}":`, postErr);
          }
        }

        results.push({ section, articlesCreated: created });
      } catch (sectionErr) {
        results.push({ section, articlesCreated: 0, error: String(sectionErr) });
      }
    }

    const totalCreated = results.reduce((sum, r) => sum + r.articlesCreated, 0);

    return NextResponse.json({
      success: true,
      message: `Created ${totalCreated} draft articles across ${results.length} sections. Admin approval required before publishing.`,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
