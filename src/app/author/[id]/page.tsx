import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PenLine } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogCard from "@/components/BlogCard";
import { AUTHORS, getAuthorPhoto, getAuthorSameAs } from "@/lib/authors";
import { getPosts } from "@/lib/data-service";
import type { Post } from "@/lib/types";

export const revalidate = 300; // 5 min ISR

const SITE_URL = "https://loktantravani.in";

function slugify(name: string): string {
  return encodeURIComponent(name);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const authorName = decodeURIComponent(id);
  const author = AUTHORS.find((a) => a.name === authorName);
  const url = `${SITE_URL}/author/${slugify(authorName)}`;

  return {
    title: `${authorName} — Author at LoktantraVani`,
    description: author?.bio || `Read articles by ${authorName} on LoktantraVani — India's First AI Newspaper.`,
    authors: [{ name: authorName, url }],
    openGraph: {
      title: `${authorName} — LoktantraVani`,
      description: author?.bio || `Articles and analysis by ${authorName}`,
      url,
      type: "profile",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      siteName: "LoktantraVani",
    },
    twitter: {
      card: "summary",
      title: `${authorName} — LoktantraVani`,
      description: author?.bio || `Articles by ${authorName}`,
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return AUTHORS.filter((a) => a.name !== "Admin").map((a) => ({
    id: slugify(a.name),
  }));
}

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorName = decodeURIComponent(id);
  const author = AUTHORS.find((a) => a.name === authorName);

  // Fetch author's articles from Firestore
  const allPosts = await getPosts("published", 200);
  const authorPosts = allPosts.filter((p) => p.author === authorName);

  const totalViews = authorPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const totalReactions = authorPosts.reduce(
    (sum, p) => sum + Object.values(p.reactions || {}).reduce((a: number, b: unknown) => a + (typeof b === "number" ? b : 0), 0),
    0
  );

  const authorUrl = `${SITE_URL}/author/${slugify(authorName)}`;

  // Person JSON-LD for Google Knowledge Panel
  const personJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": authorUrl,
    name: authorName,
    alternateName: author?.nameHi || undefined,
    url: authorUrl,
    mainEntityOfPage: authorUrl,
    image: getAuthorPhoto(authorName),
    jobTitle: author?.designation || "Contributing Author",
    description: author?.bio || `Author at LoktantraVani — India's First AI Newspaper`,
    email: author?.email,
    worksFor: {
      "@type": "NewsMediaOrganization",
      name: "LoktantraVani",
      url: SITE_URL,
      logo: `${SITE_URL}/og-image.png`,
    },
    // Combine author page URL + all real social profiles
    sameAs: [authorUrl, ...getAuthorSameAs(authorName)],
    knowsAbout: author ? [author.designation, "Indian Politics", "Journalism", "India News"] : ["Journalism"],
    nationality: { "@type": "Country", name: "India" },
  };
  if (author?.alumniOf) {
    personJsonLd.alumniOf = { "@type": "EducationalOrganization", name: author.alumniOf };
  }
  if (author?.location) {
    personJsonLd.workLocation = { "@type": "Place", name: author.location };
  }

  // ProfilePage wrapper — Google's recommended type for author/profile pages
  const profilePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: "2026-01-01T00:00:00Z",
    dateModified: new Date().toISOString(),
    mainEntity: personJsonLd,
  };

  // CollectionPage JSON-LD
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles by ${authorName}`,
    description: `All articles written by ${authorName} on LoktantraVani`,
    url: `${SITE_URL}/author/${slugify(authorName)}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: authorPosts.length,
      itemListElement: authorPosts.slice(0, 10).map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${post.category.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <main className="min-h-screen pt-[220px] pb-24 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-8 md:px-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[10px] font-inter font-black uppercase tracking-widest opacity-40 hover:text-primary mb-8 dark:text-white/40"
          >
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>

          {/* Author Header */}
          <div className="mb-16 pb-8 border-b-4 border-double border-black dark:border-white/20">
            <div className="flex items-start gap-6">
              {author?.photo ? (
                <img
                  src={getAuthorPhoto(authorName)}
                  alt={authorName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary shrink-0"
                  itemProp="image"
                />
              ) : (
                <div className="w-20 h-20 bg-primary text-white flex items-center justify-center font-newsreader font-black text-3xl shrink-0 rounded-full">
                  {authorName[0]}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-newsreader font-black dark:text-white">
                  {authorName}
                </h1>
                {author?.nameHi && (
                  <p className="text-lg font-bold hindi opacity-50 dark:text-white/50 mt-1">
                    {author.nameHi}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <PenLine className="w-4 h-4 text-primary" />
                  <span className="text-xs font-inter font-black uppercase tracking-widest text-primary">
                    {author?.designation || "Contributing Author"}
                  </span>
                </div>
                {author?.bio && (
                  <p className="text-base font-newsreader italic opacity-60 mt-4 max-w-2xl dark:text-white/60">
                    {author.bio}
                  </p>
                )}
                {author?.social && Object.keys(author.social).length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {author.social.twitter && (
                      <a href={author.social.twitter} target="_blank" rel="noopener noreferrer me" className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary border border-black/20 dark:border-white/20 px-3 py-1.5 transition-colors">
                        Twitter / X
                      </a>
                    )}
                    {author.social.linkedin && (
                      <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer me" className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary border border-black/20 dark:border-white/20 px-3 py-1.5 transition-colors">
                        LinkedIn
                      </a>
                    )}
                    {author.social.instagram && (
                      <a href={author.social.instagram} target="_blank" rel="noopener noreferrer me" className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary border border-black/20 dark:border-white/20 px-3 py-1.5 transition-colors">
                        Instagram
                      </a>
                    )}
                    {author.social.youtube && (
                      <a href={author.social.youtube} target="_blank" rel="noopener noreferrer me" className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary border border-black/20 dark:border-white/20 px-3 py-1.5 transition-colors">
                        YouTube
                      </a>
                    )}
                    {author.social.website && (
                      <a href={author.social.website} target="_blank" rel="noopener noreferrer me" className="text-[10px] font-inter font-bold uppercase tracking-widest text-[var(--nyt-gray)] hover:text-primary border border-black/20 dark:border-white/20 px-3 py-1.5 transition-colors">
                        Website
                      </a>
                    )}
                  </div>
                )}
                <div className="flex gap-8 mt-6">
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">
                      {authorPosts.length}
                    </p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      Articles
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">
                      {totalViews.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      Total Views
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-newsreader font-black dark:text-white">
                      {totalReactions.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-inter font-black uppercase tracking-widest opacity-40 dark:text-white/40">
                      Reactions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Author's Articles */}
          <h2 className="text-sm font-inter font-black uppercase tracking-widest mb-6 dark:text-white">
            Articles by {authorName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {authorPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {authorPosts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-2xl font-newsreader font-bold italic opacity-40 dark:text-white/40">
                No articles found for this author.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
