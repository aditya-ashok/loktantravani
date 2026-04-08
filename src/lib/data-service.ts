import { Post } from "./types";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fromFsValue(v: any): Promise<any> {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) {
    const obj: any = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = await fromFsValue(val);
    }
    return obj;
  }
  if ("arrayValue" in v) {
    return Promise.all((v.arrayValue.values || []).map(fromFsValue));
  }
  return null;
}

export async function getPosts(status: string = "published", limit: number = 50, language?: string): Promise<Post[]> {
  try {
    // Simple status filter — language filtering done client-side to avoid needing composite index
    const structuredQuery = {
      from: [{ collectionId: "posts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: status },
        },
      },
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 250, // Fetch enough to cover language filtering, slice to limit later
    };

    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
      next: { revalidate: 120 }, // Cache for 2 min, on-demand revalidation for instant updates
    });

    if (!res.ok) return [];

    const results = await res.json();
    const fbPosts = (await Promise.all(
      results
        .filter((r: any) => r.document)
        .map(async (r: any) => {
          const id = r.document.name.split("/").pop();
          const fields = r.document.fields;
          const data: any = { id };
          for (const [k, v] of Object.entries(fields)) {
            data[k] = await fromFsValue(v);
          }
          return {
            ...data,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            isBreaking: !!data.isBreaking,
          } as Post;
        })
    ))
    // Sort client-side by createdAt descending (Firestore orderBy may not work on string fields without composite index)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Strict language separation: en on main site, hi on hindi subdomain
    if (language === "hi") {
      return fbPosts.filter(p => {
        const lang = (p as unknown as Record<string, unknown>).language as string;
        return lang === "hi";
      }).slice(0, limit);
    }
    if (language === "en") {
      return fbPosts.filter(p => {
        const lang = (p as unknown as Record<string, unknown>).language as string;
        return !lang || lang === "en";
      }).slice(0, limit);
    }
    return fbPosts.slice(0, limit);
  } catch (e) {
    console.error("fetch server posts error:", e);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const structuredQuery = {
      from: [{ collectionId: "posts" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "slug" },
          op: "EQUAL",
          value: { stringValue: slug },
        },
      },
      limit: 1,
    };

    const res = await fetch(`${BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
      next: { revalidate: 3600 } // ISR for 1 hour
    });

    if (!res.ok) return null;

    const results = await res.json();
    let doc = results.find((r: any) => r.document);

    // Fallback: if no slug match, try fetching by document ID
    if (!doc) {
      const idRes = await fetch(`${BASE}/posts/${slug}`, { next: { revalidate: 3600 } });
      if (!idRes.ok) return null;
      const idDoc = await idRes.json();
      if (!idDoc.fields) return null;
      doc = { document: idDoc };
    }

    const id = doc.document.name.split("/").pop();
    const fields = doc.document.fields;
    const data: any = { id };
    for (const [k, v] of Object.entries(fields)) {
      data[k] = await fromFsValue(v);
    }
    const post = {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      isBreaking: !!data.isBreaking,
    } as Post & { authorPhoto?: string; authorDesignation?: string; authorBio?: string; authorNameHi?: string; authorDesignationHi?: string; authorBioHi?: string };

    // Fetch author info from users collection (exact name match)
    try {
      const authorName = (post.author || "").split(" — ")[0].trim();
      if (authorName) {
        const authorRes = await fetch(`${BASE}:runQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: "users" }],
              where: { fieldFilter: { field: { fieldPath: "name" }, op: "EQUAL", value: { stringValue: authorName } } },
              limit: 5,
            },
          }),
          next: { revalidate: 60 },
        });
        if (authorRes.ok) {
          const authorResults = await authorRes.json();
          const authorDocs = authorResults.filter((r: any) => r.document);
          // Pick the most complete profile: has bio + photo > has photo > first
          const bestDoc = authorDocs.find((r: any) =>
            r.document.fields?.bio?.stringValue && r.document.fields?.photoUrl?.stringValue
          ) || authorDocs.find((r: any) =>
            r.document.fields?.bio?.stringValue
          ) || authorDocs.find((r: any) =>
            r.document.fields?.photoUrl?.stringValue
          ) || authorDocs[0];
          if (bestDoc) {
            const af = bestDoc.document.fields;
            post.authorPhoto = af.photoUrl?.stringValue || af.avatar?.stringValue || "";
            post.authorDesignation = af.designation?.stringValue || "";
            post.authorBio = af.bio?.stringValue || "";
            post.authorNameHi = af.nameHi?.stringValue || "";
            post.authorDesignationHi = af.designationHi?.stringValue || "";
            post.authorBioHi = af.bioHi?.stringValue || "";
          }
        }
      }
    } catch { /* author fetch is best-effort */ }

    return post;
  } catch (e) {
    console.error("fetch server post error:", e);
    return null;
  }
}
