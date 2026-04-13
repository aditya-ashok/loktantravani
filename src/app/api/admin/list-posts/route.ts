/**
 * GET /api/admin/list-posts?status=all|published|draft
 * List all posts using lightweight Firestore REST API
 */

import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function withKey(url: string): string {
  if (!API_KEY) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${API_KEY}`;
}

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FsValue> } }
  | { arrayValue: { values: FsValue[] } };

function fromFsValue(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) {
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = fromFsValue(val);
    }
    return obj;
  }
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFsValue);
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") || "all";

    // Build structured query
    const filters: Record<string, unknown>[] = [];
    if (status !== "all") {
      filters.push({
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: status },
        },
      });
    }

    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId: "posts" }],
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 1000,
    };

    if (filters.length > 0) {
      structuredQuery.where = filters.length === 1 ? filters[0] : { compositeFilter: { op: "AND", filters } };
    }

    const res = await fetch(withKey(`${BASE}:runQuery`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
      next: { revalidate: 30 }, // Cache for 30s to speed up admin
    });

    if (!res.ok) {
      // If index not ready, try without orderBy
      const fallbackQuery: Record<string, unknown> = {
        from: [{ collectionId: "posts" }],
        limit: 1000,
      };
      if (filters.length > 0) {
        fallbackQuery.where = filters.length === 1 ? filters[0] : { compositeFilter: { op: "AND", filters } };
      }
      const fallbackRes = await fetch(`${BASE}:runQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structuredQuery: fallbackQuery }),
        cache: "no-store",
      });
      if (!fallbackRes.ok) {
        return NextResponse.json({ posts: [] });
      }
      const fallbackResults = await fallbackRes.json();
      const posts = fallbackResults
        .filter((r: Record<string, unknown>) => r.document)
        .map((r: { document: { name: string; fields: Record<string, FsValue> } }) => {
          const id = r.document.name.split("/").pop() || "";
          const fields = r.document.fields || {};
          const data: Record<string, unknown> = { id };
          for (const [k, v] of Object.entries(fields)) {
            data[k] = fromFsValue(v);
          }
          return data;
        });
      return NextResponse.json({ posts }, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" },
      });
    }

    const results = await res.json();
    const posts = results
      .filter((r: Record<string, unknown>) => r.document)
      .map((r: { document: { name: string; fields: Record<string, FsValue> } }) => {
        const id = r.document.name.split("/").pop() || "";
        const fields = r.document.fields || {};
        const data: Record<string, unknown> = { id };
        for (const [k, v] of Object.entries(fields)) {
          data[k] = fromFsValue(v);
        }
        return data;
      });

    return NextResponse.json({ posts }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), posts: [] }, { status: 500 });
  }
}
