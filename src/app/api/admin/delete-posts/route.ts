/**
 * POST /api/admin/delete-posts
 * Delete posts using lightweight Firestore REST API
 * Body: { ids: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteDocRest } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    const results: { id: string; status: string }[] = [];
    for (const id of ids) {
      try {
        await deleteDocRest(`posts/${id}`);
        results.push({ id, status: "deleted" });
      } catch (err) {
        results.push({ id, status: `error: ${(err as Error).message}` });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: results.filter(r => r.status === "deleted").length,
      total: ids.length,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
