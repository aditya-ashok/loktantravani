import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function firestoreSet(path: string, fields: Record<string, any>) {
  const firestoreFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) {
      firestoreFields[k] = { nullValue: null };
    } else if (Array.isArray(v)) {
      firestoreFields[k] = { arrayValue: { values: v.map(i => ({ stringValue: String(i) })) } };
    } else if (typeof v === "string") {
      firestoreFields[k] = { stringValue: v };
    } else if (typeof v === "number") {
      firestoreFields[k] = { integerValue: String(v) };
    }
  }
  
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
    const { uid, interests } = await req.json();
    if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

    await firestoreSet(`users/${uid}`, {
      interests: interests || [],
      lastOnboarded: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
