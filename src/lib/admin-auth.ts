/**
 * Strict admin check for endpoints that return personal data.
 *
 * Unlike verifyAuth, this never trusts Referer/Origin headers, and never trusts
 * users/{uid}.role (the REST client can't guarantee that field is tamper-proof).
 * Accepts either the x-admin-key header or a Firebase ID token (Google or
 * email/password sign-in) for an email listed in ADMIN_EMAILS (comma-separated).
 * Firebase allows one account per email, so an existing admin's email can't be
 * claimed by someone else.
 */
import { NextRequest } from "next/server";

const DEFAULT_ADMIN_EMAILS = "mail.adityaashok@gmail.com,adityaashok.india@gmail.com,seema.ktr@gmail.com,ashoke.bms@gmail.com";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();
  if (adminKey && req.headers.get("x-admin-key") === adminKey) return true;

  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: header.slice(7) }),
        cache: "no-store",
      },
    );
    if (!res.ok) return false;
    const user = (await res.json())?.users?.[0];
    const email = String(user?.email || "").toLowerCase();
    return !!email && adminEmails().includes(email);
  } catch {
    return false;
  }
}
