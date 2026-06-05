"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AuthIntent } from "@/lib/auth-intent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INTENT_COPY: Record<string, string> = {
  whatsapp: "Sign in to chat with the agent on WhatsApp",
  call: "Sign in to call the agent",
  save: "Sign in to save this listing",
  profile: "Sign in to view your profile",
  saved: "Sign in to see your saved homes",
  list_property: "Sign in to list your property on Yike",
};

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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) return;
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
    await onSuccess();
    onClose();
    if (!data.user?.email_confirmed_at) {
      router.push("/auth/verify-email");
      return;
    }
    router.refresh();
  }

  const subtitle = intent?.type
    ? INTENT_COPY[intent.type] ?? "Sign in to continue"
    : "Sign in to save homes, contact agents, and list property";

  return (
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
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-3xl border border-white/10 bg-elevated p-6 shadow-float-lg sm:rounded-3xl sm:m-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-gold">
          Yike account
        </p>
        <h2 id="auth-modal-title" className="mt-1 pr-8 text-xl font-bold text-foreground">
          {tab === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>

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
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {tab === "signup" ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted">
              Create your Yike account once — verify as an agent only when you want to list property.
            </p>
            <Link
              href={
                intent?.redirectPath
                  ? `/auth/signup?next=${encodeURIComponent(intent.redirectPath)}`
                  : "/auth/signup"
              }
              onClick={onClose}
              className="pressable flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-bold text-navy"
            >
              Create free account
            </Link>
            <p className="text-center text-xs text-muted">
              Already registered?{" "}
              <button
                type="button"
                className="font-semibold text-gold-dark dark:text-gold"
                onClick={() => setTab("signin")}
              >
                Sign in
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
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />
            {error && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
