"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (!data.user?.email_confirmed_at) {
      router.push(
        `/auth/verify-email?next=${encodeURIComponent(next)}`
      );
      return;
    }
    await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", data.user.id);
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      compact
      footer={
        <p className="text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-gold-dark dark:text-gold"
          >
            Create one free
          </Link>
        </p>
      }
    >
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
          <Input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="current-password"
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
      </form>
    </AuthShell>
  );
}
