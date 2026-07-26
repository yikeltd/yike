"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "loading" | "set" | "change" | "forgot";

export function AdminPinSetupCard() {
  const [mode, setMode] = useState<Mode>("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/pin/verify")
      .then((r) => r.json())
      .then((d: { hasAdminPin?: boolean }) => {
        setMode(d.hasAdminPin ? "change" : "set");
      })
      .catch(() => setMode("set"));
  }, []);

  function enterForgotMode() {
    setError("");
    setMessage(
      "Enter a new 6-digit PIN below. You do not need the old one while you are signed into Lex."
    );
    setCurrentPin("");
    setPin("");
    setConfirmPin("");
    setMode("forgot");
  }

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
    if (mode === "change" && currentPin.length !== 6) {
      setError("Enter your current PIN, or tap “I forgot my PIN”.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/admin/pin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pin,
        confirmPin,
        currentPin: mode === "change" ? currentPin : undefined,
        replaceForgotten: mode === "forgot",
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not save PIN.");
      return;
    }

    setMessage(
      mode === "set"
        ? "Admin PIN set. Use it to confirm sensitive actions."
        : mode === "forgot"
          ? "New admin PIN saved. Your previous PIN no longer works."
          : "Admin PIN updated."
    );
    setMode("change");
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
  }

  const showCurrent = mode === "change";
  const titlePinLabel = mode === "change" ? "New PIN" : "PIN";

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Your admin PIN</h2>
      <p className="mt-2 text-sm text-muted">
        {mode === "set"
          ? "Set a 6-digit PIN to confirm sensitive admin actions."
          : mode === "forgot"
            ? "Recover your admin PIN while signed into Lex — no old PIN required."
            : "Change your PIN anytime. If you forget it, use recovery below — you will not be locked out of Lex."}
      </p>

      {mode === "loading" ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          {showCurrent && (
            <label className="block text-xs font-semibold text-muted">
              Current PIN
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
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

          {(mode === "change" || mode === "forgot") && (
            <div className="rounded-xl border border-navy/10 bg-surface px-3 py-2">
              {mode === "change" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={enterForgotMode}
                  className="text-left text-xs font-semibold text-navy underline-offset-2 hover:underline"
                >
                  I forgot my PIN — set a new one without the current PIN
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMode("change");
                    setMessage("");
                    setError("");
                  }}
                  className="text-left text-xs font-semibold text-muted underline-offset-2 hover:underline"
                >
                  Back — I remember my current PIN
                </button>
              )}
            </div>
          )}

          <label className="block text-xs font-semibold text-muted">
            {titlePinLabel}
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
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
              autoComplete="new-password"
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
            disabled={
              busy ||
              pin.length !== 6 ||
              confirmPin.length !== 6 ||
              (mode === "change" && currentPin.length !== 6)
            }
          >
            {busy
              ? "Saving…"
              : mode === "set"
                ? "Set admin PIN"
                : mode === "forgot"
                  ? "Save new admin PIN"
                  : "Update admin PIN"}
          </Button>
        </form>
      )}
    </div>
  );
}
