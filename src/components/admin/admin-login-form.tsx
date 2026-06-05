"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_OVERVIEW_PATH } from "@/lib/admin-paths";
import { brand } from "@/lib/design/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Invalid credentials.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("Sign-in failed. Try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      profile.is_banned ||
      (profile.role !== "admin" && profile.role !== "super_admin")
    ) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account is not authorised.");
      return;
    }

    router.replace(ADMIN_OVERVIEW_PATH);
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <div className="mb-6 flex items-center gap-3">
          <Image src={brand.logoSm} alt="" width={40} height={40} className="rounded-lg" />
          <span className="text-lg font-bold text-white">{brand.name}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="mt-1.5 border-white/15 bg-navy/60 text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5 border-white/15 bg-navy/60 text-white"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-red-200">{error}</p>
          )}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
