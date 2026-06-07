"use client";

import { useMemo, useState } from "react";
import { peekAuthIntent } from "@/lib/auth-intent";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  value,
  onChange,
  onComplete,
  disabled,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (pin: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const dots = useMemo(() => Array.from({ length: 6 }, (_, i) => i < value.length), [value]);

  function press(key: (typeof KEYS)[number]) {
    if (disabled) return;
    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (!key || value.length >= 6) return;
    const next = value + key;
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex justify-center gap-2.5" aria-label="PIN entry progress">
        {dots.map((filled, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-3 rounded-full transition-all",
              filled ? "scale-110 bg-gold shadow-glow-gold" : "bg-black/10 dark:bg-white/15"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, index) => {
          if (key === "") {
            return <div key={`spacer-${index}`} />;
          }
          const label = key === "del" ? "⌫" : key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              className={cn(
                "pressable flex h-14 items-center justify-center rounded-2xl bg-surface text-xl font-semibold text-navy",
                disabled && "opacity-60"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PinLoginPanel({
  user,
  nextPath,
  onSwitchAccount,
  onUsePassword,
}: {
  user: {
    email: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  nextPath: string;
  onSwitchAccount: () => void;
  onUsePassword: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPin(code: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: user.email, pin: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not sign in");
        setPin("");
        return;
      }
      const pending = peekAuthIntent();
      const target = (pending?.redirectPath ?? nextPath) || "/";
      window.location.href = target;
    } catch {
      setError("Network error. Try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  const displayName = user.fullName ?? user.username ?? "Welcome back";

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex max-w-xs flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute -inset-3 rounded-[2rem] bg-gold/20 blur-xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.75rem] ring-4 ring-gold/35">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-24 w-24 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center bg-gradient-to-br from-gold/40 to-navy/20 text-3xl font-bold text-navy">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">Welcome back</p>
        <h2 className="mt-1 text-xl font-bold text-navy">{displayName}</h2>
        {user.username && (
          <p className="text-sm text-muted">@{user.username}</p>
        )}
        <p className="mt-2 text-sm text-muted">Enter your PIN</p>
      </div>

      <PinPad
        value={pin}
        onChange={setPin}
        onComplete={(code) => void submitPin(code)}
        disabled={loading}
      />

      {error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex flex-col gap-2 text-sm">
        <button
          type="button"
          onClick={onUsePassword}
          className="font-semibold text-gold-dark hover:underline"
        >
          Use email & password instead
        </button>
        <button
          type="button"
          onClick={onSwitchAccount}
          className="text-muted hover:text-foreground"
        >
          Not you? Switch account
        </button>
      </div>
    </div>
  );
}
