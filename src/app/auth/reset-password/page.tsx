"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword: password }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }

    setMessage(data.message ?? "Password updated.");
    router.replace("/auth/login?reset=1");
  }

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <p className="text-sm text-muted">
          <Link href="/auth/login" className="font-semibold text-gold-dark">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Enter the 6-digit code we sent and choose a new password.
        </p>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
            Reset code
          </label>
          <OtpCodeInput value={code} onChange={setCode} disabled={loading} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
            New password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-12 rounded-xl"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>
        {message ? (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        <Button type="submit" fullWidth size="lg" disabled={loading || code.length !== 6}>
          {loading ? "Updating…" : "Update password"}
        </Button>
        <p className="text-center text-sm text-muted">
          Didn&apos;t get a code?{" "}
          <Link href="/auth/forgot-password" className="font-semibold text-gold-dark">
            Request again
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
