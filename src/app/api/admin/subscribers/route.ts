/**
 * GET /api/admin/subscribers — List all subscribers
 * DELETE /api/admin/subscribers — Remove a subscriber by document ID
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteDocRest } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

function withKey(url: string) {
  return API_KEY ? `${url}${url.includes("?") ? "&" : "?"}key=${API_KEY}` : url;
}

function fromValue(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue as string, 10);
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("doubleValue" in v) return v.doubleValue;
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const res = await fetch(withKey(`${BASE}:runQuery`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "subscribers" }],
          orderBy: [{ field: { fieldPath: "subscribedAt" }, direction: "DESCENDING" }],
          limit: 500,
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ subscribers: [], error: "Firestore query failed" });
    }

    const results = await res.json();
    const subscribers = results
      .filter((r: Record<string, unknown>) => r.document)
      .map((r: { document: { name: string; fields: Record<string, Record<string, unknown>> } }) => {
        const id = r.document.name.split("/").pop() || "";
        const fields = r.document.fields || {};
        return {
          id,
          email: fromValue(fields.email || {}) || "",
          name: fromValue(fields.name || {}) || "",
          subscribedAt: fromValue(fields.subscribedAt || {}) || "",
          active: fromValue(fields.active || {}) ?? true,
        };
      });

    return NextResponse.json({ subscribers, count: subscribers.length });
  } catch (err) {
    return NextResponse.json({ subscribers: [], error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await deleteDocRest(`subscribers/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
