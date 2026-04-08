/**
 * Ads Management API — Firestore backed
 * GET — list all ads sorted by priority
 * POST — create or update ad
 * DELETE — remove ad
 */

import { NextRequest, NextResponse } from "next/server";
import { createDoc, setDoc, deleteDocRest } from "@/lib/firestore-rest";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsValue = { stringValue?: string; integerValue?: string; booleanValue?: boolean; doubleValue?: number };

function ext(fields: Record<string, FsValue>, key: string): string {
  const f = fields[key];
  if (!f) return "";
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.integerValue !== undefined) return f.integerValue;
  if (f.booleanValue !== undefined) return String(f.booleanValue);
  if (f.doubleValue !== undefined) return String(f.doubleValue);
  return "";
}

export async function GET() {
  try {
    const res = await fetch(`${BASE}/ads?pageSize=100`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ads: [] });
    const data = await res.json();
    const ads = (data.documents || []).map((doc: { name: string; fields: Record<string, FsValue> }) => {
      const f = doc.fields || {};
      return {
        id: doc.name.split("/").pop() || "",
        title: ext(f, "title"),
        brand: ext(f, "brand"),
        size: ext(f, "size"),
        imageUrl: ext(f, "imageUrl"),
        link: ext(f, "link"),
        content: ext(f, "content"),
        priority: parseInt(ext(f, "priority") || "5", 10),
        active: ext(f, "active") === "true",
        placement: ext(f, "placement") || "between-articles",
        location: ext(f, "location") || "pan-india",
        locationRadius: parseInt(ext(f, "locationRadius") || "0", 10),
        locationStates: ext(f, "locationStates") ? ext(f, "locationStates").split(",") : [],
      };
    }).sort((a: { priority: number }, b: { priority: number }) => b.priority - a.priority);
    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: String(error), ads: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, brand, size, imageUrl, link, content, priority, active, placement, location, locationRadius, locationStates } = body;
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    const adData: Record<string, unknown> = {
      title, brand: brand || "", size: size || "banner-728x90",
      imageUrl: imageUrl || "", link: link || "", content: content || "",
      priority: priority ?? 5, active: active ?? true,
      placement: placement || "between-articles",
      location: location || "pan-india",
      locationRadius: locationRadius || 0,
      locationStates: locationStates || [],
    };

    if (id) {
      await setDoc(`ads/${id}`, adData);
      return NextResponse.json({ success: true, id });
    } else {
      const newId = await createDoc("ads", adData);
      return NextResponse.json({ success: true, id: newId });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteDocRest(`ads/${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
