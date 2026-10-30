"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { formatCoinNairaEquivalent } from "@/lib/yike-coins/constants";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { YIKE_COINS_BALANCE_CHANGED_EVENT } from "@/lib/yike-coins/balance-events";
import { cn } from "@/lib/utils";

type Props = {
  initialBalance: number;
};

export function WalletBalanceHero({ initialBalance }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/yike-coins/balance", { cache: "no-store" });
      if (res.status === 503) {
        setRefreshError("Wallet unavailable right now.");
        return;
      }
      if (!res.ok) {
        setRefreshError("Could not refresh balance.");
        return;
      }
      const json = (await res.json()) as { balanceCoins?: number };
      setBalance(Number(json.balanceCoins ?? 0));
    } catch {
      setRefreshError("Could not refresh balance.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => void refresh();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("pageshow", onRefresh);
    window.addEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onRefresh);
    return () => {
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("pageshow", onRefresh);
      window.removeEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onRefresh);
    };
  }, [refresh]);

  return (
    <section
      id="wallet-balance"
      aria-labelledby="wallet-balance-label"
      className="relative overflow-hidden rounded-2xl bg-navy p-5 shadow-md ring-1 ring-navy/20 sm:p-6"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            id="wallet-balance-label"
            className="text-[11px] font-bold uppercase tracking-wider text-white/60"
          >
            Available balance
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-white sm:text-[2.75rem]">
            <YcAmount amount={balance} className="text-white" />
          </p>
          <p className="mt-2 text-sm text-white/70">
            {formatCoinNairaEquivalent(balance)} nominal
          </p>
          {balance === 0 ? (
            <p className="mt-3 text-xs text-white/55">
              Top up below to pay for eligible services on Yike.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          aria-label={refreshing ? "Refreshing balance" : "Refresh balance"}
          className={cn(
            "pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60",
            refreshing && "animate-pulse motion-reduce:animate-none",
          )}
        >
          <RefreshCw
            className={cn("h-4 w-4", refreshing && "animate-spin motion-reduce:animate-none")}
            aria-hidden
          />
        </button>
      </div>
      {refreshError ? (
        <p className="relative mt-3 text-xs font-medium text-amber-200" role="status">
          {refreshError}
        </p>
      ) : null}
    </section>
  );
}
