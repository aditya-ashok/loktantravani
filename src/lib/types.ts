import { Timestamp } from "firebase/firestore";

export type PostCategory =
  | "India"
  | "World"
  | "IR"
  | "Politics"
  | "Geopolitics"
  | "Economy"
  | "Markets"
  | "Sports"
  | "Tech"
  | "Defence"
  | "Culture"
  | "Opinion"
  | "Cities"
  | "West Asia"
  | "Viral"
  | "Ancient India"
  | "Lok Post";

export type PostSection = "Neo Bharat" | "Main Feed" | "Trending" | "Special";

export type PostStatus = "draft" | "published" | "archived" | "user-submitted" | "rejected";

export type UserRole = "admin" | "author" | "contributor" | "guest";

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
  language?: "en" | "hi" | "bilingual";
  authorPhoto?: string;
  authorDesignation?: string;
  authorBio?: string;
  isBreaking?: boolean;
  submittedBy?: string;
  submittedByEmail?: string;
  submittedByName?: string;
  rejectionReason?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export function postFromFirestore(data: any): Post {
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    titleHi: data.titleHi,
    summary: data.summary,
    summaryHi: data.summaryHi,
    content: data.content,
    contentHi: data.contentHi,
    category: data.category,
    section: data.section,
    author: data.author,
    authorRole: data.authorRole,
    imageUrl: data.imageUrl,
    status: data.status,
    tags: data.tags || [],
    readingTimeMin: data.readingTimeMin || 0,
    reactions: data.reactions || {},
    viewCount: data.viewCount || 0,
    submittedBy: data.submittedBy,
    submittedByEmail: data.submittedByEmail,
    submittedByName: data.submittedByName,
    rejectionReason: data.rejectionReason,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
    isBreaking: !!data.isBreaking,
  } as Post;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  authorPhoto?: string;
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
  bioHi?: string;
  designation?: string;
  designationHi?: string;
  nameHi?: string;
  city?: string;
  twitter?: string;
  linkedin?: string;
  education?: string;
  age?: number;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  college?: string;
  photoUrl?: string;
  createdAt: Timestamp | Date;
}

export interface DailyEdition {
  id: string;
  date: string;
  editorNote: string;
  editorNoteHi?: string;
  featuredPostIds: string[];
  sections: Record<string, string[]>;
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
