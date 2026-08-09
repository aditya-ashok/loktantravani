/**
 * Breaking News API
 * GET — list active breaking news (within 3 hours)
 * POST — mark/unmark a post as breaking (sets breakingAt timestamp)
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function GET() {
  try {
    // Query published posts where isBreaking = true
    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "posts" }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
                { fieldFilter: { field: { fieldPath: "isBreaking" }, op: "EQUAL", value: { booleanValue: true } } },
              ],
            },
          },
          limit: 10,
        },
      }),
      cache: "no-store",
    });

    const results = res.ok ? await res.json() : [];

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const now = Date.now();

    const breaking = results
      .filter((r: Record<string, unknown>) => r.document)
      .map((r: { document: { name: string; fields: Record<string, Record<string, string>> } }) => {
        const f = r.document.fields;
        const id = r.document.name.split("/").pop() || "";
        const breakingAt = f.breakingAt?.stringValue || f.breakingAt?.timestampValue || f.createdAt?.timestampValue || f.createdAt?.stringValue || "";
        const breakingTime = breakingAt ? new Date(breakingAt).getTime() : 0;
        const isExpired = breakingTime > 0 && (now - breakingTime) > TWO_HOURS;

        return {
          id,
          title: f.title?.stringValue || "",
          titleHi: f.titleHi?.stringValue || "",
          category: f.category?.stringValue || "",
          slug: f.slug?.stringValue || "",
          imageUrl: f.imageUrl?.stringValue || "",
          breakingAt,
          isExpired,
        };
      })
      .filter((b: { isExpired: boolean }) => !b.isExpired)
      .sort((a: { breakingAt: string }, b: { breakingAt: string }) =>
        new Date(b.breakingAt || 0).getTime() - new Date(a.breakingAt || 0).getTime());

    // Ticker should never go dark: with nothing breaking in-window, run the
    // latest headlines instead (labelled LIVE on the client via `fallback`)
    if (breaking.length === 0) {
      const fb = await fetch(`${BASE}:runQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "posts" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
                  { fieldFilter: { field: { fieldPath: "createdAt" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: new Date(Date.now() - 48 * 3600 * 1000).toISOString() } } },
                ],
              },
            },
            orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
            limit: 8,
          },
        }),
        cache: "no-store",
      });
      if (fb.ok) {
        const rows = await fb.json();
        const latest = (rows || [])
          .filter((r: Record<string, unknown>) => r.document)
          .map((r: { document: { name: string; fields: Record<string, Record<string, string>> } }) => {
            const f = r.document.fields;
            return {
              id: r.document.name.split("/").pop() || "",
              title: f.title?.stringValue || "",
              titleHi: f.titleHi?.stringValue || "",
              category: f.category?.stringValue || "",
              slug: f.slug?.stringValue || "",
              imageUrl: f.imageUrl?.stringValue || "",
              breakingAt: f.createdAt?.timestampValue || f.createdAt?.stringValue || "",
              isExpired: false,
            };
          })
          .filter((b: { title: string; slug: string }) => b.title && b.slug)
          .slice(0, 6);
        return NextResponse.json(
          { breaking: latest, fallback: true },
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
        );
      }
    }

    return NextResponse.json(
      { breaking },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error), breaking: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id, isBreaking } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (isBreaking) {
      // Mark as breaking with timestamp
      await setDoc(`posts/${id}`, {
        isBreaking: true,
        breakingAt: new Date().toISOString(),
      });
    } else {
      // Unmark breaking
      await setDoc(`posts/${id}`, {
        isBreaking: false,
      });
    }

    return NextResponse.json({ success: true, id, isBreaking });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
