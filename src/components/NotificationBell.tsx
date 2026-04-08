"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, BellRing } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useNotifications } from "@/lib/use-notifications";
import { isFirebaseConfigured } from "@/lib/firebase";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "breaking" | "article" | "update";
  time: string;
  read: boolean;
  url?: string;
  image?: string;
}

export default function NotificationBell() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState<Notification | null>(null);

  // Handle foreground FCM messages
  const handleForeground = useCallback(
    (payload: { title: string; body: string; image?: string; url?: string; postId?: string }) => {
      const notif: Notification = {
        id: `fcm-${Date.now()}`,
        title: payload.title,
        body: payload.body,
        type: payload.url?.includes("breaking") ? "breaking" : "article",
        time: "Just now",
        read: false,
        url: payload.url,
        image: payload.image,
      };
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setShowToast(notif);
      setTimeout(() => setShowToast(null), 5000);
    },
    []
  );

  const { permission, supported, requestPermission } = useNotifications(handleForeground);

  // Load recent notifications from Firestore on mount
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    (async () => {
      try {
        const { getDb } = await import("@/lib/firebase");
        const { collection, query, orderBy, limit, getDocs } = await import("firebase/firestore");
        const db = getDb();
        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
        const snap = await getDocs(q);
        const notifs: Notification[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || "",
            body: data.message || "",
            type: data.type === "breaking" ? "breaking" : "article",
            time: data.createdAt?.toDate ? formatTimeAgo(data.createdAt.toDate()) : "",
            read: false,
            url: data.link,
            image: data.image,
          };
        });
        setNotifications(notifs);
      } catch {
        // Firestore not available — OK
      }
    })();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleNotifClick = (notif: Notification) => {
    markRead(notif.id);
    if (notif.url) window.location.href = notif.url;
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => {
            setOpen(!open);
            // Auto-request permission on first bell click
            if (permission === "default" && supported) requestPermission();
          }}
          className="relative p-2 hover:bg-primary/10 transition-colors"
        >
          <Bell className="w-5 h-5 text-black dark:text-white hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[9px] font-inter font-black flex items-center justify-center rounded-full animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
                <h4 className="text-xs font-inter font-black uppercase tracking-widest dark:text-white">
                  {t("Notifications", "सूचनाएं")}
                </h4>
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 opacity-40 hover:opacity-100 dark:text-white" />
                </button>
              </div>

              {/* Permission prompt */}
              {supported && permission === "default" && (
                <button
                  onClick={requestPermission}
                  className="w-full px-4 py-3 bg-primary/10 text-left border-b border-black/10 dark:border-white/10 hover:bg-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-inter font-bold text-primary">
                        {t("Enable Push Notifications", "पुश सूचनाएं सक्षम करें")}
                      </p>
                      <p className="text-[10px] font-inter opacity-60 dark:text-white/60">
                        {t("Get breaking news alerts instantly", "ब्रेकिंग न्यूज़ की तुरंत सूचना पाएं")}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 mx-auto opacity-20 dark:text-white/20" />
                    <p className="text-xs font-inter opacity-40 mt-2 dark:text-white/40">
                      {t("No notifications yet", "अभी कोई सूचना नहीं")}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-black/5 dark:border-white/5 hover:bg-primary/5 transition-colors ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                        )}
                        <div className={notif.read ? "ml-5" : ""}>
                          <span
                            className={`text-[8px] font-inter font-black uppercase tracking-widest ${
                              notif.type === "breaking"
                                ? "text-red-500"
                                : notif.type === "article"
                                ? "text-primary"
                                : "text-black/40 dark:text-white/40"
                            }`}
                          >
                            {notif.type === "breaking" ? "BREAKING" : notif.type === "article" ? "NEW ARTICLE" : "UPDATE"}
                          </span>
                          <p className="text-sm font-newsreader font-bold mt-0.5 leading-tight dark:text-white">
                            {notif.title}
                          </p>
                          {notif.body && (
                            <p className="text-[10px] font-inter opacity-50 mt-0.5 line-clamp-2 dark:text-white/50">
                              {notif.body}
                            </p>
                          )}
                          <span className="text-[9px] font-inter opacity-30 dark:text-white/30">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Foreground toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-4 left-1/2 z-[200] w-[90vw] max-w-md bg-white dark:bg-[#1a1a1a] border-2 border-primary shadow-2xl cursor-pointer"
            onClick={() => {
              if (showToast.url) window.location.href = showToast.url;
              setShowToast(null);
            }}
          >
            <div className="h-1 bg-primary" />
            <div className="px-4 py-3 flex items-start gap-3">
              <BellRing className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-inter font-black uppercase tracking-widest text-primary">
                  {showToast.type === "breaking" ? "BREAKING NEWS" : "NEW ARTICLE"}
                </p>
                <p className="text-sm font-newsreader font-bold leading-tight dark:text-white">
                  {showToast.title}
                </p>
                {showToast.body && (
                  <p className="text-xs font-inter opacity-60 mt-0.5 line-clamp-1 dark:text-white/60">
                    {showToast.body}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowToast(null); }}
                className="shrink-0"
              >
                <X className="w-4 h-4 opacity-40 hover:opacity-100 dark:text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
