import { MetadataRoute } from "next";
import { AUTHORS } from "@/lib/authors";

const SITE_URL = "https://loktantravani.in";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/daily`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/epaper`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/lok-post`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/west-asia`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/premium`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/opposition-tracker`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/modi-scorecard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/talking-points`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/bjp-vs-upa`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  // Category pages
  const categories = [
    "india", "world", "politics", "geopolitics", "economy",
    "sports", "tech", "defence", "opinion", "cities", "west-asia",
  ];
  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${SITE_URL}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  // Article pages from Firestore
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit: 2000,
        },
      }),
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const results = await res.json();
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      articlePages = results
        .filter((r: { document?: unknown }) => r.document)
        .map((r: { document: { fields: { slug?: { stringValue: string }; category?: { stringValue: string }; updatedAt?: { stringValue: string }; createdAt?: { stringValue: string }; title?: { stringValue: string } } } }) => {
          const f = r.document.fields;
          const slug = f.slug?.stringValue || "";
          const category = (f.category?.stringValue || "india").toLowerCase().replace(/\s+/g, "-");
          const updated = f.updatedAt?.stringValue ? new Date(f.updatedAt.stringValue) : new Date();
          const created = f.createdAt?.stringValue ? new Date(f.createdAt.stringValue) : updated;
          // Recent articles (< 2 days old) get higher priority for Google News
          const isRecent = created > twoDaysAgo;
          return {
            url: `${SITE_URL}/${category}/${slug}`,
            lastModified: updated,
            changeFrequency: isRecent ? ("hourly" as const) : ("weekly" as const),
            priority: isRecent ? 0.9 : 0.6,
          };
        });
    }
  } catch { /* */ }

  // Author pages
  const authorPages: MetadataRoute.Sitemap = AUTHORS
    .filter(a => a.name !== "Admin")
    .map(a => ({
      url: `${SITE_URL}/author/${encodeURIComponent(a.name)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...authorPages, ...articlePages];
}
