/* eslint-disable no-undef */
// Firebase Messaging Service Worker — handles background push notifications

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase config is injected at registration time via query params,
// but we also support hardcoded fallback for older browsers
const urlParams = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: urlParams.get("apiKey") || "",
  authDomain: urlParams.get("authDomain") || "",
  projectId: urlParams.get("projectId") || "",
  storageBucket: urlParams.get("storageBucket") || "",
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, image, link } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || "LoktantraVani", {
    body: body || data.body || "New article published",
    icon: icon || "/icon-192.png",
    image: image || data.image || undefined,
    badge: "/favicon-32.png",
    tag: data.postId || "lv-notification",
    renotify: true,
    data: {
      url: link || data.url || "/",
    },
    actions: [
      { action: "open", title: "Read Now" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});
