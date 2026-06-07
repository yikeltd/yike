"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      email?: string;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send reset code. Try again.");
      return;
    }

    setMessage(data.message ?? "If that account exists, we sent a reset code.");
    const email = data.email ?? (identifier.includes("@") ? identifier.trim().toLowerCase() : "");
    if (email) {
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      footer={
        <p className="text-sm text-muted">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-semibold text-gold-dark">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Enter your email or username and we&apos;ll send a reset code.
        </p>
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
        {message ? (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
        </Button>
      </form>
    </AuthShell>
  );
}
