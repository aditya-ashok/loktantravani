/**
 * Server-side API authentication helper.
 * Verifies Firebase ID token or admin key for protected endpoints.
 */
import { NextRequest } from "next/server";

const ADMIN_KEY = process.env.ADMIN_API_KEY || "";

/**
 * Verify the request has valid authentication.
 * Accepts either:
 * 1. x-admin-key header matching ADMIN_API_KEY env var
 * 2. Authorization: Bearer <firebase-id-token> (verified via Firebase REST API)
 *
 * Returns { authorized: true, role: "admin"|"user", email?: string } or { authorized: false, error: string }
 */
export async function verifyAuth(req: NextRequest): Promise<{ authorized: boolean; role?: string; email?: string; error?: string }> {
  // Method 1: Admin API key (for cron jobs, internal calls)
  const adminKey = req.headers.get("x-admin-key");
  if (ADMIN_KEY && adminKey === ADMIN_KEY) {
    return { authorized: true, role: "admin" };
  }

  // Method 2: Firebase ID token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      // Verify token via Google's tokeninfo endpoint
      const res = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.users?.[0];
        if (user) {
          return { authorized: true, role: "user", email: user.email };
        }
      }
    } catch {
      // Token verification failed
    }
  }

  // Method 3: Same-origin requests from admin panel (browser fetch calls)
  // These come with cookies and referer from the same domain
  const referer = req.headers.get("referer") || "";
  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  const isSameOrigin = (referer && (referer.includes(host) || referer.includes("loktantravani.in") || referer.includes("localhost")))
    || (origin && (origin.includes(host) || origin.includes("loktantravani.in") || origin.includes("localhost")));
  if (isSameOrigin) {
    return { authorized: true, role: "admin" };
  }

  // No valid auth
  if (!ADMIN_KEY) {
    // If ADMIN_API_KEY not configured, allow requests (backward compatibility during setup)
    return { authorized: true, role: "admin" };
  }

  return { authorized: false, error: "Unauthorized. Provide x-admin-key header or Authorization: Bearer <token>" };
}

export function unauthorized(error = "Unauthorized") {
  return new Response(JSON.stringify({ error }), { status: 401, headers: { "Content-Type": "application/json" } });
}
