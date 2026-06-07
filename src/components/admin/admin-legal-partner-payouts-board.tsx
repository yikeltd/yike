"use client";

import { useCallback, useEffect, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type QueueRow = {
  id: string;
  partner_code: string;
  full_name: string | null;
  firm_name: string;
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
  legal_partners?: { partner_code: string; full_name: string | null; firm_name: string };
};

export function AdminLegalPartnerPayoutsBoard() {
  const { requirePin, pinModal } = usePinGate();
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [bankReviews, setBankReviews] = useState<QueueRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/legal-partners/payouts");
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
      const res = await fetch("/api/admin/legal-partners/payouts", {
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
                {row.firm_name} · {row.partner_code}
              </p>
              {row.bank ? (
                <p className="text-xs text-muted mt-1">
                  {row.bank.bank_name} · {row.bank.account_number} · {row.bank.account_name}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => runAction({ action: "approve_bank", partnerId: row.id })}
                className="mt-2 rounded-lg bg-gold px-3 py-1 text-xs font-bold text-navy"
              >
                Approve bank
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-navy">Payout queue</h2>
        {queue.map((row) => (
          <div key={row.id} className="rounded-xl border bg-white p-4 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-bold text-navy">
                {row.firm_name} · {row.partner_code}
              </p>
              <p className="text-xs text-muted">
                Payable ₦{row.amounts.payable.toLocaleString()} · Pending ₦
                {row.amounts.pending.toLocaleString()} · Held ₦{row.amounts.held.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => runAction({ action: "create_queue", partnerId: row.id })}
                className="rounded-lg border px-2 py-1 text-xs font-bold"
              >
                Queue payout
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-navy">Recent payouts</h2>
        {payouts.map((p) => (
          <div key={p.id} className="rounded-xl border bg-white p-4 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-bold text-navy">
                {p.legal_partners?.firm_name ?? p.legal_partners?.partner_code}
              </p>
              <p className="text-xs text-muted">
                ₦{Number(p.payable_amount).toLocaleString()} · {p.period_year_month} · {p.status}
              </p>
            </div>
            {p.status === "pending" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => runAction({ action: "approve", payoutId: p.id })}
                  className="rounded-lg bg-gold px-2 py-1 text-xs font-bold text-navy"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => runAction({ action: "hold", payoutId: p.id })}
                  className="rounded-lg border px-2 py-1 text-xs font-bold"
                >
                  Hold
                </button>
              </div>
            ) : null}
            {p.status === "approved" ? (
              <button
                type="button"
                onClick={() => runAction({ action: "mark_paid", payoutId: p.id })}
                className="rounded-lg border px-2 py-1 text-xs font-bold text-emerald-700"
              >
                Mark paid
              </button>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
