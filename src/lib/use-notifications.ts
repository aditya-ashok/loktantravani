"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getSafeMessaging, isFirebaseConfigured } from "./firebase";

interface NotificationPayload {
  title: string;
  body: string;
  image?: string;
  url?: string;
  postId?: string;
}

/**
 * Hook to manage FCM push notifications:
 * - Registers service worker
 * - Requests permission + gets token
 * - Listens for foreground messages
 * - Stores token server-side
 */
export function useNotifications(onForegroundMessage?: (payload: NotificationPayload) => void) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const registered = useRef(false);

  // Check support
  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      isFirebaseConfigured;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  // Register service worker + set up foreground listener
  useEffect(() => {
    if (!supported || registered.current) return;
    registered.current = true;

    (async () => {
      try {
        // Build SW URL with Firebase config as query params
        const params = new URLSearchParams({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        });

        await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${params.toString()}`
        );

        // Set up foreground message listener
        const messaging = await getSafeMessaging();
        if (messaging && onForegroundMessage) {
          const { onMessage } = await import("firebase/messaging");
          onMessage(messaging, (payload) => {
            const n = payload.notification;
            const d = payload.data;
            onForegroundMessage({
              title: n?.title || d?.title || "LoktantraVani",
              body: n?.body || d?.body || "",
              image: n?.image || d?.image,
              url: d?.url,
              postId: d?.postId,
            });
          });
        }
      } catch (err) {
        console.warn("FCM setup failed:", err);
      }
    })();
  }, [supported, onForegroundMessage]);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!supported) return null;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") return null;

      const messaging = await getSafeMessaging();
      if (!messaging) return null;

      const { getToken } = await import("firebase/messaging");

      // Get the VAPID key from env
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      const registration = await navigator.serviceWorker.ready;
      const fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      setToken(fcmToken);

      // Store token server-side
      if (fcmToken) {
        await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        }).catch(() => {});
      }

      return fcmToken;
    } catch (err) {
      console.warn("FCM token request failed:", err);
      return null;
    }
  }, [supported]);

  return { permission, token, supported, requestPermission };
}
