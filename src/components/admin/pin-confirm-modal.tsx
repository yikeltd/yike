"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onVerified: (sessionToken?: string) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
};

export function PinConfirmModal({
  onVerified,
  onCancel,
  title = "Confirm with admin PIN",
  description = "Enter your 6-digit PIN to authorise this action.",
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/pin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (!res.ok || !data.ok) {
      setLoading(false);
      setError(data.error ?? "Invalid PIN.");
      return;
    }

    await onVerified();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" fullWidth disabled={loading || pin.length !== 6}>
              {loading ? "Verifying…" : "Confirm"}
            </Button>
          </div>
        </form>
        <p className="mt-3 text-center text-[10px] text-muted">
          PIN valid for 10 minutes after verification
        </p>
      </div>
    </div>
  );
}

export function usePinGate() {
  const [showPin, setShowPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  function requirePin(action: () => void | Promise<void>) {
    setPendingAction(() => action);
    setShowPin(true);
  }

  async function onVerified() {
    if (pendingAction) await pendingAction();
    setShowPin(false);
    setPendingAction(null);
  }

  const modal = showPin ? (
    <PinConfirmModal
      onVerified={onVerified}
      onCancel={() => {
        setShowPin(false);
        setPendingAction(null);
      }}
    />
  ) : null;

  return { requirePin, pinModal: modal };
}
