/**
 * POST /api/admin/set-role
 * Sets a user's role using lightweight Firestore REST API
 * Body: { email: string, role: "admin" | "author" | "guest" }
 */

import { NextRequest, NextResponse } from "next/server";
import { queryByField, setDoc, createDoc } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "email and role required" }, { status: 400 });
    }
    if (!["admin", "author", "contributor", "guest"].includes(role)) {
      return NextResponse.json({ error: "role must be admin, author, contributor, or guest" }, { status: 400 });
    }

    // Find user by email
    const users = await queryByField("users", "email", email, 1);

    if (users.length === 0) {
      // Create profile on-the-fly
      const id = await createDoc("users", { email, name: email.split("@")[0], role });
      return NextResponse.json({ success: true, message: `Created ${email} as ${role}`, uid: id });
    }

    // Update existing
    const userId = users[0].id as string;
    await setDoc(`users/${userId}`, { role });
    return NextResponse.json({ success: true, message: `${email} is now ${role}`, uid: userId });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
