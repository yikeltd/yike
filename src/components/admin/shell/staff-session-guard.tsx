"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { STAFF_LOGIN_PATH } from "@/lib/admin-paths";
import { SessionLockOverlay } from "@/components/auth/session-lock-overlay";
import { PinSetupModal } from "@/components/auth/pin-setup-modal";
import { StaffFirstLoginChecklist } from "@/components/admin/staff-first-login-checklist";

const HEARTBEAT_MS = 45_000;

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

/** Idle lock + PIN unlock for internal /lex consoles (staff APK). */
export function StaffSessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const pinPromptDismissed = useRef(false);
  const checking = useRef(false);

  const skip = !pathname.startsWith("/lex") || !isSupabaseConfigured();

  const refreshStatus = useCallback(async () => {
    if (skip || checking.current) return;
    checking.current = true;
    try {
      const res = await fetch("/api/auth/session/status", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as SessionPayload;
      setSession(data);

      if (data.policy?.accountClass !== "staff") return;

      if (data.requiresFullLogin && data.authenticated) {
        const supabase = createClient();
        await supabase.auth.signOut();
        setSession(null);
        router.replace(`${STAFF_LOGIN_PATH}?reason=session&app=staff`);
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
  }, [skip, router]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus, pathname]);

  useEffect(() => {
    if (skip) return;

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
  }, [skip, refreshStatus]);

  const locked = Boolean(
    session?.locked &&
      session.policy?.accountClass === "staff" &&
      session.profile
  );

  return (
    <>
      {children}
      {locked && session?.profile ? (
        <SessionLockOverlay
          profile={session.profile}
          accountTypeLabel={session.policy?.accountTypeLabel ?? "Staff"}
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
          void fetch("/api/staff/onboarding-checklist", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "pin_set", completed: true }),
          });
          void refreshStatus();
        }}
      />
      {session?.policy?.accountClass === "staff" && session.authenticated ? (
        <StaffFirstLoginChecklist />
      ) : null}
    </>
  );
}
