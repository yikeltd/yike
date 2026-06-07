"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { PasswordInput } from "@/components/auth/password-input";
import { PinLoginPanel } from "@/components/auth/pin-login-panel";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import {
  clearQuickLoginUser,
  getQuickLoginUser,
  saveQuickLoginUser,
} from "@/lib/auth/quick-login";
import { friendlyAuthError } from "@/lib/auth-errors";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { peekAuthIntent } from "@/lib/auth-intent";
import { getDefaultConsolePath, isStaffRole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = nextParam ?? (peekAuthIntent() ? "/" : "/profile");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickUser, setQuickUser] = useState<ReturnType<typeof getQuickLoginUser>>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);

  useEffect(() => {
    setQuickUser(getQuickLoginUser());
  }, []);

  async function completeLogin(signedInEmail: string, signedInPassword: string) {
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: signedInEmail,
      password: signedInPassword,
    });

    if (authError) {
      setError(friendlyAuthError(authError.message));
      return false;
    }

    const reviewerAccount = isReviewerAccountEmail(signedInEmail);
    if (!data.user?.email_confirmed_at && !reviewerAccount) {
      setEmailVerifyOpen(true);
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, email, role, is_banned")
      .eq("id", data.user!.id)
      .maybeSingle();

    if (
      profile &&
      !profile.is_banned &&
      isStaffRole(profile.role as UserRole)
    ) {
      router.replace(getDefaultConsolePath(profile.role as UserRole));
      return true;
    }

    await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", data.user!.id);

    if (profile && data.user?.email) {
      saveQuickLoginUser({
        userId: profile.id,
        email: data.user.email,
        fullName: profile.full_name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await completeLogin(email, password);
    setLoading(false);
    if (!ok && !emailVerifyOpen) return;
  }

  const usePin = quickUser && !showPasswordForm;

  return (
    <>
      <AuthShell
        title="Welcome back"
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
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="email"
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
            </div>
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            {quickUser && (
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
        email={email}
        onVerified={async () => {
          await completeLogin(email, password);
        }}
        autoSend
      />
    </>
  );
}
