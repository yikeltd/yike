"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { formatYikeCoins } from "@/lib/yike-coins/constants";
import { YIKE_COINS_BALANCE_CHANGED_EVENT } from "@/lib/yike-coins/balance-events";
import { cn } from "@/lib/utils";

/**
 * Compact wallet entry in the agent hero — links to the full Yike Coins wallet.
 */
export function AgentHeroYcBalance({ className }: { className?: string }) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/yike-coins/balance", { cache: "no-store" });
      if (res.status === 503) {
        setHidden(true);
        return;
      }
      if (!res.ok) {
        setBalance(0);
        return;
      }
      const json = (await res.json()) as { balanceCoins?: number };
      setBalance(Number(json.balanceCoins ?? 0));
      setHidden(false);
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
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

  if (hidden && !loading) return null;

  const label = loading ? "…" : formatYikeCoins(balance);

  return (
    <Link
      href="/account/coins"
      prefetch
      className={cn(
        "pressable block pl-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-lg",
        className,
      )}
      aria-label={`Yike Coins wallet, ${loading ? "loading balance" : label}. Open wallet to top up, share, and view history.`}
    >
      <span className="text-[10px] font-bold text-[#E4B547] tracking-wider uppercase block">
        Yike Coins
      </span>
      <span className="mt-0.5 flex items-center justify-start gap-1.5 font-bold text-white text-xs sm:text-sm">
        <Coins className="h-3.5 w-3.5 text-[#E4B547] shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    </Link>
  );
}
