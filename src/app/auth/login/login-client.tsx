"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  EmailOtpModal,
  type EmailOtpPurpose,
  type EmailOtpVerifyResponse,
} from "@/components/auth/email-otp-modal";
import { PasswordInput } from "@/components/auth/password-input";
import {
  PinLoginPanel,
  type PinRequirePasswordPayload,
} from "@/components/auth/pin-login-panel";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import { PinSetupModal } from "@/components/auth/pin-setup-modal";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import {
  clearQuickLoginUser,
  getQuickLoginUser,
  saveQuickLoginUser,
  subscribeQuickLoginUser,
} from "@/lib/auth/quick-login";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { getDefaultConsolePath, isStaffRole } from "@/lib/admin/roles";
import { fetchAuthJson } from "@/lib/auth/auth-fetch";
import { resolveLoginSurface } from "@/lib/auth/login-ui-state";
import {
  CONSUMER_AUTH_DEFAULT_NEXT,
  safeConsumerAuthNext,
  safeNextPath,
} from "@/lib/auth/safe-next-path";
import { resolveProfilePath } from "@/lib/account/account-home";
import type { UserRole } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  role?: UserRole | null;
  has_pin_set?: boolean | null;
};

export function LoginClient({ belowLegal }: { belowLegal?: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const forcePassword = searchParams.get("mode") === "password" || searchParams.get("switch") === "1";
  const resetPin = searchParams.get("resetPin") === "1";
  const sessionReason = searchParams.get("reason");
  const next = safeConsumerAuthNext(nextParam, CONSUMER_AUTH_DEFAULT_NEXT);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const quickUser = useSyncExternalStore(
    subscribeQuickLoginUser,
    getQuickLoginUser,
    () => null
  );
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [emailOtpPurpose, setEmailOtpPurpose] = useState<EmailOtpPurpose>("email_verify");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<LoginProfile | null>(null);

  useLayoutEffect(() => {
    if (forcePassword) {
      clearQuickLoginUser();
      setShowPasswordForm(true);
    }
  }, [forcePassword]);

  useEffect(() => {
    if (sessionReason === "session") {
      setInfo(AUTH_USER_MESSAGES.fullLoginRequired);
    } else if (sessionReason === "device") {
      setInfo(AUTH_USER_MESSAGES.newDevice);
    }
  }, [sessionReason]);

  useEffect(() => {
    if (!nextParam) return;
    const safe = safeConsumerAuthNext(nextParam, CONSUMER_AUTH_DEFAULT_NEXT);
    if (safe === nextParam) return;
    const params = new URLSearchParams(window.location.search);
    params.set("next", safe);
    router.replace(`/auth/login?${params.toString()}`);
  }, [nextParam, router]);

  async function loadCurrentProfile(): Promise<LoginProfile | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, email, role, has_pin_set")
      .eq("id", user.id)
      .maybeSingle();
    return (profile as LoginProfile | null) ?? null;
  }

  async function finishLogin(profile: LoginProfile) {
    if (!profile.id) {
      const current = await loadCurrentProfile();
      if (current) return finishLogin(current);
    }

    if (profile.role && isStaffRole(profile.role)) {
      router.replace(getDefaultConsolePath(profile.role));
      return true;
    }

    if (profile.id && profile.email && profile.has_pin_set) {
      saveQuickLoginUser({
        userId: profile.id,
        email: profile.email,
        fullName: profile.full_name ?? null,
        username: profile.username ?? null,
        avatarUrl: profile.avatar_url ?? null,
      });
    }

    setEmailVerifyOpen(false);
    const fallbackPath = resolvePostLoginPath(profile, next);
    const resumed = await resumePendingAuthIntent(router, {
      fallbackPath,
      emailVerified: true,
    });
    if (!resumed) router.refresh();
    return true;
  }

  function resolvePostLoginPath(profile: LoginProfile, requestedNext: string): string {
    const pathOnly = requestedNext.split("?")[0] ?? requestedNext;
    if (pathOnly === "/" || pathOnly === "/profile") {
      return resolveProfilePath(profile.role ? { role: profile.role } : null);
    }
    return requestedNext;
  }

  async function completeLogin(signedInIdentifier: string, signedInPassword: string) {
    const result = await fetchAuthJson<{
      error?: string;
      profile?: LoginProfile;
      needsEmailVerify?: boolean;
      needsLoginOtp?: boolean;
      requiresPinSetup?: boolean;
    }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: signedInIdentifier, password: signedInPassword }),
      },
      20_000
    );

    if (!result.ok) {
      const data = result.data ?? {};
      setError(
        data.error?.trim() ||
          (result.kind === "network" || result.kind === "timeout"
            ? result.message
            : AUTH_USER_MESSAGES.invalidLogin)
      );
      return false;
    }

    const data = result.data;

    const profile = (data.profile ?? null) as LoginProfile | null;
    setActiveProfile(profile);

    const email = profile?.email ?? signedInIdentifier;
    setResolvedEmail(email);

    if (data.needsEmailVerify && !isReviewerAccountEmail(email)) {
      setInfo(AUTH_USER_MESSAGES.emailVerifyRequired);
      setEmailOtpPurpose("email_verify");
      setEmailVerifyOpen(true);
      return false;
    }

    if (data.needsLoginOtp && !isReviewerAccountEmail(email)) {
      setEmailOtpPurpose("login");
      setEmailVerifyOpen(true);
      return false;
    }

    if (data.requiresPinSetup) {
      setPinSetupOpen(true);
      return false;
    }

    if (resetPin) {
      setPinSetupOpen(true);
      return false;
    }

    return finishLogin(profile ?? { id: "", email });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const ok = await completeLogin(identifier, password);
    setLoading(false);
    if (!ok && !emailVerifyOpen && !pinSetupOpen) return;
  }

  const loginSurface = resolveLoginSurface({
    hasQuickUser: Boolean(quickUser),
    showPasswordForm,
    forcePassword,
  });
  const usePin = loginSurface === "pin";

  const requirePasswordSignIn = useCallback((payload: PinRequirePasswordPayload) => {
    setIdentifier((current) => payload.prefillEmail ?? quickUser?.email ?? current);
    const showInfo =
      payload.message &&
      payload.message !== AUTH_USER_MESSAGES.newDevicePinBlocked;
    setInfo(showInfo ? payload.message : "");
    setError("");
    setLoading(false);
    setShowPasswordForm(true);
  }, [quickUser?.email]);

  const switchToPasswordForm = useCallback(() => {
    setError("");
    setLoading(false);
    if (quickUser?.email) setIdentifier(quickUser.email);
    setShowPasswordForm(true);
  }, [quickUser?.email]);

  async function finishAfterOtp(data: EmailOtpVerifyResponse) {
    const otpProfile = (data.profile ?? null) as LoginProfile | null;
    const profile = otpProfile ?? activeProfile ?? (await loadCurrentProfile());
    if (profile) setActiveProfile(profile);

    setEmailVerifyOpen(false);

    if (data.requiresPinSetup || (profile && !profile.has_pin_set)) {
      setPinSetupOpen(true);
      return;
    }

    await finishLogin(profile ?? { id: "", email: resolvedEmail || identifier });
  }

  async function finishAfterPinSetup(pinSaved: boolean) {
    setPinSetupOpen(false);
    const profile = activeProfile ?? (await loadCurrentProfile());
    if (profile) {
      await finishLogin({ ...profile, has_pin_set: pinSaved ? true : profile.has_pin_set });
      return;
    }
    await finishLogin({
      id: quickUser?.userId ?? "",
      email: resolvedEmail || identifier,
    });
  }

  const signupHref =
    next !== CONSUMER_AUTH_DEFAULT_NEXT
      ? `/auth/signup?next=${encodeURIComponent(next)}`
      : "/auth/signup";

  return (
    <>
      <AuthShell
        title={usePin ? undefined : "Welcome Back"}
        compact
        centered
        belowLegal={belowLegal}
        footer={
          !usePin ? (
            <div className="space-y-1 text-sm text-muted">
              <p>New to Yike?</p>
              <Link
                href={signupHref}
                className="font-semibold text-gold-dark dark:text-gold"
              >
                Create your account
              </Link>
            </div>
          ) : null
        }
      >
        {usePin && quickUser ? (
          <PinLoginPanel
            user={quickUser}
            nextPath={next}
            onSwitchAccount={() => {
              clearQuickLoginUser();
              setError("");
              setInfo("");
              setLoading(false);
              setShowPasswordForm(true);
            }}
            onUsePassword={switchToPasswordForm}
            onRequirePassword={requirePasswordSignIn}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {info ? (
              <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-navy dark:text-gold">
                {info}
              </p>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Email Address
              </p>
              <Input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">PIN</p>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="current-password"
                revealLabel="PIN"
                inputMode={/^\d*$/.test(password) ? "numeric" : "text"}
              />
              <div className="pt-0.5 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-gold-dark hover:underline dark:text-gold"
                >
                  Forgot PIN?
                </Link>
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            {quickUser && !forcePassword && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setInfo("");
                  setLoading(false);
                  setShowPasswordForm(false);
                }}
                className="w-full text-sm font-semibold text-gold-dark hover:underline dark:text-gold"
              >
                Sign in with PIN instead
              </button>
            )}
          </form>
        )}
      </AuthShell>

      <EmailOtpModal
        open={emailVerifyOpen}
        email={resolvedEmail || identifier}
        purpose={emailOtpPurpose}
        onVerified={finishAfterOtp}
        autoSend
      />

      <PinSetupModal
        open={pinSetupOpen}
        resetMode={resetPin}
        loginPassword={resetPin ? password : undefined}
        onClose={() => {
          void finishAfterPinSetup(false);
        }}
        onComplete={() => {
          void finishAfterPinSetup(true);
        }}
      />
    </>
  );
}
