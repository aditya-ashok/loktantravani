/**
 * POST /api/admin/update-post
 * Update any fields on a post using Firestore REST API
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Remove empty/undefined fields
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null) update[k] = v;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    await setDoc(`posts/${id}`, update);
    return NextResponse.json({ success: true, message: `Post ${id} updated` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
