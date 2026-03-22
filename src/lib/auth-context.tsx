"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserRole } from "./types";

interface AuthContextValue {
  // Firebase Auth state
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Derived user info
  userId: string | null;
  userName: string;
  userEmail: string | null;
  userPhotoUrl: string | null;

  // Manual role override (for admin/author testing)
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Convenience booleans
  isAdmin: boolean;
  isAuthor: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  authLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  userId: null,
  userName: "Guest",
  userEmail: null,
  userPhotoUrl: null,
  userRole: "guest",
  setUserRole: () => {},
  isAdmin: false,
  isAuthor: false,
  isGuest: true,
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("guest");

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    let unsubscribe = () => {};
    const init = async () => {
      try {
        const { auth, isFirebaseConfigured } = await import("./firebase");
        if (!isFirebaseConfigured) {
          setAuthLoading(false);
          return;
        }
        const { onAuthStateChanged } = await import("firebase/auth");
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          setFirebaseUser(user);
          if (user) {
            // Check Firestore for an assigned platform role
            try {
              const { getUserProfile } = await import("./firebase-service");
              const profile = await getUserProfile(user.uid);
              if (profile?.role) setUserRole(profile.role);
            } catch {
              // fallback: remain guest
            }
          } else {
            setUserRole("guest");
          }
          setAuthLoading(false);
        });
      } catch {
        setAuthLoading(false);
      }
    };
    init();
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { auth, isFirebaseConfigured } = await import("./firebase");
      if (!isFirebaseConfigured) {
        alert("Firebase not configured — add your credentials to .env.local first.");
        return;
      }
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      // Upsert profile in Firestore (best-effort)
      try {
        const { upsertUserProfile } = await import("./firebase-service");
        await upsertUserProfile(result.user.uid, {
          name: result.user.displayName || "Reader",
          email: result.user.email || "",
          avatar: result.user.photoURL || undefined,
        });
      } catch {
        // non-critical
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code && code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in error:", code);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { auth } = await import("./firebase");
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(auth);
      setUserRole("guest");
    } catch {
      // ignore
    }
  }, []);

  const isLoggedIn = firebaseUser !== null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authLoading,
        signInWithGoogle,
        signOut,
        userId: firebaseUser?.uid ?? null,
        userName: firebaseUser?.displayName || "Guest",
        userEmail: firebaseUser?.email ?? null,
        userPhotoUrl: firebaseUser?.photoURL ?? null,
        userRole,
        setUserRole,
        isAdmin: userRole === "admin",
        isAuthor: userRole === "author",
        isGuest: !isLoggedIn && userRole === "guest",
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
