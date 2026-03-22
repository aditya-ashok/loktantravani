"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Reply, Trash2, LogIn, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import type { Comment } from "@/lib/types";

interface CommentSectionProps {
  postId: string;
}

function timeAgoShort(date: Date | { seconds: number }): string {
  const d =
    date instanceof Date ? date : new Date((date as { seconds: number }).seconds * 1000);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ photo, name, size = 8 }: { photo?: string | null; name: string; size?: number }) {
  if (photo) {
    return (
      <div
        style={{ width: size * 4, height: size * 4 }}
        className="rounded-full overflow-hidden flex-shrink-0 border-2 border-black/10 dark:border-white/10"
      >
        <Image
          src={photo}
          alt={name}
          width={size * 4}
          height={size * 4}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      style={{ width: size * 4, height: size * 4 }}
      className="bg-primary text-white flex-shrink-0 flex items-center justify-center font-inter font-black text-sm"
    >
      {(name[0] || "?").toUpperCase()}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  t,
  isReply = false,
}: {
  comment: Comment;
  currentUserId: string | null;
  onReply: (id: string, author: string) => void;
  onDelete: (comment: Comment) => void;
  t: (en: string, hi?: string) => string;
  isReply?: boolean;
}) {
  const isOwn = Boolean(currentUserId && comment.authorId === currentUserId);
  return (
    <div>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <Avatar photo={comment.authorPhoto} name={comment.author} size={isReply ? 6 : 8} />
        <span className={cn("font-inter font-black dark:text-white", isReply ? "text-xs" : "text-sm")}>
          {comment.author}
        </span>
        {comment.authorId && (
          <span className="text-[9px] font-inter font-black text-primary uppercase border border-primary/40 px-1.5 py-0.5">
            ✓ {t("verified", "सत्यापित")}
          </span>
        )}
        <span className="text-[10px] font-inter font-bold opacity-40 dark:text-white/40">
          {timeAgoShort(comment.createdAt as Date)}
        </span>
      </div>
      <p className={cn("font-inter leading-relaxed mb-3 dark:text-white/80", isReply ? "text-xs" : "text-sm")}>
        {comment.content}
      </p>
      <div className="flex items-center gap-4">
        {!isReply && (
          <button
            onClick={() => onReply(comment.id, comment.author)}
            className="text-[10px] font-inter font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
          >
            <Reply className="w-3 h-3" /> {t("Reply", "जवाब दें")}
          </button>
        )}
        {isOwn && (
          <button
            onClick={() => onDelete(comment)}
            className="text-[10px] font-inter font-black uppercase tracking-widest opacity-30 hover:text-red-500 hover:opacity-100 transition-all flex items-center gap-1 dark:text-white"
          >
            <Trash2 className="w-3 h-3" /> {t("Delete", "हटाएं")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { t } = useLanguage();
  const { isLoggedIn, userName, userEmail, userPhotoUrl, userId, signInWithGoogle, signOut } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const { getComments } = await import("@/lib/firebase-service");
      const data = await getComments(postId);
      setComments(data);
    } catch {
      // Firebase not configured — empty list
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); } finally { setSigningIn(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authorName = isLoggedIn ? userName : guestName.trim();
    if (!authorName || !content.trim()) return;
    setSubmitting(true);

    const optimistic: Comment = {
      id: `local-${Date.now()}`,
      postId,
      author: authorName,
      authorId: userId || undefined,
      authorEmail: isLoggedIn ? (userEmail || undefined) : (guestEmail.trim() || undefined),
      authorPhoto: userPhotoUrl || undefined,
      content: content.trim(),
      parentId: replyTo || undefined,
      createdAt: new Date(),
    };

    setComments((prev) => [...prev, optimistic]);
    setContent("");
    setReplyTo(null);
    setReplyAuthor("");

    try {
      const { addComment } = await import("@/lib/firebase-service");
      const savedId = await addComment(postId, {
        postId,
        author: optimistic.author,
        authorId: optimistic.authorId,
        authorEmail: optimistic.authorEmail,
        authorPhoto: optimistic.authorPhoto,
        content: optimistic.content,
        parentId: optimistic.parentId,
      });
      setComments((prev) => prev.map((c) => (c.id === optimistic.id ? { ...c, id: savedId } : c)));
    } catch {
      // keep local — Firebase not configured
    }
    setSubmitting(false);
  };

  const handleDelete = async (comment: Comment) => {
    if (!userId || comment.authorId !== userId) return;
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    try {
      const { deleteComment } = await import("@/lib/firebase-service");
      await deleteComment(postId, comment.id);
    } catch { /* ignore */ }
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const getReplies = (pid: string) => comments.filter((c) => c.parentId === pid);

  return (
    <section className="mt-16 pt-12 border-t-4 border-double border-black dark:border-white/20">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-newsreader font-black uppercase tracking-tight dark:text-white">
            {t("Discourse", "विमर्श")}
          </h3>
          <span className="text-xs font-inter font-black text-primary">
            {comments.length} {t("comments", "टिप्पणियाँ")}
          </span>
        </div>

        {/* Auth pill */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Avatar photo={userPhotoUrl} name={userName} size={8} />
            <div>
              <p className="text-xs font-inter font-black dark:text-white">{userName}</p>
              {userEmail && (
                <p className="text-[10px] font-inter opacity-40 dark:text-white/40">{userEmail}</p>
              )}
            </div>
            <button
              onClick={signOut}
              className="ml-2 flex items-center gap-1 text-[10px] font-inter font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity dark:text-white"
            >
              <LogOut className="w-3 h-3" /> {t("Sign out", "साइन आउट")}
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white/30 text-[10px] font-inter font-black uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-white transition-all dark:text-white disabled:opacity-50"
          >
            {signingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
            {t("Sign in with Google", "Google से साइन इन")}
          </button>
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-12 p-6 border-2 border-black dark:border-white/20 bg-[#fff9f3] dark:bg-white/5">
        {replyTo && (
          <div className="flex items-center gap-2 mb-4 text-xs font-inter font-bold text-primary">
            <Reply className="w-4 h-4" />
            {t("Replying to", "जवाब दे रहे हैं")} <strong>{replyAuthor}</strong>
            <button
              type="button"
              onClick={() => { setReplyTo(null); setReplyAuthor(""); }}
              className="underline ml-2 text-black dark:text-white opacity-60 hover:opacity-100"
            >
              {t("Cancel", "रद्द करें")}
            </button>
          </div>
        )}

        {/* Guest fields */}
        {!isLoggedIn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t("Your name *", "आपका नाम *")}
              className="px-4 py-3 border-2 border-black dark:border-white/30 font-inter text-sm bg-white dark:bg-transparent dark:text-white placeholder:opacity-40"
              required
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder={t("Email (optional, private)", "ईमेल (वैकल्पिक, गोपनीय)")}
              className="px-4 py-3 border-2 border-black dark:border-white/30 font-inter text-sm bg-white dark:bg-transparent dark:text-white placeholder:opacity-40"
            />
          </div>
        )}

        {/* Logged-in user greeting */}
        {isLoggedIn && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar photo={userPhotoUrl} name={userName} size={8} />
            <span className="text-xs font-inter font-bold dark:text-white">
              {t("Commenting as", "टिप्पणी कर रहे हैं")} <strong>{userName}</strong>
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("Join the discourse...", "विमर्श में शामिल हों...")}
            rows={3}
            className="flex-1 px-4 py-3 border-2 border-black dark:border-white/30 font-inter text-sm bg-white dark:bg-transparent dark:text-white placeholder:opacity-40 resize-none"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black font-inter font-black hover:bg-primary transition-colors self-end disabled:opacity-50 flex items-center"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {!isLoggedIn && (
          <p className="mt-3 text-[10px] font-inter opacity-40 dark:text-white/40">
            {t(
              "Sign in with Google for a verified badge on your comments.",
              "Google से साइन इन करें और verified बैज पाएं।"
            )}
          </p>
        )}
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 flex-shrink-0 bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-black/10 dark:bg-white/10 w-32 rounded" />
                <div className="h-3 bg-black/5 dark:bg-white/5 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm font-newsreader italic opacity-40 dark:text-white/40 text-center py-8">
          {t("Be the first to join the discourse.", "विमर्श शुरू करने वाले पहले व्यक्ति बनें।")}
        </p>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {topLevel.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-l-4 border-black/10 dark:border-white/10 pl-6"
              >
                <CommentItem
                  comment={comment}
                  currentUserId={userId}
                  onReply={(id, author) => { setReplyTo(id); setReplyAuthor(author); }}
                  onDelete={handleDelete}
                  t={t}
                />
                {getReplies(comment.id).map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-8 mt-4 border-l-4 border-primary/20 pl-6"
                  >
                    <CommentItem
                      comment={reply}
                      currentUserId={userId}
                      onReply={(id, author) => { setReplyTo(id); setReplyAuthor(author); }}
                      onDelete={handleDelete}
                      t={t}
                      isReply
                    />
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
