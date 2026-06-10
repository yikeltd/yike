"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

function VerifyEmailFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const verifyPath = `/auth/verify-email?next=${encodeURIComponent(next)}`;
        router.replace(`/auth/login?next=${encodeURIComponent(verifyPath)}`);
        return;
      }
      setEmail(user.email ?? null);
      if (user.email_confirmed_at) {
        await supabase
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", user.id);
        router.replace(next);
        return;
      }
      setChecking(false);
    }

    void check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email_confirmed_at) {
        router.replace(next);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, next]);

  async function resend() {
    setResending(true);
    setMessage("");
    const res = await fetch("/api/auth/email/resend", { method: "POST" });
    const data = await res.json();
    setResending(false);
    setMessage(
      res.ok
        ? (data.message ?? "Check your email to verify your account.")
        : (data.error ?? "We could not send the email right now.")
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Check your email"
      subtitle="Please verify your email to continue."
      footer={
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-gold-dark dark:text-gold"
        >
          Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15">
          <Mail className="h-8 w-8 text-gold-dark dark:text-gold" />
        </span>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          We sent a verification link to{" "}
          <span className="font-semibold text-foreground">{email}</span>.
          Open it to activate your Yike account.
        </p>
        {message && (
          <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        )}
        <Button
          type="button"
          fullWidth
          size="lg"
          className="mt-6"
          onClick={resend}
          disabled={resending}
        >
          {resending ? "Sending…" : "Resend verification email"}
        </Button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
