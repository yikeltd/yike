"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthIntent } from "@/lib/auth-intent";
import { clearAuthIntent } from "@/lib/auth-intent";
import { friendlyAuthError } from "@/lib/auth-errors";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { PasswordInput } from "@/components/auth/password-input";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthModal({
  open,
  intent,
  onClose,
  onSuccess,
}: {
  open: boolean;
  intent?: AuthIntent;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleContinueAsGuest() {
    clearAuthIntent();
    onClose();
  }

  async function finishSignIn() {
    if (!isSupabaseConfigured()) return false;
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(friendlyAuthError(authError.message));
      return false;
    }
    if (!data.user?.email_confirmed_at && !isReviewerAccountEmail(email)) {
      setEmailVerifyOpen(true);
      return false;
    }
    await onSuccess();
    setEmailVerifyOpen(false);
    const resumed = await resumePendingAuthIntent(router, {
      fallbackPath: intent?.redirectPath ?? "/profile",
      emailVerified: true,
    });
    onClose();
    if (!resumed) router.refresh();
    return true;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await finishSignIn();
    setLoading(false);
  }

  const signupHref = intent?.redirectPath
    ? `/auth/signup?next=${encodeURIComponent(intent.redirectPath)}`
    : "/auth/signup";

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close"
        />
        <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-elevated p-6 shadow-float-lg ring-1 ring-gold/15 sm:m-4 sm:rounded-3xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <h2 id="auth-modal-title" className="pr-8 text-xl font-bold text-foreground">
            Sign in to continue
          </h2>
          <p className="mt-1 text-sm text-muted">
            Save homes and contact agents faster.
          </p>

          <div className="mt-5 flex rounded-xl bg-surface p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-all",
                  tab === t
                    ? "bg-elevated text-foreground shadow-sm"
                    : "text-muted"
                )}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {tab === "signup" ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted">
                One free account — list property only when you&apos;re ready.
              </p>
              <Link
                href={signupHref}
                onClick={onClose}
                className="pressable flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-bold text-navy"
              >
                Create Account
              </Link>
              <p className="text-center text-xs text-muted">
                Already registered?{" "}
                <button
                  type="button"
                  className="font-semibold text-gold-dark dark:text-gold"
                  onClick={() => setTab("signin")}
                >
                  Sign In
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="mt-5 space-y-3">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
                autoComplete="email"
              />
              <PasswordInput
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
                autoComplete="current-password"
                revealLabel="password"
              />
              {error && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="mt-4 w-full py-2 text-center text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      <EmailOtpModal
        open={emailVerifyOpen}
        email={email}
        onVerified={async () => {
          await finishSignIn();
        }}
        autoSend
      />
    </>
  );
}
