"use client";

import { useCallback, useEffect, useState } from "react";
import { formatYc } from "@/lib/yike-coins/constants";

type GrantRow = {
  id: string;
  grant_reference: string;
  amount_coins: number;
  reason: string;
  created_at: string;
  actor_id: string;
  recipient_id: string;
};

function idempotencyKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `admin:${crypto.randomUUID()}`
    : `admin:${Date.now()}`;
}

export function YikeCoinsGrantClient() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [grants, setGrants] = useState<GrantRow[]>([]);

  const [adjustUsername, setAdjustUsername] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustReference, setAdjustReference] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const loadGrants = useCallback(async () => {
    const res = await fetch("/api/admin/yike-coins/grant?limit=20");
    const json = await res.json();
    if (res.ok) setGrants(json.grants ?? []);
  }, []);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    setAdjustSubmitting(true);
    setAdjustError(null);
    setAdjustSuccess(null);
    try {
      const ref =
        adjustReference.trim() ||
        `ADJ-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`;
      const res = await fetch("/api/admin/yike-coins/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey(),
        },
        body: JSON.stringify({
          recipientUsername: adjustUsername.trim().replace(/^@/, ""),
          direction: adjustDirection,
          amountCoins: Number(adjustAmount),
          reason: adjustReason.trim(),
          reference: ref,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAdjustError(json.error ?? "Adjustment failed");
        return;
      }
      setAdjustSuccess(
        `${adjustDirection === "credit" ? "Credited" : "Debited"} ${formatYc(Number(adjustAmount))} — ref ${ref}. Balance now ${formatYc(json.balanceAfter)}.`,
      );
      setAdjustAmount("");
      setAdjustReason("");
      void loadGrants();
    } finally {
      setAdjustSubmitting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/yike-coins/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey(),
        },
        body: JSON.stringify({
          recipientUsername: username.trim().replace(/^@/, ""),
          amountCoins: Number(amount),
          reason: reason.trim(),
          reference: reference.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Grant failed");
        return;
      }
      setSuccess(
        `Granted ${formatYc(Number(amount))} — ref ${json.grantReference}. New balance ${formatYc(json.balanceAfter)}.`
      );
      setAmount("");
      setReason("");
      void loadGrants();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="max-w-md space-y-3 rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Grant YC</h2>
        <p className="text-xs text-muted">Super Admin / Admin only. Creates new YC supply with audit trail.</p>
        <label className="block text-xs font-semibold">
          Recipient username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
            required
          />
        </label>
        <label className="block text-xs font-semibold">
          Amount (YC)
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
            required
          />
        </label>
        <label className="block text-xs font-semibold">
          Purpose (required)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full min-h-[72px] rounded-lg border px-3 py-2 text-sm"
            required
            minLength={3}
          />
        </label>
        <label className="block text-xs font-semibold">
          Reference (optional)
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="pressable min-h-[44px] w-full rounded-lg bg-gold font-bold text-navy disabled:opacity-50"
        >
          {submitting ? "Granting…" : "Confirm grant"}
        </button>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        {success ? <p className="text-xs text-emerald-800">{success}</p> : null}
      </form>

      <form
        onSubmit={submitAdjust}
        className="max-w-md space-y-3 rounded-xl border border-navy/10 bg-white p-5"
      >
        <h2 className="text-lg font-bold text-navy">Credit or debit balance</h2>
        <p className="text-xs text-muted">
          Super Admin only. Uses the secure ledger RPC with audit trail (includes debits).
        </p>
        <label className="block text-xs font-semibold">
          Recipient username
          <input
            value={adjustUsername}
            onChange={(e) => setAdjustUsername(e.target.value)}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
            required
          />
        </label>
        <label className="block text-xs font-semibold">
          Direction
          <select
            value={adjustDirection}
            onChange={(e) => setAdjustDirection(e.target.value as "credit" | "debit")}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
          >
            <option value="credit">Credit (add YC)</option>
            <option value="debit">Debit (remove YC)</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">
          Amount (YC)
          <input
            inputMode="numeric"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
            required
          />
        </label>
        <label className="block text-xs font-semibold">
          Reason (required)
          <textarea
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="mt-1 w-full min-h-[72px] rounded-lg border px-3 py-2 text-sm"
            required
            minLength={3}
          />
        </label>
        <label className="block text-xs font-semibold">
          Reference (optional)
          <input
            value={adjustReference}
            onChange={(e) => setAdjustReference(e.target.value)}
            className="mt-1 w-full min-h-[40px] rounded-lg border px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={adjustSubmitting}
          className="pressable min-h-[44px] w-full rounded-lg bg-navy font-bold text-gold disabled:opacity-50"
        >
          {adjustSubmitting ? "Applying…" : "Confirm adjustment"}
        </button>
        {adjustError ? <p className="text-xs text-red-700">{adjustError}</p> : null}
        {adjustSuccess ? <p className="text-xs text-emerald-800">{adjustSuccess}</p> : null}
      </form>

      <div>
        <h3 className="text-sm font-bold text-navy">Recent grants</h3>
        <ul className="mt-2 divide-y rounded-lg border bg-white text-sm">
          {grants.length === 0 ? (
            <li className="p-3 text-muted">No grants yet.</li>
          ) : (
            grants.map((g) => (
              <li key={g.id} className="p-3">
                <p className="font-semibold">
                  {formatYc(g.amount_coins)} · {g.grant_reference}
                </p>
                <p className="text-xs text-muted">{g.reason}</p>
                <p className="text-[10px] text-muted">{new Date(g.created_at).toLocaleString()}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
