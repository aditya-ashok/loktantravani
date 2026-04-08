/**
 * POST /api/seed-authors
 * Creates author accounts in Firebase Auth + Firestore user profiles.
 * Safe to call multiple times — skips existing accounts.
 */

import { NextResponse } from "next/server";
import { AUTHORS } from "@/lib/authors";

export async function POST() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_SEED) {
    return NextResponse.json({ error: "Seed endpoints disabled in production. Set ALLOW_SEED=1 to enable." }, { status: 403 });
  }

  try {
    const { isFirebaseConfigured } = await import("@/lib/firebase");
    if (!isFirebaseConfigured) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const { auth } = await import("@/lib/firebase");
    const { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } = await import("firebase/auth");
    const { upsertUserProfile, setUserRole } = await import("@/lib/firebase-service");

    const results: { name: string; email: string; status: string }[] = [];

    for (const author of AUTHORS) {
      try {
        // Try to create the account
        const cred = await createUserWithEmailAndPassword(auth, author.email, process.env.DEFAULT_USER_PASSWORD || "ChangeMe@2026");
        await updateProfile(cred.user, { displayName: author.name });

        // Set Firestore profile
        await upsertUserProfile(cred.user.uid, {
          name: author.name,
          email: author.email,
          bio: author.bio,
        });
        await setUserRole(cred.user.uid, author.role);

        results.push({ name: author.name, email: author.email, status: "created" });
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "auth/email-already-in-use") {
          // Account exists — try to sign in and ensure profile is set
          try {
            const cred = await signInWithEmailAndPassword(auth, author.email, process.env.DEFAULT_USER_PASSWORD || "ChangeMe@2026");
            await upsertUserProfile(cred.user.uid, {
              name: author.name,
              email: author.email,
              bio: author.bio,
            });
            await setUserRole(cred.user.uid, author.role);
            results.push({ name: author.name, email: author.email, status: "exists — profile updated" });
          } catch {
            results.push({ name: author.name, email: author.email, status: "exists — could not update" });
          }
        } else {
          results.push({ name: author.name, email: author.email, status: `error: ${code || String(err)}` });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} authors`,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
