/**
 * POST /api/admin/fix-image-urls
 * Fixes broken Firebase Storage URLs that contain newlines
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    // Get all posts
    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          limit: 500,
        },
      }),
      cache: "no-store",
    });

    const results = await res.json();
    let fixed = 0;

    for (const r of results) {
      if (!r.document) continue;
      const id = r.document.name.split("/").pop() || "";
      const fields = r.document.fields || {};
      const imageUrl = fields.imageUrl?.stringValue || "";

      // Check for newlines, spaces, or other issues in URL
      if (imageUrl && (imageUrl.includes("\n") || imageUrl.includes("\r") || imageUrl.includes(" "))) {
        const cleanUrl = imageUrl.replace(/[\n\r\s]/g, "");
        await setDoc(`posts/${id}`, { imageUrl: cleanUrl });
        fixed++;
      }
    }

    return NextResponse.json({ success: true, fixed, total: results.filter((r: Record<string, unknown>) => r.document).length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
