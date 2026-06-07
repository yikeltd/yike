"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type QueueRow = {
  id: string;
  ambassador_code: string;
  full_name: string | null;
  email: string | null;
  assigned_city: string;
  fraud_flags_count: number;
  payout_enabled: boolean;
  payout_hold_reason: string | null;
  bank_change_pending_review: boolean;
  amounts: { payable: number; pending: number; held: number; hidden: number };
  bank: {
    bank_name: string;
    bank_code: string;
    account_number: string;
    account_name: string;
    bank_change_pending_review: boolean;
  } | null;
  lastPayout: { paid_at: string | null; payable_amount: number; status: string } | null;
};

type PayoutRow = {
  id: string;
  payable_amount: number;
  status: string;
  period_year_month: string;
  paid_at: string | null;
  city_ambassadors?: { ambassador_code: string; full_name: string | null };
};

export function AdminAmbassadorPayoutsBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [bankReviews, setBankReviews] = useState<QueueRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ambassadors/payouts");
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
      const res = await fetch("/api/admin/ambassadors/payouts", {
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800">
            Bank change reviews
          </h2>
          {bankReviews.map((row) => (
            <div key={row.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-navy">
                {row.full_name ?? row.ambassador_code} · {row.assigned_city}
              </p>
              {row.bank ? (
                <p className="mt-1 text-xs text-muted">
                  {row.bank.bank_name} ({row.bank.bank_code}) · {row.bank.account_number} ·{" "}
                  {row.bank.account_name}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">No bank details on file</p>
              )}
              <button
                type="button"
                onClick={() => runAction({ action: "approve_bank", ambassadorId: row.id })}
                className="mt-3 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
              >
                Approve bank & enable payouts
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Payout queue</h2>
        {queue.map((row) => (
          <div key={row.id} className="rounded-xl border border-surface bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">
                  {row.ambassador_code} · {row.full_name ?? row.email}
                </p>
                <p className="text-xs text-muted">
                  Payable ₦{row.amounts.payable.toLocaleString()} · Pending ₦
                  {row.amounts.pending.toLocaleString()} · Held ₦{row.amounts.held.toLocaleString()}
                  {row.fraud_flags_count > 0 ? ` · ${row.fraud_flags_count} fraud flags` : ""}
                </p>
                {row.bank ? (
                  <p className="mt-1 text-xs text-muted">
                    {row.bank.bank_name} · {row.bank.account_number} · {row.bank.account_name}
                  </p>
                ) : null}
                {!row.payout_enabled ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Payouts disabled{row.payout_hold_reason ? `: ${row.payout_hold_reason}` : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={row.amounts.payable <= 0}
                  onClick={() =>
                    runAction({ action: "create_queue", ambassadorId: row.id })
                  }
                  className="rounded-lg bg-navy px-3 py-1 text-xs font-bold text-white disabled:opacity-40"
                >
                  Queue payout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runAction({
                      action: "freeze_ambassador",
                      ambassadorId: row.id,
                      notes: "Payout freeze",
                    })
                  }
                  className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-700"
                >
                  Freeze
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Payout history</h2>
        {payouts.map((p) => (
          <div key={p.id} className="rounded-xl border border-surface bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-bold text-navy">
                  {p.city_ambassadors?.ambassador_code} · ₦
                  {Number(p.payable_amount).toLocaleString()}
                </p>
                <p className="text-xs text-muted">
                  {p.period_year_month} · {p.status}
                  {p.paid_at ? ` · paid ${new Date(p.paid_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              {p.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => runAction({ action: "approve", payoutId: p.id })}
                    className="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction({ action: "mark_paid", payoutId: p.id })}
                    className="rounded-lg bg-navy px-3 py-1 text-xs font-bold text-white"
                  >
                    Mark paid
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction({ action: "hold", payoutId: p.id })}
                    className="rounded-lg border px-3 py-1 text-xs font-bold"
                  >
                    Hold
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
