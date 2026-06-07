"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProtectedConsumerRoute } from "@/lib/auth/route-access";
import { useAuth } from "./auth-provider";
import { SessionLockOverlay } from "./session-lock-overlay";
import { PinSetupModal } from "./pin-setup-modal";

const HEARTBEAT_MS = 60_000;
const SKIP_PREFIXES = ["/auth", "/lex"];

type SessionPayload = {
  authenticated?: boolean;
  locked?: boolean;
  requiresFullLogin?: boolean;
  requiresPinSetup?: boolean;
  hasPinSet?: boolean;
  policy?: { accountClass?: string; accountTypeLabel?: string };
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
};

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const pinPromptDismissed = useRef(false);
  const checking = useRef(false);

  const skip =
    SKIP_PREFIXES.some((p) => pathname.startsWith(p)) ||
    !isSupabaseConfigured();

  const refreshStatus = useCallback(async () => {
    if (skip || checking.current) return;
    checking.current = true;
    try {
      const res = await fetch("/api/auth/session/status", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as SessionPayload;
      setSession(data);

      if (data.requiresFullLogin && data.authenticated) {
        const supabase = createClient();
        await supabase.auth.signOut();
        setSession(null);

        if (isProtectedConsumerRoute(pathname)) {
          const next = encodeURIComponent(pathname);
          router.replace(`/auth/login?reason=session&next=${next}`);
        } else {
          router.refresh();
        }
        return;
      }

      if (
        data.requiresPinSetup &&
        data.authenticated &&
        !pinPromptDismissed.current
      ) {
        setPinSetupOpen(true);
      }
    } finally {
      checking.current = false;
    }
  }, [skip, router, pathname]);

  useEffect(() => {
    if (loading || skip || !user) {
      setSession(null);
      return;
    }
    void refreshStatus();
  }, [loading, skip, user, refreshStatus]);

  useEffect(() => {
    if (skip || !user) return;

    const onActivity = () => {
      void fetch("/api/auth/session/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat" }),
      });
    };

    const timer = setInterval(() => void refreshStatus(), HEARTBEAT_MS);
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshStatus();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [skip, user, refreshStatus]);

  const locked = Boolean(session?.locked && user && session.profile);

  return (
    <>
      {children}
      {locked && session?.profile ? (
        <SessionLockOverlay
          profile={session.profile}
          accountTypeLabel={session.policy?.accountTypeLabel}
          onUnlocked={() => void refreshStatus()}
        />
      ) : null}
      <PinSetupModal
        open={pinSetupOpen}
        onClose={() => {
          pinPromptDismissed.current = true;
          setPinSetupOpen(false);
        }}
        onComplete={() => {
          pinPromptDismissed.current = true;
          setPinSetupOpen(false);
          void refreshStatus();
        }}
      />
    </>
  );
}
