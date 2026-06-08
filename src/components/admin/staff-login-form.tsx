"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { brand, crewBrand } from "@/lib/design/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAFF_APP_COOKIE, STAFF_APP_START_PATH } from "@/lib/admin/staff-app";
import { getDefaultConsolePath } from "@/lib/admin/roles";
import { isStaffRole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

type Props = {
  staffApp?: boolean;
};

export function StaffLoginForm({ staffApp = false }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffApp && typeof document !== "undefined") {
      document.cookie = `${STAFF_APP_COOKIE}=1; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
    }
  }, [staffApp]);

  async function resolveLanding(): Promise<string> {
    try {
      const res = await fetch("/api/staff/landing", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { landing?: { path: string } };
        if (data.landing?.path) return data.landing.path;
      }
    } catch {
      /* fallback below */
    }
    return STAFF_APP_START_PATH;
  }

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

    await fetch("/api/auth/session/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "heartbeat" }),
    }).catch(() => null);

    const dest = staffApp
      ? await resolveLanding()
      : getDefaultConsolePath(profile.role as UserRole);
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex flex-col items-center gap-3">
            <Image
              src={staffApp ? crewBrand.logoSm : brand.logoSm}
              alt=""
              width={staffApp ? 72 : 48}
              height={staffApp ? 72 : 48}
              className={staffApp ? "rounded-2xl shadow-lg" : "rounded-xl"}
            />
            <h1 className="text-xl font-bold text-white">{brand.name}</h1>
          </div>
          {!staffApp && (
            <>
              <p className="text-lg font-semibold text-gold">Yike Ops</p>
              <p className="mt-1 text-sm text-white/50">
                One login for all teams — you&apos;ll land in your workspace automatically
              </p>
            </>
          )}
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
              {loading ? "Signing in…" : staffApp ? "Sign in" : "Sign in to console"}
            </Button>
          </form>
        </div>

        {!staffApp && (
          <p className="mt-6 text-center text-xs text-white/30">
            Unauthorized access is logged and monitored.
          </p>
        )}
      </div>
    </div>
  );
}
