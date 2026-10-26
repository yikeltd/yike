"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Coins, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatYikeCoins } from "@/lib/yike-coins/constants";

type LedgerEntry = {
  id: string;
  direction: "credit" | "debit";
  amount_coins: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
};

type BalancePayload = {
  balanceCoins: number;
  videoCalls?: {
    freeAllowanceRemaining: number;
    billable: boolean;
    priceCoins: number | null;
  };
  devTestCreditAvailable?: boolean;
};

export function YikeCoinsWalletCard({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [devCreditBusy, setDevCreditBusy] = useState(false);
  const [devCreditAvailable, setDevCreditAvailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [balRes, ledgerRes] = await Promise.all([
        fetch("/api/yike-coins/balance", { cache: "no-store" }),
        fetch("/api/yike-coins/ledger?limit=8", { cache: "no-store" }),
      ]);

      if (balRes.status === 503) {
        setUnavailable(true);
        setBalance(null);
        setEntries([]);
        return;
      }

      if (!balRes.ok) {
        setUnavailable(true);
        return;
      }

      setUnavailable(false);
      const balJson = (await balRes.json()) as BalancePayload;
      setBalance(Number(balJson.balanceCoins ?? 0));
      setDevCreditAvailable(Boolean(balJson.devTestCreditAvailable));

      if (ledgerRes.ok) {
        const ledgerJson = (await ledgerRes.json()) as { entries?: LedgerEntry[] };
        setEntries(ledgerJson.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addDevTestCoins() {
    if (!devCreditAvailable) return;
    setDevCreditBusy(true);
    setNotice(null);
    try {
      const reference =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ref-${Date.now()}`;
      const res = await fetch("/api/dev/yike-coins/test-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCoins: 500,
          reference,
          reason: "Agent dashboard test top-up",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNotice(json.error ?? "Could not add test coins");
        return;
      }
      setNotice(
        json.alreadyApplied
          ? "Test credit already applied for that reference."
          : `Added 500 test coins. Balance: ${formatYikeCoins(json.balanceAfter)}`,
      );
      await refresh();
    } finally {
      setDevCreditBusy(false);
    }
  }

  if (unavailable && !loading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-navy/10 bg-white p-4 text-sm text-navy/70",
          className,
        )}
      >
        Yike Coins are off in this environment. Set{" "}
        <code className="text-xs">ENABLE_YIKE_COINS=true</code> in{" "}
        <code className="text-xs">.env.local</code> and apply coin migrations.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-gold/25 bg-gradient-to-br from-white to-gold/5 p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-navy">
            <Coins className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-navy/55">Yike Coins</p>
            <p className="text-xl font-black text-navy">
              {loading ? "…" : formatYikeCoins(balance ?? 0)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="pressable rounded-lg border border-navy/10 p-2 text-navy/60 hover:text-navy"
          aria-label="Refresh balance"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {entries.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-navy/8 pt-3">
          {entries.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-navy/70">{e.reason ?? e.direction}</span>
              <span
                className={cn(
                  "shrink-0 font-bold",
                  e.direction === "credit" ? "text-emerald-700" : "text-navy",
                )}
              >
                {e.direction === "credit" ? "+" : "−"}
                {e.amount_coins}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {devCreditAvailable ? (
        <button
          type="button"
          disabled={devCreditBusy}
          onClick={() => void addDevTestCoins()}
          className="pressable mt-3 w-full rounded-xl border border-dashed border-navy/20 bg-white/80 py-2 text-xs font-bold text-navy hover:bg-white"
        >
          {devCreditBusy ? "Adding…" : "Add 500 test coins (dev only)"}
        </button>
      ) : null}

      {notice ? <p className="mt-2 text-[11px] text-navy/65">{notice}</p> : null}

      <Link
        href="/account/coins"
        className={cn(
          "pressable inline-flex w-full items-center justify-center rounded-xl bg-navy py-2.5 text-xs font-bold text-gold",
          entries.length > 0 || loading ? "mt-3 border-t border-navy/8 pt-3" : "mt-2.5",
        )}
      >
        Manage wallet & top up
      </Link>
    </div>
  );
}
