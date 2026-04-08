/**
 * GET /api/post/[slug]
 * Fetch a single post by slug using lightweight Firestore REST API
 */

import { NextRequest, NextResponse } from "next/server";
import { queryByField } from "@/lib/firestore-rest";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const results = await queryByField("posts", "slug", slug, 1);
    if (results.length === 0) {
      return NextResponse.json({ post: null }, { status: 404 });
    }

    return NextResponse.json({ post: results[0] }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
