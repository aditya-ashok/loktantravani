"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserRole } from "./types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  userPhotoUrl: string | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAdmin: boolean;
  isAuthor: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  authLoading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
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

/** Fetch role from server API — works even if client Firestore is blocked */
async function fetchRoleFromServer(user: FirebaseUser): Promise<UserRole> {
  try {
    const res = await fetch("/api/auth/check-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        uid: user.uid,
        name: user.displayName,
        avatar: user.photoURL,
      }),
    });
    if (!res.ok) return "guest";
    const data = await res.json();
    return (data.role as UserRole) || "guest";
  } catch {
    return "guest";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("guest");

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
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setFirebaseUser(user);
          if (user) {
            // Use server API to resolve role — avoids all client Firestore issues
            fetchRoleFromServer(user).then((role) => {
              setUserRole(role);
              setAuthLoading(false);
            });
          } else {
            setUserRole("guest");
            setAuthLoading(false);
          }
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
        alert("Firebase not configured.");
        return;
      }
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will fire and resolve role via server API
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code && code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in error:", code);
        alert(`Sign-in error: ${code}`);
      }
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { auth, isFirebaseConfigured } = await import("./firebase");
      if (!isFirebaseConfigured) throw new Error("Firebase not configured");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        throw new Error("Incorrect password. Please try again.");
      } else if (code === "auth/user-not-found") {
        throw new Error("No account found with this email.");
      } else if (code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      } else if (code === "auth/too-many-requests") {
        throw new Error("Too many attempts. Please try again later.");
      }
      throw new Error((err as Error).message || "Sign in failed.");
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { auth, isFirebaseConfigured } = await import("./firebase");
      if (!isFirebaseConfigured) throw new Error("Firebase not configured");
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        throw new Error("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        throw new Error("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }
      throw new Error((err as Error).message || "Sign up failed.");
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { auth } = await import("./firebase");
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(auth);
      setUserRole("guest");
    } catch {}
  }, []);

  const isLoggedIn = firebaseUser !== null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
