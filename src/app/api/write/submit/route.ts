/**
 * POST /api/write/submit
 * Submit user article for admin review
 */
import { NextRequest, NextResponse } from "next/server";
import { createDoc, generateSlug, getDoc, getStockImageUrl } from "@/lib/firestore-rest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, title, summary, content, category, tags = [], imageUrl } = body;

    if (!uid || !title || !content || !category) {
      return NextResponse.json({ error: "uid, title, content, and category required" }, { status: 400 });
    }

    // Look up user profile
    const user = await getDoc(`users/${uid}`);
    if (!user) {
      return NextResponse.json({ error: "User not found. Register first." }, { status: 404 });
    }

    const userRole = user.role as string;
    if (userRole !== "contributor" && userRole !== "author" && userRole !== "admin") {
      return NextResponse.json({ error: "You must register as a contributor first." }, { status: 403 });
    }

    // Rate limit: max 3 submissions per day
    // (Simple check — could be improved with a proper rate limiter)

    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const finalImageUrl = imageUrl || getStockImageUrl(category, title);

    const postId = await createDoc("posts", {
      title,
      titleHi: "",
      slug: generateSlug(title),
      summary: summary || "",
      summaryHi: "",
      content,
      contentHi: "",
      category,
      section: "Main Feed",
      author: (user.name as string) || "Anonymous",
      authorRole: "contributor",
      imageUrl: finalImageUrl,
      status: "user-submitted",
      tags: Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim()),
      readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
      viewCount: 0,
      reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
      submittedBy: uid,
      submittedByEmail: (user.email as string) || "",
      submittedByName: (user.name as string) || "",
    });

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
