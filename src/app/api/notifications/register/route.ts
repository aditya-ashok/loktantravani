import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, Timestamp } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const db = getDb();
    const tokensRef = collection(db, "fcm_tokens");

    // Check if token already exists
    const existing = query(tokensRef, where("token", "==", token));
    const snap = await getDocs(existing);

    if (!snap.empty) {
      // Update last-seen timestamp
      await updateDoc(snap.docs[0].ref, { lastSeen: Timestamp.now() });
      return NextResponse.json({ ok: true, status: "updated" });
    }

    // Store new token
    await addDoc(tokensRef, {
      token,
      createdAt: Timestamp.now(),
      lastSeen: Timestamp.now(),
      platform: req.headers.get("user-agent")?.includes("Mobile") ? "mobile" : "desktop",
    });

    return NextResponse.json({ ok: true, status: "registered" });
  } catch (err) {
    console.error("Token registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
