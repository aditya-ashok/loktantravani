/**
 * Authors Management API
 * GET — list all authors/users
 * POST — create or update author
 * DELETE — remove author
 */

import { NextRequest, NextResponse } from "next/server";
import { createDoc, setDoc, deleteDocRest, queryByField } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    // List all users from Firestore
    const res = await fetch(`${BASE}/users?pageSize=100`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ authors: [] });
    const data = await res.json();

    const authors = (data.documents || []).map((doc: Record<string, unknown>) => {
      const fields = doc.fields as Record<string, Record<string, unknown>> || {};
      const id = (doc.name as string)?.split("/").pop() || "";
      const extract = (key: string) => {
        const f = fields[key];
        if (!f) return "";
        if ("stringValue" in f) return f.stringValue as string;
        if ("integerValue" in f) return f.integerValue as string;
        return "";
      };
      return {
        id,
        name: extract("name"),
        nameHi: extract("nameHi"),
        email: extract("email"),
        role: extract("role"),
        bio: extract("bio"),
        bioHi: extract("bioHi"),
        designation: extract("designation"),
        designationHi: extract("designationHi"),
        education: extract("education"),
        age: extract("age"),
        gender: extract("gender"),
        college: extract("college"),
        linkedin: extract("linkedin"),
        twitter: extract("twitter"),
        photoUrl: extract("photoUrl"),
      };
    });

    return NextResponse.json({ authors });
  } catch (error) {
    return NextResponse.json({ error: String(error), authors: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const body = await req.json();
    const { id, name, nameHi, email, role, bio, bioHi, designation, designationHi, education, age, gender, college, linkedin, twitter, photoUrl } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    const profileData: Record<string, unknown> = {
      name, email,
      nameHi: nameHi || "",
      role: role || "author",
      bio: bio || "",
      bioHi: bioHi || "",
      designation: designation || "",
      designationHi: designationHi || "",
      education: education || "",
      age: age || "",
      gender: gender || "",
      college: college || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      photoUrl: photoUrl || "",
    };

    if (id) {
      // Update existing
      await setDoc(`users/${id}`, profileData);
      return NextResponse.json({ success: true, message: `Updated ${name}`, id });
    } else {
      // Create new — use email-based ID
      const docId = email.replace(/[@.]/g, "_");
      await setDoc(`users/${docId}`, { ...profileData, createdAt: new Date().toISOString() }, false);

      // Also set role via the set-role API pattern
      const existing = await queryByField("users", "email", email, 1);
      if (existing.length === 0) {
        await createDoc("users", profileData);
      }

      return NextResponse.json({ success: true, message: `Created ${name}`, id: docId });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteDocRest(`users/${id}`);
    return NextResponse.json({ success: true, message: `Deleted ${id}` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
