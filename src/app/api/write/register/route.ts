/**
 * POST /api/write/register
 * Upgrade guest → contributor + save extended profile
 */
import { NextRequest, NextResponse } from "next/server";
import { setDoc, getDoc } from "@/lib/firestore-rest";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, name, email, education, age, gender, college, linkedin, twitter, bio, photoUrl } = body;

    if (!uid || !email || !name) {
      return NextResponse.json({ error: "uid, name, and email required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await getDoc(`users/${uid}`);
    const currentRole = existing?.role as string;

    // Don't downgrade admin/author to contributor
    if (currentRole === "admin" || currentRole === "author") {
      return NextResponse.json({ success: true, role: currentRole, message: "Already has elevated role" });
    }

    await setDoc(`users/${uid}`, {
      name,
      email,
      role: "contributor",
      education: education || "",
      age: age || null,
      gender: gender || "",
      college: college || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      bio: bio || "",
      photoUrl: photoUrl || "",
    });

    return NextResponse.json({ success: true, role: "contributor" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
