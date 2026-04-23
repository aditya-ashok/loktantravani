import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VaniBot from "@/components/VaniBot";
import ArticleContent from "@/components/ArticleContent";
import { getPostBySlug, getPosts } from "@/lib/data-service";
import { AUTHORS, getAuthorPhoto, getAuthorSameAs } from "@/lib/authors";

export const revalidate = 60;
export const dynamicParams = true;

const SITE_URL = "https://loktantravani.in";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article Not Found" };
  const cat = post.category.toLowerCase().replace(/\s+/g, "-");
  const url = `${SITE_URL}/${cat}/${post.slug}`;

  // Use article image directly for OG — WhatsApp/social crawlers handle Firebase URLs fine
  const fallbackImage = `${SITE_URL}/og-image.png`;
  const ogImage = (post.imageUrl || "").trim() || fallbackImage;
  const absoluteImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;

  // Handle both Date objects and ISO strings from Firestore REST
  const publishedTime = post.createdAt instanceof Date
    ? post.createdAt.toISOString()
    : typeof post.createdAt === "string"
      ? post.createdAt
      : undefined;

  return {
    title: post.title,
    description: post.summary?.slice(0, 160),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.summary?.slice(0, 160),
      url,
      type: "article",
      publishedTime,
      authors: [post.author],
      images: [{ url: absoluteImage, width: 1200, height: 630, alt: post.title }],
      siteName: "LoktantraVani",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary?.slice(0, 160),
      images: [{ url: absoluteImage, alt: post.title }],
    },
    alternates: { canonical: url },
    other: {
      "article:published_time": publishedTime || "",
      "article:author": post.author,
      "article:section": post.category,
      "article:tag": post.tags?.join(", ") || post.category,
      "news_keywords": post.tags?.join(", ") || `${post.category}, India, LoktantraVani`,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getPosts("published", 100);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 md:px-16 text-center py-48">
          <h1 className="text-6xl font-newsreader font-black mb-4 dark:text-white">404</h1>
          <p className="text-xl font-newsreader italic opacity-60 dark:text-white/60 mb-8">
            This article could not be found.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const cat = post.category.toLowerCase().replace(/\s+/g, "-");
  const articleUrl = `${SITE_URL}/${cat}/${post.slug}`;
  const createdIso = post.createdAt instanceof Date ? post.createdAt.toISOString() : typeof post.createdAt === "string" ? post.createdAt : new Date().toISOString();
  const updatedIso = post.updatedAt instanceof Date ? post.updatedAt.toISOString() : typeof post.updatedAt === "string" ? post.updatedAt : createdIso;
  const plainText = post.content ? post.content.replace(/<[^>]*>/g, "") : "";
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary?.slice(0, 200),
    image: post.imageUrl ? [post.imageUrl] : [],
    datePublished: createdIso,
    dateModified: updatedIso,
    author: [(() => {
      const profile = AUTHORS.find(a => a.name === post.author);
      const authorUrl = `${SITE_URL}/author/${encodeURIComponent(post.author)}`;
      const personSchema: Record<string, unknown> = {
        "@type": "Person",
        "@id": authorUrl,
        name: post.author,
        url: authorUrl,
        mainEntityOfPage: authorUrl,
        image: getAuthorPhoto(post.author),
      };
      if (profile) {
        personSchema.alternateName = profile.nameHi;
        personSchema.jobTitle = profile.designation;
        personSchema.description = profile.bio;
        personSchema.email = profile.email;
        personSchema.worksFor = {
          "@type": "NewsMediaOrganization",
          name: "LoktantraVani",
          url: SITE_URL,
        };
        // Real social profiles + author page URL → Google uses these to verify identity
        personSchema.sameAs = [authorUrl, ...getAuthorSameAs(post.author)];
        personSchema.knowsAbout = [profile.designation, "Indian Politics", "Journalism", post.category];
        if (profile.alumniOf) {
          personSchema.alumniOf = { "@type": "EducationalOrganization", name: profile.alumniOf };
        }
        if (profile.location) {
          personSchema.workLocation = { "@type": "Place", name: profile.location };
        }
      }
      return personSchema;
    })()],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "LoktantraVani",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    articleSection: post.category,
    keywords: post.tags?.length ? post.tags : [post.category, "India", "LoktantraVani"],
    wordCount,
    inLanguage: post.language === "hi" ? "hi-IN" : "en-IN",
    isAccessibleForFree: true,
    url: articleUrl,
    thumbnailUrl: post.imageUrl || undefined,
    copyrightHolder: {
      "@type": "Organization",
      name: "LoktantraVani",
    },
    copyrightYear: new Date(createdIso).getFullYear(),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: post.category, item: `${SITE_URL}/category/${cat}` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  return (
    <>
      <Navbar />
      {/* SEO: NewsArticle + BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ArticleContent post={post} />
      <VaniBot articleTitle={post.title} articleContext={post.content} />
      <Footer />
    </>
  );
}
