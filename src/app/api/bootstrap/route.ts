/**
 * POST /api/bootstrap
 * Creates author accounts and Firestore profiles.
 * Body (optional): { batch?: 1|2|3 }
 * batch=1: first 3 accounts, batch=2: next 3, batch=3: last 1 + set extra admin
 * No body = tries all but may timeout
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ALL_AUTHORS = [
  { name: "Aditya Ashok", email: "aditya.ashok@gmail.com", role: "admin", designation: "Founder & Editor-in-Chief" },
  { name: "Ashok Kumar Choudhary", email: "ashok.choudhary@gmail.com", role: "admin", designation: "Managing Editor" },
  { name: "Sanjay Saraogi", email: "sanjay.saraogi@gmail.com", role: "author", designation: "Business & Economy Editor" },
  { name: "Adarsh Ashok", email: "adarsh.ashok@gmail.com", role: "author", designation: "Tech & Defence Correspondent" },
  { name: "Seema Choudhary", email: "seema.choudhary@gmail.com", role: "author", designation: "Cities & Culture Editor" },
  { name: "Shreya Rahul Anand", email: "shreya.anand@gmail.com", role: "author", designation: "Sr. Correspondent — Politics" },
  { name: "Admin", email: "admin@loktantravani.com", role: "admin", designation: "System Administrator" },
];

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.DEFAULT_USER_PASSWORD) {
    return NextResponse.json({ error: "Set DEFAULT_USER_PASSWORD env var" }, { status: 500 });
  }

  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "ChangeMe@2026";

  const body = await req.json().catch(() => ({}));
  const batch = (body.batch as number) || 0;

  let authors = ALL_AUTHORS;
  if (batch === 1) authors = ALL_AUTHORS.slice(0, 3);
  else if (batch === 2) authors = ALL_AUTHORS.slice(3, 6);
  else if (batch === 3) authors = ALL_AUTHORS.slice(6);

  const results: { name: string; email: string; auth: string; profile: string }[] = [];

  try {
    const { auth, db, isFirebaseConfigured } = await import("@/lib/firebase");
    if (!isFirebaseConfigured) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const { doc, setDoc, Timestamp } = await import("firebase/firestore");

    for (const author of authors) {
      let uid = "";
      let authStatus = "";

      try {
        const cred = await createUserWithEmailAndPassword(auth, author.email, defaultPassword);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: author.name });
        authStatus = "created";
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "auth/email-already-in-use") {
          try {
            const cred = await signInWithEmailAndPassword(auth, author.email, defaultPassword);
            uid = cred.user.uid;
            authStatus = "exists-ok";
          } catch {
            authStatus = "exists-wrong-password";
          }
        } else {
          authStatus = `error: ${code}`;
        }
      }

      let profileStatus = "skipped";
      if (uid) {
        try {
          await setDoc(doc(db, "users", uid), {
            name: author.name,
            email: author.email,
            role: author.role,
            designation: author.designation,
            bio: "",
            avatar: "",
            createdAt: Timestamp.now(),
          }, { merge: true });
          profileStatus = "ok";
        } catch (e: unknown) {
          profileStatus = `error: ${(e as Error).message}`;
        }
      }

      results.push({ name: author.name, email: author.email, auth: authStatus, profile: profileStatus });
      await delay(1000);
    }

    // If batch 3 or no batch, also promote adityaashok.india@gmail.com
    if (batch === 0 || batch === 3) {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const q = query(collection(db, "users"), where("email", "==", "adityaashok.india@gmail.com"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await setDoc(snap.docs[0].ref, { role: "admin" }, { merge: true });
          results.push({ name: "Aditya (Google)", email: "adityaashok.india@gmail.com", auth: "existing", profile: "admin-set" });
        }
      } catch { /* */ }
    }

    return NextResponse.json({ success: true, batch, results });
  } catch (error) {
    return NextResponse.json({ error: String(error), results }, { status: 500 });
  }
}
