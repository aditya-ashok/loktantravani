/**
 * Google News Sitemap — only includes articles from last 48 hours
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import { NextResponse } from "next/server";

export const revalidate = 600; // 10 min

const SITE_URL = "https://loktantravani.in";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function GET() {
  let articles: { slug: string; title: string; category: string; createdAt: string; language: string; tags: string[] }[] = [];

  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
                { fieldFilter: { field: { fieldPath: "createdAt" }, op: "GREATER_THAN_OR_EQUAL", value: { stringValue: twoDaysAgo } } },
              ],
            },
          },
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit: 100,
        },
      }),
      next: { revalidate: 600 },
    });

    if (res.ok) {
      const results = await res.json();
      articles = results
        .filter((r: { document?: unknown }) => r.document)
        .map((r: { document: { fields: Record<string, { stringValue?: string; arrayValue?: { values?: { stringValue?: string }[] } }> } }) => {
          const f = r.document.fields;
          return {
            slug: f.slug?.stringValue || "",
            title: (f.title?.stringValue || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            category: (f.category?.stringValue || "india").toLowerCase().replace(/\s+/g, "-"),
            createdAt: f.createdAt?.stringValue || new Date().toISOString(),
            language: f.language?.stringValue === "hi" ? "hi" : "en",
            tags: f.tags?.arrayValue?.values?.map((v) => v.stringValue || "") || [],
          };
        });
    }
  } catch { /* */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles
  .map(
    (a) => `  <url>
    <loc>${SITE_URL}/${a.category}/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>LoktantraVani</news:name>
        <news:language>${a.language}</news:language>
      </news:publication>
      <news:publication_date>${a.createdAt}</news:publication_date>
      <news:title>${a.title}</news:title>
      ${a.tags.length > 0 ? `<news:keywords>${a.tags.join(", ")}</news:keywords>` : ""}
    </news:news>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
