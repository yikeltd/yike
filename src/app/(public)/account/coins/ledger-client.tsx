"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatLedgerEntryLabel } from "@/lib/yike-coins/ledger-labels";
import { formatYc } from "@/lib/yike-coins/constants";
import { YcAmount, YcLabelText } from "@/components/yike-coins/yc-amount";

type LedgerEntry = {
  id: string;
  direction: "credit" | "debit";
  amount_coins: number;
  balance_after: number;
  reason: string | null;
  reference: string | null;
  service_code: string | null;
  metadata?: Record<string, unknown> | null;
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
    return (
      <ul className="space-y-2" aria-busy="true" aria-label="Loading transactions">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-xl border border-navy/8 bg-surface/60 motion-reduce:animate-none"
          />
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm">
        <p className="font-semibold text-red-900">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="pressable mt-2 text-xs font-bold text-navy underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-surface/40 px-4 py-8 text-center">
        <p className="text-sm font-bold text-navy">No wallet activity yet</p>
        <p className="mt-1 text-xs text-navy/60">
          Top-ups and service usage will appear here once recorded on your ledger.
        </p>
        <Link
          href="#wallet-top-up"
          className="pressable yike-btn-accent mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gold px-4 text-xs font-bold text-navy"
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          Top up YC
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy/8 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      {entries.map((e) => {
        const credit = e.direction === "credit";
        return (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3.5 text-sm">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                credit ? "bg-emerald-100 text-emerald-800" : "bg-navy/8 text-navy",
              )}
              aria-hidden
            >
              {credit ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">
                <YcLabelText text={formatLedgerEntryLabel(e)} />
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {new Date(e.created_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {e.reference ? (
                  <span className="text-navy/45"> · {e.reference}</span>
                ) : null}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "font-black tabular-nums",
                  credit ? "text-emerald-800" : "text-navy",
                )}
              >
                <span aria-hidden>{credit ? "+" : "−"}</span>
                <YcAmount amount={e.amount_coins} />
              </p>
              <p className="text-[10px] text-muted">Bal {formatYc(e.balance_after)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
