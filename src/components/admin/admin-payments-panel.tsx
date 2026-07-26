"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type Tx = {
  id: string;
  user_id: string;
  reference: string;
  order_type: string;
  amount: number;
  currency: string;
  status: string;
  listing_id?: string | null;
  provider?: string | null;
  gateway?: string | null;
  channel?: string | null;
  fees?: number | null;
  paystack_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
};

type Summary = {
  pending: number;
  processing: number;
  successful: number;
  failed: number;
  revenueSuccessful: number;
};

export function AdminPaymentsPanel() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      event_type: string | null;
      reference: string | null;
      status: string;
      error_message: string | null;
      created_at: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q, nextStatus = status) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextStatus) params.set("status", nextStatus);
    params.set("limit", "80");

    const [txRes, whRes] = await Promise.all([
      fetch(`/api/admin/payments/transactions?${params.toString()}`),
      fetch(`/api/admin/payments/webhooks?limit=40`),
    ]);

    const txData = (await txRes.json()) as {
      transactions?: Tx[];
      summary?: Summary;
      error?: string;
    };
    const whData = (await whRes.json()) as {
      events?: typeof events;
      error?: string;
    };

    if (!txRes.ok) {
      setError(txData.error ?? "Could not load transactions");
      setLoading(false);
      return;
    }

    setTransactions(txData.transactions ?? []);
    setSummary(txData.summary ?? null);
    if (whRes.ok) setEvents(whData.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Pending" value={String(summary.pending)} />
          <Metric label="Processing" value={String(summary.processing)} />
          <Metric label="Successful" value={String(summary.successful)} />
          <Metric label="Failed" value={String(summary.failed)} />
          <Metric
            label="Successful volume"
            value={formatPrice(summary.revenueSuccessful, "total", "sale")}
          />
        </div>
      ) : null}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reference…"
          className="min-w-[200px] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white"
        >
          Search
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading…</p> : null}

      <section className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Purpose</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/70">
                <td className="px-3 py-2 font-mono text-xs">{tx.reference}</td>
                <td className="px-3 py-2 capitalize">{tx.order_type.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 tabular-nums">
                  {formatPrice(Number(tx.amount), "total", "sale")}
                </td>
                <td className="px-3 py-2 font-semibold">{tx.status}</td>
                <td className="px-3 py-2 text-muted">{tx.channel ?? "—"}</td>
                <td className="px-3 py-2 text-muted">
                  {new Date(tx.created_at).toLocaleString("en-NG")}
                </td>
              </tr>
            ))}
            {!loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  No transactions found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy">Webhook logs</h2>
        <p className="mt-1 text-sm text-muted">
          Paystack deliveries — invalid signatures are rejected before insert.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Error</th>
                <th className="px-3 py-2">Received</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-border/70">
                  <td className="px-3 py-2">{ev.event_type ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{ev.reference ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold">{ev.status}</td>
                  <td className="px-3 py-2 text-muted">{ev.error_message ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">
                    {new Date(ev.created_at).toLocaleString("en-NG")}
                  </td>
                </tr>
              ))}
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    No webhook events yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy tabular-nums">{value}</p>
    </div>
  );
}
