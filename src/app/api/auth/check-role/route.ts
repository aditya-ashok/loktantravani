/**
 * POST /api/auth/check-role
 * Lightweight role check using Firestore REST API (no heavy SDK)
 * Body: { email: string, uid: string, name?: string, avatar?: string }
 */

import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function firestoreGet(path: string) {
  const res = await fetch(`${FIRESTORE_URL}/${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function firestoreQuery(collectionPath: string, fieldPath: string, value: string) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionPath }],
          where: {
            fieldFilter: {
              field: { fieldPath },
              op: "EQUAL",
              value: { stringValue: value },
            },
          },
          limit: 5,
        },
      }),
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  const results = await res.json();
  return results.filter((r: Record<string, unknown>) => r.document);
}

async function firestoreSet(path: string, fields: Record<string, unknown>) {
  const firestoreFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) {
      firestoreFields[k] = { nullValue: null };
    } else if (typeof v === "string") {
      firestoreFields[k] = { stringValue: v };
    } else if (typeof v === "number") {
      firestoreFields[k] = { integerValue: String(v) };
    }
  }
  // Use PATCH with updateMask for merge behavior
  const fieldPaths = Object.keys(fields).join("&updateMask.fieldPaths=");
  await fetch(
    `${FIRESTORE_URL}/${path}?updateMask.fieldPaths=${fieldPaths}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: firestoreFields }),
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, uid, name, avatar } = await req.json();
    if (!email || !uid) {
      return NextResponse.json({ role: "guest" });
    }

    let resolvedRole = "guest";

    // 1. Check by UID
    const uidDoc = await firestoreGet(`users/${uid}`);
    if (uidDoc?.fields?.role?.stringValue) {
      resolvedRole = uidDoc.fields.role.stringValue;
    }

    // 2. If still guest, check by email
    if (resolvedRole === "guest") {
      const results = await firestoreQuery("users", "email", email);
      for (const r of results) {
        const role = r.document?.fields?.role?.stringValue;
        if (role === "admin" || role === "author") {
          resolvedRole = role;
          break;
        }
      }
    }

    // 3. Upsert profile under real UID
    await firestoreSet(`users/${uid}`, {
      name: name || email.split("@")[0],
      email,
      role: resolvedRole,
      avatar: avatar || "",
    });

    // Return interests if available
    const interests = uidDoc?.fields?.interests?.arrayValue?.values?.map((v: any) => v.stringValue) || [];

    return NextResponse.json({ role: resolvedRole, interests }, {
      headers: {
        "Cache-Control": "private, max-age=60, s-maxage=60",
      }
    });
  } catch (error) {
    console.error("check-role error:", error);
    return NextResponse.json({ role: "guest", error: String(error) });
  }
}
