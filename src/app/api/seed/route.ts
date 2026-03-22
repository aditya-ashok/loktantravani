/**
 * POST /api/seed
 * Seeds Firestore with demo posts, a daily edition, and sample subscribers.
 * Protected by a secret key — set SEED_SECRET in .env.local
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/seed \
 *        -H "x-seed-secret: your_secret_here"
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { SEED_POSTS } from "@/lib/seed-data";
import { generateSlug } from "@/lib/slug";
import { estimateReadingTime } from "@/lib/utils";

export async function POST(req: NextRequest) {
  // Guard: only run when Firebase is configured
  if (!isFirebaseConfigured) {
    return NextResponse.json(
      { error: "Firebase not configured — fill in .env.local first." },
      { status: 503 }
    );
  }

  // Optional secret guard (set SEED_SECRET=anything in .env.local)
  const secret = process.env.SEED_SECRET;
  if (secret) {
    const provided = req.headers.get("x-seed-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const postsRef = collection(db, "posts");

    // Check if already seeded
    const existing = await getDocs(query(postsRef, limit(1)));
    if (!existing.empty) {
      return NextResponse.json({
        message: "Database already has posts — skipping seed.",
        count: 0,
      });
    }

    const now = Timestamp.now();
    let seeded = 0;

    for (let i = 0; i < SEED_POSTS.length; i++) {
      const p = SEED_POSTS[i];
      const id = `seed-post-${i + 1}`;
      const slug = p.slug || generateSlug(p.title);

      await setDoc(doc(postsRef, id), {
        ...p,
        id,
        slug,
        readingTimeMin: estimateReadingTime(p.content),
        reactions: { fire: Math.floor(Math.random() * 120), india: Math.floor(Math.random() * 200), bulb: Math.floor(Math.random() * 80), clap: Math.floor(Math.random() * 60) },
        viewCount: Math.floor(Math.random() * 5000) + 100,
        status: "published",
        createdAt: Timestamp.fromMillis(now.toMillis() - i * 3_600_000 * (i + 1)),
        updatedAt: now,
      });
      seeded++;
    }

    // Seed a daily edition
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(collection(db, "editions"), today), {
      date: today,
      editorNote: "Welcome to LoktantraVani — the voice of Neo Bharat. Today's edition covers geopolitics, India's tech rise, and the ancient roots of modern democracy.",
      editorNoteHi: "लोकतंत्रवाणी में आपका स्वागत है — नव भारत की आवाज़। आज के अंक में भू-राजनीति, भारत की तकनीकी उड़ान और आधुनिक लोकतंत्र की प्राचीन जड़ें।",
      featuredPostIds: ["seed-post-1", "seed-post-2", "seed-post-3"],
      sections: {
        "Geopolitics": ["seed-post-1", "seed-post-4"],
        "Politics": ["seed-post-2", "seed-post-5"],
        "Tech": ["seed-post-3", "seed-post-6"],
        "Bihar": ["seed-post-7"],
        "Delhi NCR": ["seed-post-8"],
        "North East": ["seed-post-9"],
        "Patna": ["seed-post-10"],
      },
      createdAt: now,
    });

    // Seed a sample notification
    await setDoc(doc(collection(db, "notifications"), "notif-1"), {
      type: "breaking",
      title: "Breaking: New Policy Announced",
      titleHi: "ब्रेकिंग: नई नीति की घोषणा",
      message: "India announces landmark digital governance policy",
      link: "/blog/seed-post-1",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded} posts + 1 daily edition + 1 notification into Firestore.`,
      count: seeded,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Seed failed", detail: String(err) },
      { status: 500 }
    );
  }
}
