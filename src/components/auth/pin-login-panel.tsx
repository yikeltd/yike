"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { cn } from "@/lib/utils";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import { CONSUMER_AUTH_DEFAULT_NEXT } from "@/lib/auth/safe-next-path";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import type { PinLoginGateReason } from "@/lib/auth/pin-login-gate.types";
import {
  clearPinPreflightCache,
  PIN_PREFLIGHT_TIMEOUT_MS,
  readCachedPinPreflight,
  requestPinLogin,
  requestPinPreflight,
  shouldApplyPinAsyncResult,
} from "@/lib/auth/pin-login-client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

type PinAuthPhase = "checking" | "pin" | "submitting";

export type PinRequirePasswordPayload = {
  message: string;
  reason?: PinLoginGateReason;
  pinLocked?: boolean;
  prefillEmail?: string;
};

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

function PinUserHeader({
  user,
  subtitle,
}: {
  user: {
    email: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  subtitle: string;
}) {
  const displayName = user.fullName ?? user.username ?? "Welcome back";

  return (
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
      <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
        {AUTH_USER_MESSAGES.welcomeBack(displayName)}
      </p>
      <h2 className="mt-1 text-xl font-bold text-navy">{displayName}</h2>
      {user.username ? <p className="text-sm text-muted">@{user.username}</p> : null}
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function PinLoginPanel({
  user,
  nextPath,
  onSwitchAccount,
  onUsePassword,
  onRequirePassword,
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
  onRequirePassword: (payload: PinRequirePasswordPayload) => void;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<PinAuthPhase>("checking");
  const [preflightError, setPreflightError] = useState("");
  const submitGeneration = useRef(0);
  const preflightGeneration = useRef(0);
  const preflightAbortRef = useRef<AbortController | null>(null);
  const preflightSucceededRef = useRef(false);
  const lastIdentifierRef = useRef("");
  const onRequirePasswordRef = useRef(onRequirePassword);

  /** Stable server lookup — email is always present on quick-login users. */
  const identifier = user.email.trim();

  useEffect(() => {
    onRequirePasswordRef.current = onRequirePassword;
  }, [onRequirePassword]);

  useEffect(() => {
    if (lastIdentifierRef.current === identifier) return;
    lastIdentifierRef.current = identifier;
    preflightSucceededRef.current = false;
  }, [identifier]);

  const runPreflight = useCallback(
    async (options?: { force?: boolean; signal?: AbortSignal }) => {
      if (!identifier) return;
      if (preflightSucceededRef.current && !options?.force) {
        setPhase("pin");
        return;
      }

      if (!options?.force) {
        const cached = readCachedPinPreflight(identifier);
        if (cached?.canUsePin) {
          preflightSucceededRef.current = true;
          setPhase("pin");
          return;
        }
      } else {
        clearPinPreflightCache(identifier);
        preflightSucceededRef.current = false;
      }

      const generation = ++preflightGeneration.current;
      setPhase("checking");
      setPreflightError("");
      setError("");
      setPin("");

      const outcome = await requestPinPreflight({
        identifier,
        bypassCache: options?.force,
        signal: options?.signal,
      });

      if (!shouldApplyPinAsyncResult(generation, preflightGeneration.current)) return;

      if (!outcome.ok) {
        if (outcome.kind === "aborted") return;
        setPreflightError(outcome.message);
        return;
      }

      const data = outcome.data;
      if (!data.canUsePin) {
        onRequirePasswordRef.current({
          message: data.message ?? AUTH_USER_MESSAGES.newDevicePinBlocked,
          reason: data.reason,
          pinLocked: data.pinLocked,
          prefillEmail: user.email,
        });
        return;
      }

      preflightSucceededRef.current = true;
      setPhase("pin");
    },
    [identifier, user.email]
  );

  useEffect(() => {
    const controller = new AbortController();
    void runPreflight({ signal: controller.signal });
    return () => {
      controller.abort();
      preflightGeneration.current += 1;
    };
  }, [runPreflight]);

  useEffect(() => {
    if (phase !== "checking" || preflightError) return;
    const watchdog = window.setTimeout(() => {
      setPreflightError(
        "This is taking too long. Check your connection and try again, or use your password."
      );
    }, PIN_PREFLIGHT_TIMEOUT_MS + 1_500);
    return () => window.clearTimeout(watchdog);
  }, [phase, preflightError]);

  async function submitPin(code: string) {
    if (phase !== "pin") return;

    preflightAbortRef.current?.abort();
    const generation = ++submitGeneration.current;
    setPhase("submitting");
    setError("");

    const outcome = await requestPinLogin({
      identifier,
      pin: code,
    });

    if (!shouldApplyPinAsyncResult(generation, submitGeneration.current)) return;

    if (!outcome.ok) {
      if (outcome.data?.requiresPassword) {
        onRequirePasswordRef.current({
          message: outcome.data.error ?? AUTH_USER_MESSAGES.newDevicePinBlocked,
          reason: outcome.data.reason,
          pinLocked: outcome.data.pinLocked,
          prefillEmail: user.email,
        });
        return;
      }
      setError(outcome.message);
      setPin("");
      setPhase("pin");
      return;
    }

    const data = outcome.data;
    if (data.profile) {
      saveQuickLoginUser({
        userId: data.profile.id,
        email: data.profile.email,
        fullName: data.profile.full_name,
        username: data.profile.username,
        avatarUrl: data.profile.avatar_url,
      });
    }

    const resumed = await resumePendingAuthIntent(router, {
      fallbackPath: nextPath || CONSUMER_AUTH_DEFAULT_NEXT,
      emailVerified: true,
    });
    if (!resumed) router.refresh();
  }

  const padDisabled = phase !== "pin";

  if (phase === "checking" && !preflightError) {
    return (
      <div className="space-y-6 text-center" aria-live="polite">
        <PinUserHeader user={user} subtitle={AUTH_USER_MESSAGES.pinDeviceChecking} />
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-gold" aria-hidden />
        <button
          type="button"
          onClick={onUsePassword}
          className="text-sm font-semibold text-gold-dark hover:underline"
        >
          {AUTH_USER_MESSAGES.usePasswordInstead}
        </button>
      </div>
    );
  }

  if (preflightError) {
    return (
      <div className="space-y-5 text-center">
        <PinUserHeader user={user} subtitle={AUTH_USER_MESSAGES.pinPrompt} />
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{preflightError}</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void runPreflight({ force: true })}
            className="pressable rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onUsePassword}
            className="text-sm font-semibold text-gold-dark hover:underline"
          >
            {AUTH_USER_MESSAGES.usePasswordInstead}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <PinUserHeader user={user} subtitle={AUTH_USER_MESSAGES.pinPrompt} />

      <PinPad
        value={pin}
        onChange={setPin}
        onComplete={(code) => void submitPin(code)}
        disabled={padDisabled}
      />

      {phase === "submitting" && (
        <p className="text-sm text-muted" aria-live="polite">
          Signing in…
        </p>
      )}

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="flex flex-col gap-2 text-sm">
        <button
          type="button"
          onClick={onUsePassword}
          className="font-semibold text-gold-dark hover:underline"
        >
          {AUTH_USER_MESSAGES.forgotPin}
        </button>
        <button
          type="button"
          onClick={onSwitchAccount}
          className="text-muted hover:text-foreground"
        >
          {AUTH_USER_MESSAGES.switchAccount}
        </button>
      </div>
    </div>
  );
}
