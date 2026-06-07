"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PinPad } from "./pin-login-panel";
import { Button } from "@/components/ui/button";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";

export function PinSetupModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function reset() {
    setPin("");
    setConfirm("");
    setStep("enter");
    setError("");
  }

  async function savePin(code: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save PIN.");
        reset();
        return;
      }
      reset();
      onComplete();
    } catch {
      setError("Network error. Try again.");
      reset();
    } finally {
      setLoading(false);
    }
  }

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

        <h2 className="pr-8 text-xl font-bold text-foreground">
          {AUTH_USER_MESSAGES.pinSetupTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">{AUTH_USER_MESSAGES.pinSetupBody}</p>
        <p className="mt-2 text-xs text-muted">
          {step === "enter" ? "Choose your PIN" : "Confirm your PIN"}
        </p>

        <div className="mt-4">
          <PinPad
            value={step === "enter" ? pin : confirm}
            onChange={(v) => (step === "enter" ? setPin(v) : setConfirm(v))}
            onComplete={(code) => {
              if (step === "enter") {
                setStep("confirm");
                return;
              }
              if (code !== pin) {
                setError("PINs don't match. Try again.");
                reset();
                return;
              }
              void savePin(code);
            }}
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <Button type="button" variant="ghost" className="mt-4 w-full" onClick={onClose} disabled={loading}>
          Set up later
        </Button>
      </div>
    </div>
  );
}
