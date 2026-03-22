/**
 * POST /api/news-agent
 * Fetches RSS news for a category → generates a draft article → optionally saves to Firestore
 *
 * Body: { topic: string, category: PostCategory, autoSave?: boolean }
 * autoSave=true → immediately saves the draft to Firestore as a "draft" post
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchNewsForCategory, generateArticleDraft } from "@/lib/news-agent";
import type { PostCategory } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category, autoSave = false } = body as {
      topic: string;
      category: PostCategory;
      autoSave?: boolean;
    };

    if (!topic || !category) {
      return NextResponse.json(
        { error: "topic and category are required" },
        { status: 400 }
      );
    }

    // 1. Fetch from RSS feeds
    const newsItems = await fetchNewsForCategory(category);

    if (newsItems.length === 0) {
      return NextResponse.json(
        { error: "No news items found — RSS feeds may be rate-limited or unavailable." },
        { status: 404 }
      );
    }

    // 2. Generate draft
    const draft = {
      ...generateArticleDraft(topic, category, newsItems),
      category,
      section: "Main Feed" as const,
      author: "LoktantraVani News Agent",
      authorRole: "agent" as const,
      status: "draft" as const,
      tags: [
        category.toLowerCase().replace(/\s+/g, "-"),
        "ai-agent",
        topic.toLowerCase().replace(/\s+/g, "-"),
      ],
    };

    // 3. Auto-save to Firestore if requested (and Firebase is configured)
    let savedId: string | null = null;
    if (autoSave) {
      try {
        const { isFirebaseConfigured } = await import("@/lib/firebase");
        if (isFirebaseConfigured) {
          const { createPost } = await import("@/lib/firebase-service");
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { sources: _sources, ...draftForSave } = draft;
          savedId = await createPost({
            ...draftForSave,
            imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200",
          });

          // Log the agent job
          const { db } = await import("@/lib/firebase");
          const { collection, addDoc, Timestamp } = await import("firebase/firestore");
          await addDoc(collection(db, "newsAgentJobs"), {
            topic,
            category,
            status: "completed",
            sources: [...new Set(newsItems.map((n) => n.source))],
            generatedPostId: savedId,
            createdAt: Timestamp.now(),
          });
        }
      } catch (saveErr) {
        console.warn("Auto-save failed:", saveErr);
        // non-fatal — still return the draft
      }
    }

    return NextResponse.json({
      success: true,
      draft,
      savedId,                       // null if autoSave=false or Firebase not configured
      autoSaved: Boolean(savedId),
      metadata: {
        sourcesScanned: newsItems.length,
        feedsUsed: [...new Set(newsItems.map((n) => n.source))],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("News agent error:", error);
    return NextResponse.json(
      { error: "Failed to generate article", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news-agent
 * Returns recent agent jobs from Firestore
 */
export async function GET() {
  try {
    const { isFirebaseConfigured } = await import("@/lib/firebase");
    if (!isFirebaseConfigured) {
      return NextResponse.json({ jobs: [], note: "Firebase not configured" });
    }

    const { db } = await import("@/lib/firebase");
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
    const snap = await getDocs(
      query(collection(db, "newsAgentJobs"), orderBy("createdAt", "desc"), limit(20))
    );
    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ jobs });
  } catch (err) {
    return NextResponse.json({ jobs: [], error: String(err) });
  }
}
