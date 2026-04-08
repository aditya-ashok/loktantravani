import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { collection, doc, getDocs, Timestamp, addDoc, deleteDoc } from "firebase/firestore";

// FCM HTTP v1 API requires OAuth2, so we use the legacy HTTP API with server key
// Set FIREBASE_SERVER_KEY in your environment (from Firebase Console > Cloud Messaging > Server key)
const FCM_ENDPOINT = "https://fcm.googleapis.com/fcm/send";

interface SendRequest {
  title: string;
  body: string;
  image?: string;
  url?: string;
  postId?: string;
  topic?: string; // "all", "breaking", etc.
}

async function sendToToken(serverKey: string, token: string, notification: SendRequest) {
  const res = await fetch(FCM_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: "/icon-192.png",
        image: notification.image,
        click_action: notification.url || "/",
      },
      data: {
        url: notification.url || "/",
        postId: notification.postId || "",
        image: notification.image || "",
        title: notification.title,
        body: notification.body,
      },
      webpush: {
        fcm_options: {
          link: notification.url || "/",
        },
      },
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "FIREBASE_SERVER_KEY not configured" },
        { status: 500 }
      );
    }

    const body: SendRequest = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const db = getDb();

    // Get all stored FCM tokens
    const tokensRef = collection(db, "fcm_tokens");
    const snap = await getDocs(tokensRef);

    if (snap.empty) {
      return NextResponse.json({ sent: 0, message: "No subscribers" });
    }

    let sent = 0;
    let failed = 0;
    const staleTokens: string[] = [];

    // Send to all tokens (batch in parallel, max 50 concurrent)
    const tokens = snap.docs.map((d) => ({ id: d.id, token: d.data().token as string }));
    const batchSize = 50;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async ({ id, token }) => {
          const result = await sendToToken(serverKey, token, body);
          if (result.success === 1) {
            sent++;
          } else {
            failed++;
            // Check if token is invalid/expired
            if (result.results?.[0]?.error === "NotRegistered" || result.results?.[0]?.error === "InvalidRegistration") {
              staleTokens.push(id);
            }
          }
        })
      );
    }

    // Clean up stale tokens
    for (const id of staleTokens) {
      try {
        await deleteDoc(doc(db, "fcm_tokens", id));
      } catch {}
    }

    // Log notification in Firestore
    await addDoc(collection(db, "notifications"), {
      type: body.postId ? "article" : "breaking",
      title: body.title,
      message: body.body,
      link: body.url || "/",
      image: body.image || "",
      sentTo: sent,
      failed,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ sent, failed, staleRemoved: staleTokens.length });
  } catch (err) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
