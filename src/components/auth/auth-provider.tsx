"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/types/database";
import {
  type AuthIntent,
  AUTH_PUBLIC_INTENTS,
  AUTH_LOGIN_ONLY_INTENTS,
  saveAuthIntent,
} from "@/lib/auth-intent";
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntent, setModalIntent] = useState<AuthIntent | undefined>();

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
      setProfile(data as Profile | null);
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
    return profile?.email_verified === true;
  }, [user, profile]);

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
      if (AUTH_LOGIN_ONLY_INTENTS.has(intent.type) && user) {
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
