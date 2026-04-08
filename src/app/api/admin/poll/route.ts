/**
 * POST /api/admin/poll  — Create a new poll
 * GET  /api/admin/poll  — List all polls (admin view, includes inactive)
 * PATCH /api/admin/poll — Toggle poll active/inactive { pollId, active }
 */

import { NextRequest, NextResponse } from "next/server";
import { createDoc, setDoc } from "@/lib/firestore-rest";
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
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) {
    const arr = v.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values || []).map(fromValue);
  }
  if ("mapValue" in v) {
    const map = v.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(map.fields || {})) {
      obj[k] = fromValue(val);
    }
    return obj;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  try {
    const { question, questionHi, options, category, articleSlug } = await req.json();
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "question and at least 2 options required" }, { status: 400 });
    }

    const pollData = {
      question,
      questionHi: questionHi || "",
      options, // [{text, textHi}]
      votes: options.map(() => 0),
      totalVotes: 0,
      voterIPs: [],
      active: true,
      category: category || "",
      articleSlug: articleSlug || "",
    };

    const id = await createDoc("polls", pollData);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
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
          from: [{ collectionId: "polls" }],
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit: 100,
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ polls: [], error: "Firestore query failed" });
    }

    const results = await res.json();
    const polls = results
      .filter((r: Record<string, unknown>) => r.document)
      .map((r: { document: { name: string; fields: Record<string, Record<string, unknown>> } }) => {
        const id = r.document.name.split("/").pop() || "";
        const f = r.document.fields || {};
        return {
          id,
          question: fromValue(f.question || {}) || "",
          questionHi: fromValue(f.questionHi || {}) || "",
          options: fromValue(f.options || {}) || [],
          votes: fromValue(f.votes || {}) || [],
          totalVotes: fromValue(f.totalVotes || {}) || 0,
          active: fromValue(f.active || {}) ?? true,
          category: fromValue(f.category || {}) || "",
          articleSlug: fromValue(f.articleSlug || {}) || "",
          createdAt: fromValue(f.createdAt || {}) || "",
        };
      });

    return NextResponse.json({ polls });
  } catch (err) {
    return NextResponse.json({ polls: [], error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  try {
    const { pollId, active } = await req.json();
    if (!pollId || active === undefined) {
      return NextResponse.json({ error: "pollId and active required" }, { status: 400 });
    }

    await setDoc(`polls/${pollId}`, { active: !!active });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
