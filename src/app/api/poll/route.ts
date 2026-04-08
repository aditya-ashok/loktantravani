/**
 * GET /api/poll        — Fetch all active polls (or a specific poll by ?id=)
 * POST /api/poll       — Submit a vote { pollId, optionIndex }
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/firestore-rest";

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

function parsePollDoc(doc: { name: string; fields: Record<string, Record<string, unknown>> }) {
  const id = doc.name.split("/").pop() || "";
  const f = doc.fields || {};
  return {
    id,
    question: fromValue(f.question || {}) || "",
    questionHi: fromValue(f.questionHi || {}) || "",
    options: fromValue(f.options || {}) || [],
    votes: fromValue(f.votes || {}) || [],
    active: fromValue(f.active || {}) ?? true,
    category: fromValue(f.category || {}) || "",
    articleSlug: fromValue(f.articleSlug || {}) || "",
    totalVotes: fromValue(f.totalVotes || {}) || 0,
    voterIPs: fromValue(f.voterIPs || {}) || [],
    createdAt: fromValue(f.createdAt || {}) || "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Fetch a specific poll
    if (id) {
      const poll = await getDoc(`polls/${id}`);
      if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
      // Strip voterIPs from response
      const { voterIPs: _ips, ...safePoll } = poll as Record<string, unknown>;
      void _ips;
      return NextResponse.json({ poll: safePoll });
    }

    // Fetch active polls
    const res = await fetch(withKey(`${BASE}:runQuery`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "polls" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "active" },
              op: "EQUAL",
              value: { booleanValue: true },
            },
          },
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit: 20,
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
        const poll = parsePollDoc(r.document);
        // Strip voterIPs from response
        const { voterIPs: _ips, ...safePoll } = poll;
        void _ips;
        return safePoll;
      });

    return NextResponse.json({ polls });
  } catch (err) {
    return NextResponse.json({ polls: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pollId, optionIndex } = await req.json();
    if (!pollId || optionIndex === undefined || optionIndex === null) {
      return NextResponse.json({ error: "pollId and optionIndex required" }, { status: 400 });
    }

    // Get voter IP for dedup
    const forwarded = req.headers.get("x-forwarded-for");
    const voterIP = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Get current poll
    const poll = await getDoc(`polls/${pollId}`);
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }
    if (!(poll.active as boolean)) {
      return NextResponse.json({ error: "Poll is closed" }, { status: 400 });
    }

    // Check IP dedup
    const voterIPs = (poll.voterIPs as string[]) || [];
    if (voterIPs.includes(voterIP)) {
      return NextResponse.json({ error: "Already voted", alreadyVoted: true }, { status: 409 });
    }

    // Update votes
    const votes = (poll.votes as number[]) || [];
    const options = (poll.options as Record<string, unknown>[]) || [];
    if (optionIndex < 0 || optionIndex >= options.length) {
      return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
    }

    votes[optionIndex] = (votes[optionIndex] || 0) + 1;
    const totalVotes = votes.reduce((a: number, b: number) => a + b, 0);

    await setDoc(`polls/${pollId}`, {
      votes,
      totalVotes,
      voterIPs: [...voterIPs, voterIP],
    });

    return NextResponse.json({ success: true, votes, totalVotes });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
