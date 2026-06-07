"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { PinPad } from "./pin-login-panel";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";

export function SensitiveConfirmModal({
  open,
  action,
  onClose,
  onConfirmed,
}: {
  open: boolean;
  action: string;
  onClose: () => void;
  onConfirmed: (result: { requiresOtp?: boolean; confirmationToken?: string }) => void;
}) {
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (payload: { pin?: string; password?: string }) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/sensitive/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? AUTH_USER_MESSAGES.sensitiveConfirm);
          setPin("");
          return;
        }
        setPin("");
        setPassword("");
        onConfirmed({
          requiresOtp: data.requiresOtp,
          confirmationToken: data.confirmationToken,
        });
      } catch {
        setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [action, onConfirmed]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-elevated p-6 shadow-float-lg sm:m-4 sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 text-xl font-bold text-foreground">Confirm it&apos;s you</h2>
        <p className="mt-1 text-sm text-muted">{AUTH_USER_MESSAGES.sensitiveConfirm}</p>

        <div className="mt-4">
          {mode === "pin" ? (
            <>
              <PinPad
                value={pin}
                onChange={setPin}
                onComplete={(code) => void submit({ pin: code })}
                disabled={loading}
              />
              <button
                type="button"
                className="mt-4 w-full text-sm font-semibold text-gold-dark hover:underline"
                onClick={() => setMode("password")}
              >
                Use password instead
              </button>
            </>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submit({ password });
              }}
            >
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="h-12 rounded-xl"
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth disabled={loading}>
                Confirm
              </Button>
              <button
                type="button"
                className="w-full text-sm font-semibold text-gold-dark hover:underline"
                onClick={() => setMode("pin")}
              >
                Use PIN instead
              </button>
            </form>
          )}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

export function useSensitiveConfirm() {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("generic");
  const [resolver, setResolver] = useState<
    ((value: { ok: boolean; requiresOtp?: boolean; confirmationToken?: string }) => void) | null
  >(null);

  const confirmSensitiveAction = useCallback((actionKey: string) => {
    return new Promise<{ ok: boolean; requiresOtp?: boolean; confirmationToken?: string }>(
      (resolve) => {
        setAction(actionKey);
        setResolver(() => resolve);
        setOpen(true);
      }
    );
  }, []);

  const modal = (
    <SensitiveConfirmModal
      open={open}
      action={action}
      onClose={() => {
        setOpen(false);
        resolver?.({ ok: false });
        setResolver(null);
      }}
      onConfirmed={(result) => {
        setOpen(false);
        resolver?.({ ok: true, ...result });
        setResolver(null);
      }}
    />
  );

  return { confirmSensitiveAction, sensitiveConfirmModal: modal };
}
