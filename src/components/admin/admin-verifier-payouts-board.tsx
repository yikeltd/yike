"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type QueueRow = {
  id: string;
  verifier_code: string;
  full_name: string | null;
  assigned_city: string;
  payout_enabled: boolean;
  bank_change_pending_review: boolean;
  amounts: { payable: number; pending: number; held: number };
  bank: {
    bank_name: string;
    account_number: string;
    account_name: string;
  } | null;
};

type PayoutRow = {
  id: string;
  payable_amount: number;
  status: string;
  period_year_month: string;
  field_verifiers?: { verifier_code: string; full_name: string | null };
};

export function AdminVerifierPayoutsBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [bankReviews, setBankReviews] = useState<QueueRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/verifiers/payouts");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setQueue(json.queue ?? []);
    setPayouts(json.payouts ?? []);
    setBankReviews(json.bankReviews ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(body: Record<string, unknown>) {
    await requirePin(async () => {
      const res = await fetch("/api/admin/verifiers/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Action completed" : (json.error ?? "Failed"));
      await load();
    });
  }

  return (
    <div className="space-y-6">
      {pinModal}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {bankReviews.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-amber-800">Bank change reviews</h2>
          {bankReviews.map((row) => (
            <div key={row.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-navy">
                {row.full_name ?? row.verifier_code} · {row.assigned_city}
              </p>
              {row.bank ? (
                <p className="text-xs text-muted mt-1">
                  {row.bank.bank_name} · {row.bank.account_number} · {row.bank.account_name}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => runAction({ action: "approve_bank", verifierId: row.id })}
                className="mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
              >
                Approve bank & enable payouts
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-navy">Verifier payout queue</h2>
        {queue.map((row) => (
          <div key={row.id} className="rounded-xl border bg-white p-4">
            <p className="font-bold text-navy">
              {row.full_name ?? row.verifier_code} · {row.assigned_city}
            </p>
            <p className="text-xs text-muted">
              Payable ₦{row.amounts.payable.toLocaleString()} · Pending ₦
              {row.amounts.pending.toLocaleString()} · Held ₦{row.amounts.held.toLocaleString()}
              {!row.payout_enabled ? " · payouts frozen" : ""}
            </p>
            {row.amounts.payable > 0 ? (
              <button
                type="button"
                onClick={() => runAction({ action: "create_queue", verifierId: row.id })}
                className="mt-2 rounded-lg bg-navy px-3 py-1 text-xs font-bold text-gold"
              >
                Queue payout
              </button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-navy">Recent payouts</h2>
        {payouts.map((p) => (
          <div key={p.id} className="rounded-lg border bg-white px-3 py-2 text-sm flex flex-wrap justify-between gap-2">
            <span>
              {p.field_verifiers?.full_name ?? p.field_verifiers?.verifier_code} · {p.period_year_month} · ₦
              {Number(p.payable_amount).toLocaleString()} · {p.status}
            </span>
            {p.status === "pending" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runAction({ action: "approve", payoutId: p.id })}
                  className="text-xs font-bold text-gold-dark"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => runAction({ action: "mark_paid", payoutId: p.id })}
                  className="text-xs font-bold text-emerald-700"
                >
                  Mark paid
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
