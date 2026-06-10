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
import { SessionGuard } from "./session-guard";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  emailVerified: boolean;
  savedListingIds: ReadonlySet<string>;
  isListingSaved: (listingId: string) => boolean;
  setListingSaved: (listingId: string, saved: boolean) => void;
  openAuth: (intent?: AuthIntent) => void;
  closeAuth: () => void;
  refreshAuth: () => Promise<void>;
  guardAction: (intent: AuthIntent, onAuthorized: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_BOOT_TIMEOUT_MS = 2500;

function withAuthTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), AUTH_BOOT_TIMEOUT_MS);
  });

  return Promise.race([work.catch(() => fallback), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<AuthIntent | undefined>();
  const [savedListingIds, setSavedListingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const intentResumeRef = useRef<string | null>(null);

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setProfile(null);
      setSavedListingIds(new Set());
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const u = await withAuthTimeout(
      supabase.auth.getUser().then(({ data }) => data.user ?? null),
      null
    );
    setUser(u);
    if (u) {
      const { profile: p, favorites } = await withAuthTimeout(
        Promise.all([
          supabase.from("profiles").select("*").eq("id", u.id).single(),
          supabase.from("favorites").select("property_id").eq("user_id", u.id),
        ]).then(([profileRes, favoritesRes]) => ({
          profile: profileRes.data as Profile | null,
          favorites: (favoritesRes.data ?? []) as Array<{ property_id: string }>,
        })),
        { profile: null, favorites: [] }
      );
      setProfile(p);
      setSavedListingIds(
        new Set((favorites ?? []).map((row) => row.property_id as string))
      );
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
      setSavedListingIds(new Set());
    }
    setLoading(false);
  }, []);

  const isListingSaved = useCallback(
    (listingId: string) => savedListingIds.has(listingId),
    [savedListingIds]
  );

  const setListingSaved = useCallback((listingId: string, saved: boolean) => {
    setSavedListingIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
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
      savedListingIds,
      isListingSaved,
      setListingSaved,
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
      savedListingIds,
      isListingSaved,
      setListingSaved,
      openAuth,
      closeAuth,
      refreshAuth,
      guardAction,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      <SessionGuard>{children}</SessionGuard>
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
