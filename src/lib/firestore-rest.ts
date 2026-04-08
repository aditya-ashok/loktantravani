/**
 * Lightweight Firestore REST API client for Vercel serverless functions.
 * The Firebase Web SDK is too heavy (times out on cold start).
 * This uses plain fetch() — fast, no dependencies.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Append API key to URL for authenticated REST calls */
function withKey(url: string): string {
  if (!API_KEY) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}key=${API_KEY}`;
}

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FsValue> } }
  | { arrayValue: { values: FsValue[] } };

/** Convert a JS value to Firestore REST value */
function toFsValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === "object") {
    const fields: Record<string, FsValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      fields[k] = toFsValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

/** Convert Firestore REST value back to JS */
function fromFsValue(v: FsValue): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) {
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = fromFsValue(val);
    }
    return obj;
  }
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFsValue);
  return null;
}

/** Convert a plain JS object to Firestore fields */
function toFields(data: Record<string, unknown>): Record<string, FsValue> {
  const fields: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFsValue(v);
  }
  return fields;
}

/** Convert Firestore fields to plain JS object */
function fromFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFsValue(v);
  }
  return obj;
}

/** GET a single document */
export async function getDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(withKey(`${BASE}/${path}`), { cache: "no-store" });
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  const data = fromFields(doc.fields);
  // Extract ID from document name
  const id = doc.name?.split("/").pop() || "";
  return { id, ...data };
}

/** Query documents by a single field */
export async function queryByField(
  collectionPath: string,
  fieldPath: string,
  value: string,
  limitCount = 10
): Promise<Record<string, unknown>[]> {
  const res = await fetch(withKey(`${BASE}:runQuery`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionPath }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: "EQUAL",
            value: { stringValue: value },
          },
        },
        limit: limitCount,
      },
    }),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const results = await res.json();
  return results
    .filter((r: Record<string, unknown>) => r.document)
    .map((r: { document: { name: string; fields: Record<string, FsValue> } }) => {
      const id = r.document.name.split("/").pop() || "";
      return { id, ...fromFields(r.document.fields) };
    });
}

/** Create a document (auto-generated ID) */
export async function createDoc(
  collectionPath: string,
  data: Record<string, unknown>
): Promise<string> {
  const fields = toFields({ ...data, createdAt: new Date(), updatedAt: new Date() });
  const res = await fetch(withKey(`${BASE}/${collectionPath}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore create failed: ${err}`);
  }
  const doc = await res.json();
  return doc.name?.split("/").pop() || "";
}

/** Set/merge a document at a specific path */
export async function setDoc(
  path: string,
  data: Record<string, unknown>,
  merge = true
): Promise<void> {
  const fields = toFields({ ...data, updatedAt: new Date() });
  let url = `${BASE}/${path}`;
  if (merge) {
    const fieldPaths = Object.keys(data).concat("updatedAt").map(k => `updateMask.fieldPaths=${k}`).join("&");
    url += `?${fieldPaths}`;
  }
  const res = await fetch(withKey(url), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore update failed (${res.status}): ${err}`);
  }
}

/** Delete a document */
export async function deleteDocRest(path: string): Promise<void> {
  const res = await fetch(withKey(`${BASE}/${path}`), { method: "DELETE" });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore delete failed (${res.status}): ${err}`);
  }
}

/** Get a unique stock image URL based on category and topic */
export function getStockImageUrl(category: string, topic: string = ""): string {
  // Curated Unsplash photo IDs per category (high-quality editorial photos)
  const CATEGORY_IMAGES: Record<string, string[]> = {
    India: [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200", // Taj Mahal
      "https://images.unsplash.com/photo-1532664189809-02133fee698d?w=1200", // Indian flag
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200", // Delhi
      "https://images.unsplash.com/photo-1609340667114-237cf29e5395?w=1200", // India gate
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200", // Mumbai
    ],
    World: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200", // Globe
      "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200", // UN
      "https://images.unsplash.com/photo-1589262804704-c5aa9e6def89?w=1200", // World map
      "https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=1200", // International
    ],
    Politics: [
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200", // Parliament
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200", // Democracy
      "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1200", // Government
      "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=1200", // Capitol
    ],
    Geopolitics: [
      "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1200", // Diplomacy
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200", // Globe night
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200", // Strategy
      "https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=1200", // Map
    ],
    Economy: [
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200", // Stock market
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200", // Currency
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200", // Business
      "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1200", // Finance
    ],
    Sports: [
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200", // Cricket
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200", // Stadium
      "https://images.unsplash.com/photo-1461896836934-bd45ba1fbeb0?w=1200", // Sport
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200", // Football
    ],
    Tech: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200", // Circuit
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200", // Robot
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200", // Code
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200", // Cyber
    ],
    Defence: [
      "https://images.unsplash.com/photo-1580197924879-52de78a172c6?w=1200", // Fighter jet
      "https://images.unsplash.com/photo-1579912437766-7896df6d3cd3?w=1200", // Military
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200", // Navy
      "https://images.unsplash.com/photo-1517554558809-9b4971b38f01?w=1200", // Army
    ],
    Opinion: [
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200", // Books
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200", // Writing
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200", // Pen
    ],
    Cities: [
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200", // Delhi
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200", // Mumbai
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200", // Bangalore
      "https://images.unsplash.com/photo-1558431382-27e303142255?w=1200", // Kolkata
    ],
    "West Asia": [
      "https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=1200", // Middle East
      "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=1200", // Mosque
      "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=1200", // Desert city
    ],
    "Lok Post": [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200", // Art
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200", // Painting
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200", // Abstract
    ],
  };

  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["India"];
  // Use topic hash to pick a consistent but varied image
  const hash = (topic + category).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

/** Generate a URL-friendly slug — always English ASCII, never Hindi */
export function generateSlug(title: string): string {
  // Strip all non-ASCII, keep only a-z, 0-9, spaces, hyphens
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  // If slug is empty (pure Hindi title), use "article" as fallback
  const slug = base.slice(0, 80) || "article";
  return slug + "-" + Date.now().toString(36);
}
