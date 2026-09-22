"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { parseUserRole } from "@/lib/roles";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import type { UserRole } from "@/types";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [claimedRole, setClaimedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(configured);
  const previewRole = parseUserRole(searchParams.get("role")) ?? "agent";
  const role = configured ? claimedRole : previewRole;

  useEffect(() => {
    if (!configured) {
      return;
    }

    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        clearSessionCookie();
        setUser(null);
        setClaimedRole(null);
        setLoading(false);
        return;
      }

      setSessionCookie();
      const token = await nextUser.getIdTokenResult();
      setUser(nextUser);
      setClaimedRole(parseUserRole(token.claims.role));
      setLoading(false);
    });

    return unsubscribe;
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getClientAuth(), email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(getClientAuth(), email, password);
  }, []);

  const signOut = useCallback(async () => {
    if (!configured) {
      return;
    }
    await firebaseSignOut(getClientAuth());
    clearSessionCookie();
  }, [configured]);

  const value = useMemo(
    () => ({ user, role, loading, configured, signIn, signUp, signOut }),
    [user, role, loading, configured, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
