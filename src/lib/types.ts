import { Timestamp } from "firebase/firestore";

export type PostCategory =
  | "IR"
  | "Politics"
  | "Tech"
  | "Geopolitics"
  | "GenZ"
  | "Ancient India"
  | "Cartoon Mandala";

export type PostSection = "Neo Bharat" | "Main Feed" | "Trending";

export type PostStatus = "draft" | "published" | "archived";

export type UserRole = "admin" | "author" | "guest";

export type ReactionType = "fire" | "india" | "bulb" | "clap";

export interface Post {
  id: string;
  slug: string;
  title: string;
  titleHi?: string;
  summary: string;
  summaryHi?: string;
  content: string;
  contentHi?: string;
  category: PostCategory;
  section: PostSection;
  author: string;
  authorRole: UserRole | "agent";
  imageUrl: string;
  status: PostStatus;
  tags: string[];
  readingTimeMin: number;
  reactions: Record<ReactionType, number>;
  viewCount: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId?: string;       // Firebase UID — present when logged in
  authorEmail?: string;    // For guest reference / moderation
  authorPhoto?: string;    // Photo URL when signed in via Google
  content: string;
  parentId?: string;
  createdAt: Timestamp | Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: Timestamp | Date;
}

export interface DailyEdition {
  id: string;
  date: string; // YYYY-MM-DD
  editorNote: string;
  editorNoteHi?: string;
  featuredPostIds: string[];
  sections: Record<string, string[]>; // section name -> post IDs
  createdAt: Timestamp | Date;
}

export interface NewsAgentJob {
  id: string;
  topic: string;
  category: PostCategory;
  status: "pending" | "processing" | "completed" | "failed";
  sources: string[];
  generatedDraft?: Partial<Post>;
  error?: string;
  createdAt: Timestamp | Date;
}
