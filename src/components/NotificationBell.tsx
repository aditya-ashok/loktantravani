"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { SEED_POSTS } from "@/lib/seed-data";

interface Notification {
  id: string;
  title: string;
  type: "breaking" | "trending" | "update";
  time: string;
  read: boolean;
}

export default function NotificationBell() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulate notifications from seed posts
    const notifs: Notification[] = SEED_POSTS.slice(0, 5).map((post, i) => ({
      id: `notif-${i}`,
      title: lang === "hi" && post.titleHi ? post.titleHi : post.title,
      type: i === 0 ? "breaking" : i < 3 ? "trending" : "update",
      time: `${i + 1}h ago`,
      read: i > 2,
    }));
    setNotifications(notifs);
  }, [lang]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
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
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
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
                            : notif.type === "trending"
                            ? "text-primary"
                            : "text-black/40 dark:text-white/40"
                        }`}
                      >
                        {notif.type === "breaking" ? "BREAKING" : notif.type === "trending" ? "TRENDING" : "UPDATE"}
                      </span>
                      <p className="text-sm font-newsreader font-bold mt-0.5 leading-tight dark:text-white">
                        {notif.title}
                      </p>
                      <span className="text-[9px] font-inter opacity-30 dark:text-white/30">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
