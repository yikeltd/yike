"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/lib/design/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDefaultConsolePath } from "@/lib/admin/roles";
import { isStaffRole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

export function StaffLoginForm() {
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
      .select("role, is_banned, last_login_at")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_banned || !isStaffRole(profile.role as UserRole)) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Access denied. This account is not authorised for internal consoles.");
      return;
    }

    await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    const dest = getDefaultConsolePath(profile.role as UserRole);
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <Image src={brand.logoSm} alt="" width={48} height={48} className="rounded-xl" />
            <span className="text-xl font-bold text-white">{brand.name}</span>
          </div>
          <h1 className="text-lg font-semibold text-gold">Yike Ops</h1>
          <p className="mt-1 text-sm text-white/50">
            One login for all teams — you&apos;ll land in your workspace automatically
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-white/70">Work email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="mt-1.5 border-white/15 bg-navy/60 text-white placeholder:text-white/30"
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
              {loading ? "Signing in…" : "Sign in to console"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Unauthorized access is logged and monitored.
        </p>
      </div>
    </div>
  );
}
