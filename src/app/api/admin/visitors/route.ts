import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/api-auth";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function withKey(url: string): string {
  if (!API_KEY) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${API_KEY}`;
}

/** GET /api/admin/visitors — returns today's visitor stats */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.authorized) return unauthorized(auth.error);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Get today's visitor log doc
  const docPath = `visitors/${today}`;
  const res = await fetch(withKey(`${BASE}/${docPath}`), { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json({ date: today, totalVisits: 0, uniqueIPs: 0, locations: {}, visitors: [] });
  }

  const doc = await res.json();
  if (!doc.fields) {
    return NextResponse.json({ date: today, totalVisits: 0, uniqueIPs: 0, locations: {}, visitors: [] });
  }

  const totalVisits = doc.fields.totalVisits?.integerValue ? parseInt(doc.fields.totalVisits.integerValue) : 0;
  const uniqueIPs = doc.fields.uniqueIPs?.integerValue ? parseInt(doc.fields.uniqueIPs.integerValue) : 0;

  // Parse locations map
  const locations: Record<string, number> = {};
  if (doc.fields.locations?.mapValue?.fields) {
    for (const [loc, val] of Object.entries(doc.fields.locations.mapValue.fields as Record<string, { integerValue?: string }>)) {
      locations[loc] = parseInt(val.integerValue || "0");
    }
  }

  // Parse recent visitors array
  const visitors: { ip: string; city: string; country: string; time: string }[] = [];
  if (doc.fields.recentVisitors?.arrayValue?.values) {
    for (const v of doc.fields.recentVisitors.arrayValue.values as { mapValue?: { fields: Record<string, { stringValue?: string }> } }[]) {
      if (v.mapValue?.fields) {
        visitors.push({
          ip: v.mapValue.fields.ip?.stringValue || "",
          city: v.mapValue.fields.city?.stringValue || "",
          country: v.mapValue.fields.country?.stringValue || "",
          time: v.mapValue.fields.time?.stringValue || "",
        });
      }
    }
  }

  return NextResponse.json({ date: today, totalVisits, uniqueIPs, locations, visitors: visitors.slice(-50) });
}
