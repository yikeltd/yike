"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import { PinPad } from "./pin-login-panel";
import { cn } from "@/lib/utils";

export function SessionLockOverlay({
  profile,
  accountTypeLabel,
  onUnlocked,
}: {
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  accountTypeLabel?: string;
  onUnlocked: () => void;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = profile.full_name ?? profile.username ?? "there";

  async function submitPin(code: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/session/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? AUTH_USER_MESSAGES.pinIncorrect);
        setPin("");
        if (data.pinLocked) {
          setError(AUTH_USER_MESSAGES.pinLocked);
        }
        return;
      }
      onUnlocked();
    } catch {
      setError("Network error. Try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-navy/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Unlock your account"
    >
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 overflow-hidden rounded-2xl ring-4 ring-gold/30">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="mx-auto h-20 w-20 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center bg-gradient-to-br from-gold/40 to-navy/20 text-2xl font-bold text-navy">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
            {AUTH_USER_MESSAGES.welcomeBack(displayName)}
          </p>
          {accountTypeLabel ? (
            <p className="mt-1 text-xs text-muted">{accountTypeLabel}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">{AUTH_USER_MESSAGES.pinPrompt}</p>
        </div>

        <PinPad
          value={pin}
          onChange={setPin}
          onComplete={(code) => void submitPin(code)}
          disabled={loading}
        />

        {error ? (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <Link
            href="/auth/login?mode=password&resetPin=1"
            className={cn("font-semibold text-gold-dark hover:underline")}
          >
            {AUTH_USER_MESSAGES.forgotPin}
          </Link>
          <button
            type="button"
            className="text-muted hover:text-foreground"
            onClick={() => router.push("/auth/login?switch=1")}
          >
            {AUTH_USER_MESSAGES.switchAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
