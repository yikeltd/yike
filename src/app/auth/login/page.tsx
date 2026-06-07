"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { PasswordInput } from "@/components/auth/password-input";
import { PinLoginPanel } from "@/components/auth/pin-login-panel";
import { PinSetupModal } from "@/components/auth/pin-setup-modal";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import {
  clearQuickLoginUser,
  getQuickLoginUser,
  saveQuickLoginUser,
} from "@/lib/auth/quick-login";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { peekAuthIntent } from "@/lib/auth-intent";
import { getDefaultConsolePath, isStaffRole } from "@/lib/admin/roles";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import type { UserRole } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const forcePassword = searchParams.get("mode") === "password" || searchParams.get("switch") === "1";
  const sessionReason = searchParams.get("reason");
  const next = nextParam ?? (peekAuthIntent() ? "/" : "/profile");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickUser, setQuickUser] = useState<ReturnType<typeof getQuickLoginUser>>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [pinSetupOpen, setPinSetupOpen] = useState(false);

  useEffect(() => {
    if (forcePassword) {
      clearQuickLoginUser();
      setQuickUser(null);
      setShowPasswordForm(true);
    } else {
      setQuickUser(getQuickLoginUser());
    }
  }, [forcePassword]);

  useEffect(() => {
    if (sessionReason === "session") {
      setInfo(AUTH_USER_MESSAGES.fullLoginRequired);
    } else if (sessionReason === "device") {
      setInfo(AUTH_USER_MESSAGES.newDevice);
    }
  }, [sessionReason]);

  async function finishLogin(profile: {
    id: string;
    email?: string | null;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    role?: UserRole;
  }) {
    if (profile.role && isStaffRole(profile.role)) {
      router.replace(getDefaultConsolePath(profile.role));
      return true;
    }

    if (profile.email) {
      saveQuickLoginUser({
        userId: profile.id,
        email: profile.email,
        fullName: profile.full_name ?? null,
        username: profile.username ?? null,
        avatarUrl: profile.avatar_url ?? null,
      });
    }

    setEmailVerifyOpen(false);
    const resumed = await resumePendingAuthIntent(router, {
      fallbackPath: next,
      emailVerified: true,
    });
    if (!resumed) router.refresh();
    return true;
  }

  async function completeLogin(signedInIdentifier: string, signedInPassword: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: signedInIdentifier, password: signedInPassword }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? AUTH_USER_MESSAGES.invalidLogin);
      return false;
    }

    const email = data.profile?.email ?? signedInIdentifier;
    setResolvedEmail(email);

    if (data.needsEmailVerify && !isReviewerAccountEmail(email)) {
      setEmailVerifyOpen(true);
      return false;
    }

    const supabase = createClient();
    if (data.profile?.id) {
      await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("id", data.profile.id);
    }

    if (data.requiresPinSetup) {
      setPinSetupOpen(true);
      return false;
    }

    return finishLogin(data.profile ?? { id: "", email });
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

  const usePin = quickUser && !showPasswordForm && !forcePassword;

  return (
    <>
      <AuthShell
        title={usePin ? undefined : "Welcome back"}
        compact={Boolean(usePin)}
        footer={
          !usePin ? (
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href={`/auth/signup${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="font-semibold text-gold-dark dark:text-gold"
              >
                Create one free
              </Link>
            </p>
          ) : null
        }
      >
        {usePin && quickUser ? (
          <PinLoginPanel
            user={quickUser}
            nextPath={next}
            onSwitchAccount={() => {
              clearQuickLoginUser();
              setQuickUser(null);
              setShowPasswordForm(true);
            }}
            onUsePassword={() => setShowPasswordForm(true)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {info ? (
              <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-navy dark:text-gold">
                {info}
              </p>
            ) : null}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                Email or username
              </label>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                Password
              </label>
              <PasswordInput
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="current-password"
                revealLabel="password"
              />
              <div className="mt-2 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-gold-dark hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            {quickUser && !forcePassword && (
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="w-full text-sm font-semibold text-gold-dark hover:underline"
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
        purpose="email_verify"
        onVerified={async () => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, email, role")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            await finishLogin({
              id: profile.id,
              email: profile.email ?? (resolvedEmail || identifier),
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url,
              role: profile.role as UserRole,
            });
          }
        }}
        autoSend
      />

      <PinSetupModal
        open={pinSetupOpen}
        onClose={() => {
          setPinSetupOpen(false);
          void finishLogin({
            id: quickUser?.userId ?? "",
            email: resolvedEmail || identifier,
          });
        }}
        onComplete={() => {
          setPinSetupOpen(false);
          void finishLogin({
            id: quickUser?.userId ?? "",
            email: resolvedEmail || identifier,
          });
        }}
      />
    </>
  );
}
