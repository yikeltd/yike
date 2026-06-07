"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/types/database";
import {
  type AuthIntent,
  AUTH_PUBLIC_INTENTS,
  AUTH_LOGIN_ONLY_INTENTS,
  peekAuthIntent,
  clearAuthIntent,
  saveAuthIntent,
} from "@/lib/auth-intent";
import { executeAuthIntent } from "@/lib/execute-auth-intent";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { AuthModal } from "./auth-modal";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  emailVerified: boolean;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  refreshAuth: () => Promise<void>;
  guardAction: (intent: AuthIntent, onAuthorized: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<AuthIntent | undefined>();
  const intentResumeRef = useRef<string | null>(null);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u);
    if (u) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      const p = data as Profile | null;
      setProfile(p);
      if (p && u.email) {
        saveQuickLoginUser({
          userId: p.id,
          email: u.email,
          fullName: p.full_name,
          username: p.username,
          avatarUrl: p.avatar_url,
        });
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshAuth();
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });
    return () => subscription.unsubscribe();
  }, [refreshAuth]);

  const emailVerified = useMemo(() => {
    if (!user) return false;
    if (user.email_confirmed_at) return true;
    if (user.email && isReviewerAccountEmail(user.email)) return true;
    return profile?.email_verified === true;
  }, [user, profile]);

  useEffect(() => {
    if (loading || !user) return;
    const pending = peekAuthIntent();
    if (!pending) return;

    const loginOnly = AUTH_LOGIN_ONLY_INTENTS.has(pending.type);
    if (!emailVerified && !loginOnly) return;

    const key = JSON.stringify(pending);
    if (intentResumeRef.current === key) return;
    intentResumeRef.current = key;

    clearAuthIntent();
    void executeAuthIntent(pending, router).then(() => router.refresh());
  }, [loading, user, emailVerified, router]);

  const openAuth = useCallback((intent?: AuthIntent) => {
    if (intent) saveAuthIntent(intent);
    setModalIntent(intent);
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setModalOpen(false);
    setModalIntent(undefined);
  }, []);

  const guardAction = useCallback(
    (intent: AuthIntent, onAuthorized: () => void) => {
      if (loading) return;
      if (AUTH_PUBLIC_INTENTS.has(intent.type)) {
        onAuthorized();
        return;
      }
      if (user && AUTH_LOGIN_ONLY_INTENTS.has(intent.type)) {
        onAuthorized();
        return;
      }
      if (user && emailVerified) {
        onAuthorized();
        return;
      }
      saveAuthIntent(intent);
      setModalIntent(intent);
      setModalOpen(true);
    },
    [loading, user, emailVerified]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      emailVerified,
      openAuth,
      closeAuth,
      refreshAuth,
      guardAction,
    }),
    [
      user,
      profile,
      loading,
      emailVerified,
      openAuth,
      closeAuth,
      refreshAuth,
      guardAction,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalOpen}
        intent={modalIntent}
        onClose={closeAuth}
        onSuccess={refreshAuth}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
