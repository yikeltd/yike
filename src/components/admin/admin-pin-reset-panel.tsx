"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";

type PinType = "login" | "admin";

type Props = {
  profileId: string;
  pinType: PinType;
  label?: string;
  compact?: boolean;
};

export function AdminPinResetPanel({
  profileId,
  pinType,
  label,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showPinGate, setShowPinGate] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title =
    label ??
    (pinType === "admin" ? "Reset admin PIN" : "Reset login PIN");

  async function applyReset() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/profiles/${profileId}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinType, pin }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Reset failed");
      return;
    }

    setMessage(`${title} complete. Share the new PIN securely with the user.`);
    setPin("");
    setConfirmPin("");
    setOpen(false);
    setShowPinGate(false);
  }

  function startReset() {
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    setOpen(false);
    setShowPinGate(true);
  }

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy/10 hover:bg-surface"
        >
          {title}
        </button>

        {open && (
          <PinResetDialog
            title={title}
            pin={pin}
            confirmPin={confirmPin}
            error={error}
            message={message}
            busy={busy}
            onPinChange={setPin}
            onConfirmChange={setConfirmPin}
            onClose={() => {
              setOpen(false);
              setError("");
            }}
            onSubmit={startReset}
          />
        )}

        {showPinGate && (
          <PinConfirmModal
            title="Confirm PIN reset"
            description="Enter your admin PIN to authorise this reset."
            onVerified={() => void applyReset()}
            onCancel={() => setShowPinGate(false)}
          />
        )}
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-3">
      <div>
        <h2 className="font-bold text-navy">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          Set a new 6-digit PIN when the user cannot reset it themselves.
        </p>
      </div>

      <label className="block text-xs font-semibold text-muted max-w-xs">
        New PIN
        <Input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className="mt-1 text-center tracking-[0.4em]"
        />
      </label>
      <label className="block text-xs font-semibold text-muted max-w-xs">
        Confirm PIN
        <Input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={confirmPin}
          onChange={(e) =>
            setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="••••••"
          className="mt-1 text-center tracking-[0.4em]"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      <Button
        disabled={busy || pin.length !== 6 || confirmPin.length !== 6}
        onClick={() => setShowPinGate(true)}
      >
        {busy ? "Saving…" : title}
      </Button>

      {showPinGate && (
        <PinConfirmModal
          title="Confirm PIN reset"
          description="Enter your admin PIN to authorise this reset."
          onVerified={() => void applyReset()}
          onCancel={() => setShowPinGate(false)}
        />
      )}
    </section>
  );
}

function PinResetDialog({
  title,
  pin,
  confirmPin,
  error,
  message,
  busy,
  onPinChange,
  onConfirmChange,
  onClose,
  onSubmit,
}: {
  title: string;
  pin: string;
  confirmPin: string;
  error: string;
  message: string;
  busy: boolean;
  onPinChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-navy">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          Enter a new 6-digit PIN for this account.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => onPinChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="New PIN"
            className="text-center tracking-[0.4em]"
          />
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirmPin}
            onChange={(e) =>
              onConfirmChange(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="Confirm PIN"
            className="text-center tracking-[0.4em]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            disabled={busy || pin.length !== 6 || confirmPin.length !== 6}
            onClick={onSubmit}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
