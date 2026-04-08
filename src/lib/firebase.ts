import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:000000",
};

/** True only when real credentials are present (not placeholders) */
export const isFirebaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes("REPLACE");

// Initialize once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Firestore SDK — only imported by server-side admin/seed routes
// The tree-shaking + optimizePackageImports in next.config.ts ensures
// this doesn't bloat the client bundle when not imported client-side
let _db: any = null;
export function getDb() {
  if (!_db) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore } = require("firebase/firestore");
    _db = getFirestore(app);
  }
  return _db;
}
/** Eagerly initialized Firestore — for backward compat with firebase-service.ts */
export const db = (() => {
  try { return getDb(); } catch { return null; }
})();

/** Firebase Cloud Messaging — client only */
export const getSafeMessaging = async () => {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  try {
    const { getMessaging } = await import("firebase/messaging");
    return getMessaging(app);
  } catch {
    return null;
  }
};
