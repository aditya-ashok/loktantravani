import type { UserRole } from "./types";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "posts.create",
    "posts.edit",
    "posts.delete",
    "posts.publish",
    "posts.unpublish",
    "comments.moderate",
    "comments.delete",
    "daily.create",
    "daily.edit",
    "agent.run",
    "agent.approve",
    "users.manage",
    "analytics.view",
  ],
  author: [
    "posts.create",
    "posts.editOwn",
    "posts.submitForReview",
    "comments.create",
    "comments.deleteOwn",
  ],
  guest: [
    "comments.create",
    "reactions.add",
    "bookmarks.manage",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<UserRole, { en: string; hi: string }> = {
  admin: { en: "Chief Editor", hi: "प्रधान संपादक" },
  author: { en: "Author", hi: "लेखक" },
  guest: { en: "Reader", hi: "पाठक" },
};
