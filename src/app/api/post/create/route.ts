/**
 * POST /api/post/create
 * Create a new post draft via Firestore REST API
 */

import { NextRequest, NextResponse } from "next/server";
import { createDoc, generateSlug } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const body = await req.json();
    const { title, titleHi, summary, content, category, author, imageUrl, status, language } = body;

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    // Skip data URLs for Firestore (>1MB limit per field)
    const safeImageUrl = imageUrl && imageUrl.startsWith("data:") ? "" : (imageUrl || "");
    // Strip inline base64 images from content HTML
    const safeContent = (content || "").replace(/src="data:image\/[^"]+"/g, 'src=""');

    const slug = generateSlug(title);
    const id = await createDoc("posts", {
      title,
      titleHi: titleHi || "",
      slug,
      summary: summary || "",
      content: safeContent,
      category: category || "India",
      section: "Main Feed",
      author: author || "LoktantraVani AI",
      authorRole: "agent",
      language: language || "en",
      imageUrl: safeImageUrl,
      status: status || "draft",
      tags: [(category || "india").toLowerCase().replace(/\s+/g, "-"), "ai-generated"],
      readingTimeMin: Math.ceil((content || "").split(/\s+/).length / 200),
      viewCount: 0,
      reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
      isBreaking: false,
    });

    const catSlug = (category || "India").toLowerCase().replace(/\s+/g, "-");
    return NextResponse.json({ success: true, id, slug, category: catSlug });
  } catch (error) {
    console.error("Post create failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
