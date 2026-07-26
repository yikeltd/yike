"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Tx = {
  id: string;
  reference: string;
  purpose: string;
  amount: number;
  currency: string;
  status: string;
  listingId: string | null;
  paidAt: string | null;
  createdAt: string;
};

function statusLabel(status: string): string {
  switch (status) {
    case "successful":
      return "Successful";
    case "processing":
    case "pending":
      return "Processing";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

function purposeLabel(purpose: string): string {
  return purpose.replace(/_/g, " ");
}

export function PaymentHistoryClient() {
  const [items, setItems] = useState<Tx[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/payments/history");
      const data = (await res.json()) as {
        transactions?: Tx[];
        error?: string;
      };
      if (res.status === 401) {
        setError("Sign in to view your payment history.");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not load payments");
        return;
      }
      setItems(data.transactions ?? []);
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 text-center">
        <p className="text-sm text-muted">{error}</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-semibold text-navy">
          Sign in
        </Link>
      </div>
    );
  }

  if (!items) {
    return <p className="text-sm text-muted">Loading payments…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-navy">No payments yet</h2>
        <p className="mt-2 text-sm text-muted">
          Featured listings, boosts, and plans will show up here.
        </p>
        <Link
          href="/agent/listings"
          className="mt-6 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy"
        >
          Go to listings
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((tx) => (
        <li
          key={tx.id}
          className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold capitalize text-navy">
                {purposeLabel(tx.purpose)}
              </p>
              <p className="mt-1 text-xs text-muted font-mono">{tx.reference}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(tx.createdAt).toLocaleString("en-NG")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-navy tabular-nums">
                {formatPrice(tx.amount, "total", "sale")}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">{statusLabel(tx.status)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
