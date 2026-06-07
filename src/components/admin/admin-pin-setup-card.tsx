"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminPinSetupCard() {
  const [hasAdminPin, setHasAdminPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/pin/verify")
      .then((r) => r.json())
      .then((d: { hasAdminPin?: boolean }) => setHasAdminPin(Boolean(d.hasAdminPin)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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

    setBusy(true);
    const res = await fetch("/api/admin/pin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin,
        confirmPin,
        currentPin: hasAdminPin ? currentPin : undefined,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not save PIN.");
      return;
    }

    setMessage(hasAdminPin ? "Admin PIN updated." : "Admin PIN set.");
    setHasAdminPin(true);
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Your admin PIN</h2>
      <p className="mt-2 text-sm text-muted">
        {hasAdminPin === false
          ? "Set a 6-digit PIN to confirm sensitive admin actions."
          : "Change your PIN if you forgot it or need a new one. Other super admins can reset staff PINs from Staff accounts."}
      </p>

      {hasAdminPin === null ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          {hasAdminPin && (
            <label className="block text-xs font-semibold text-muted">
              Current PIN
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={currentPin}
                onChange={(e) =>
                  setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                className="mt-1 text-center tracking-[0.4em]"
              />
            </label>
          )}
          <label className="block text-xs font-semibold text-muted">
            {hasAdminPin ? "New PIN" : "PIN"}
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
          <label className="block text-xs font-semibold text-muted">
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
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <Button
            type="submit"
            disabled={busy || pin.length !== 6 || confirmPin.length !== 6}
          >
            {busy ? "Saving…" : hasAdminPin ? "Update admin PIN" : "Set admin PIN"}
          </Button>
        </form>
      )}
    </div>
  );
}
