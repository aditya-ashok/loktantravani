/**
 * POST /api/admin/publish
 * Manage post status: publish, unpublish, mark breaking
 * Body: { id: string, unpublish?: boolean, setBreaking?: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { setDoc, getDoc, queryByField } from "@/lib/firestore-rest";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);
  try {
    const { id, unpublish, setBreaking } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Toggle breaking news
    if (setBreaking !== undefined) {
      await setDoc(`posts/${id}`, { isBreaking: setBreaking });

      // Notify subscribers about breaking news
      if (setBreaking) {
        const origin = req.nextUrl.origin;
        fetch(`${origin}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "🔴 BREAKING NEWS",
            body: "Breaking news alert on LoktantraVani!",
            url: origin,
            postId: id,
          }),
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: `Post ${id} breaking=${setBreaking}` });
    }

    // Unpublish
    if (unpublish) {
      await setDoc(`posts/${id}`, { status: "draft" });
      return NextResponse.json({ success: true, message: `Post ${id} unpublished` });
    }

    // Publish
    await setDoc(`posts/${id}`, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });

    // Email the author that their piece is live — contributors get their
    // submission email; house authors resolve via the users collection.
    try {
      const post = await getDoc(`posts/${id}`);
      if (post) {
        let email = (post.submittedByEmail as string) || "";
        const authorName = ((post.author as string) || "").split(" — ")[0].trim();
        if (!email && authorName) {
          const matches = await queryByField("users", "name", authorName, 5);
          email = (matches.find(m => (m.email as string)?.includes("@"))?.email as string) || "";
        }
        if (email) {
          await fetch(`${req.nextUrl.origin}/api/write/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "approved",
              email,
              name: (post.submittedByName as string) || authorName,
              title: post.title,
              slug: post.slug,
            }),
          });
        }
      }
    } catch { /* email is best-effort */ }

    // Send push notification to subscribers (fire-and-forget)
    const origin = req.nextUrl.origin;
    fetch(`${origin}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New on LoktantraVani",
        body: "A new article has been published. Tap to read!",
        url: `${origin}`,
        postId: id,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, message: `Post ${id} published` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
