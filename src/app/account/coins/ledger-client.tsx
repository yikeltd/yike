"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LedgerEntry = {
  id: string;
  direction: "credit" | "debit";
  amount_coins: number;
  balance_after: number;
  reason: string | null;
  reference: string | null;
  service_code: string | null;
  created_at: string;
};

export function YikeCoinsLedgerClient() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/yike-coins/ledger?limit=30", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load history");
        return;
      }
      setEntries(json.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">Loading transaction history…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-navy/60">
        No wallet activity yet. Top up with Paystack or use coins on eligible services.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-navy/8 rounded-2xl border border-navy/10 bg-white">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold text-navy">{e.reason ?? e.service_code ?? e.direction}</p>
            <p className="text-[11px] text-muted">
              {new Date(e.created_at).toLocaleString("en-NG")}
              {e.reference ? ` · ${e.reference}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-black",
                e.direction === "credit" ? "text-emerald-700" : "text-navy",
              )}
            >
              {e.direction === "credit" ? "+" : "−"}
              {e.amount_coins}
            </p>
            <p className="text-[10px] text-muted">Bal {e.balance_after}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
