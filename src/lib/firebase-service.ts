import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Post, Comment, DailyEdition, ReactionType, UserProfile, UserRole } from "./types";
import { generateSlug } from "./slug";
import { estimateReadingTime } from "./utils";

// ──────────────── Posts ────────────────

const postsRef = collection(db, "posts");

export async function createPost(
  data: Omit<Post, "id" | "slug" | "readingTimeMin" | "reactions" | "viewCount" | "createdAt" | "updatedAt">
): Promise<string> {
  const slug = generateSlug(data.title);
  const now = Timestamp.now();
  const docRef = await addDoc(postsRef, {
    ...data,
    slug,
    readingTimeMin: estimateReadingTime(data.content),
    reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePost(id: string, data: Partial<Post>): Promise<void> {
  const ref = doc(db, "posts", id);
  const updates: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
  if (data.content) {
    updates.readingTimeMin = estimateReadingTime(data.content);
  }
  await updateDoc(ref, updates);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, "posts", id));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = query(postsRef, where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Post;
}

export async function getPostById(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "posts", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Post;
}

interface GetPostsOptions {
  category?: string;
  status?: string;
  author?: string;
  pageSize?: number;
  afterDoc?: DocumentSnapshot;
  orderField?: string;
}

export async function getPosts(options: GetPostsOptions = {}): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  const {
    category,
    status = "published",
    author,
    pageSize = 12,
    afterDoc,
    orderField = "createdAt",
  } = options;

  const constraints: Parameters<typeof query>[1][] = [];
  if (status) constraints.push(where("status", "==", status));
  if (category) constraints.push(where("category", "==", category));
  if (author) constraints.push(where("author", "==", author));
  constraints.push(orderBy(orderField, "desc"));
  if (afterDoc) constraints.push(startAfter(afterDoc));
  constraints.push(limit(pageSize));

  const q = query(postsRef, ...constraints);
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { posts, lastDoc };
}

export async function searchPosts(searchQuery: string): Promise<Post[]> {
  // MVP: client-side filter on title/summary (Firestore lacks native full-text search)
  const q = query(postsRef, where("status", "==", "published"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  const lower = searchQuery.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Post)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.summary.toLowerCase().includes(lower) ||
        (p.titleHi && p.titleHi.includes(searchQuery)) ||
        p.tags.some((t) => t.toLowerCase().includes(lower))
    );
}

export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, "posts", id), { viewCount: increment(1) });
}

// ──────────────── Comments ────────────────

export async function addComment(postId: string, data: Omit<Comment, "id" | "createdAt">): Promise<string> {
  const ref = collection(db, "posts", postId, "comments");
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const ref = collection(db, "posts", postId, "comments");
  const q = query(ref, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
}

// ──────────────── Reactions ────────────────

export async function addReaction(postId: string, type: ReactionType): Promise<void> {
  await updateDoc(doc(db, "posts", postId), {
    [`reactions.${type}`]: increment(1),
  });
}

// ──────────────── Daily Editions ────────────────

const editionsRef = collection(db, "editions");

export async function getDailyEdition(date: string): Promise<DailyEdition | null> {
  const q = query(editionsRef, where("date", "==", date), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as DailyEdition;
}

export async function createDailyEdition(data: Omit<DailyEdition, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(editionsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// ──────────────── Subscribers ────────────────

export async function addSubscriber(email: string): Promise<void> {
  await addDoc(collection(db, "subscribers"), {
    email,
    subscribedAt: Timestamp.now(),
  });
}

// ──────────────── User Profiles ────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function upsertUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "id" | "createdAt">> & { role?: UserRole }
): Promise<void> {
  const ref = doc(db, "users", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  } else {
    await setDoc(ref, {
      ...data,
      role: data.role || "guest",
      createdAt: Timestamp.now(),
    });
  }
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}
