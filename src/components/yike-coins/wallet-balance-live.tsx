"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCoinNairaEquivalent } from "@/lib/yike-coins/constants";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { YIKE_COINS_BALANCE_CHANGED_EVENT } from "@/lib/yike-coins/balance-events";

type Props = {
  initialBalance: number;
};

export function WalletBalanceLive({ initialBalance }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/yike-coins/balance", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { balanceCoins?: number };
      setBalance(Number(json.balanceCoins ?? 0));
    } catch {
      /* keep last known balance */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    const onBalanceEvent = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onBalanceEvent);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onBalanceEvent);
    };
  }, [refresh]);

  return (
    <div
      id="wallet-balance"
      className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Available balance</p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="pressable text-[11px] font-bold text-navy/70 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="mt-1 text-3xl font-black text-navy">
        <YcAmount amount={balance} />
      </p>
      <p className="mt-2 text-xs text-navy/55">{formatCoinNairaEquivalent(balance)}</p>
    </div>
  );
}
