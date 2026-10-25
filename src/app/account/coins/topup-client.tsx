"use client";

import { useEffect, useState } from "react";
import { formatYikeCoins } from "@/lib/yike-coins/constants";

type Pack = {
  id: string;
  amountNgn: number;
  coins: number;
  devOnly?: boolean;
};

export function YikeCoinsTopupClient() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [pricingNote, setPricingNote] = useState<string | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/yike-coins/packages")
      .then((r) => r.json())
      .then((json: { packages?: Pack[]; pricingNote?: string }) => {
        setPacks(json.packages ?? []);
        setPricingNote(json.pricingNote ?? null);
      })
      .catch(() => setPacks([]));
  }, []);

  async function topUp(ngn: number) {
    setLoading(ngn);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "wallet_topup",
          packageId: String(ngn),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Checkout unavailable");
        return;
      }
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-sm font-black text-navy">Top up with Paystack</h2>
      {pricingNote ? <p className="mt-1 text-[11px] text-navy/55">{pricingNote}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            disabled={loading !== null}
            onClick={() => void topUp(pack.amountNgn)}
            className="pressable rounded-xl border border-navy/10 bg-white px-3 py-3 text-left disabled:opacity-60"
          >
            <span className="block text-sm font-bold text-navy">
              ₦{pack.amountNgn.toLocaleString("en-NG")}
              {pack.devOnly ? (
                <span className="ml-1 text-[10px] font-semibold text-amber-700">dev</span>
              ) : null}
            </span>
            <span className="block text-xs text-muted">{formatYikeCoins(pack.coins)}</span>
            {loading === pack.amountNgn ? (
              <span className="text-[10px] text-gold-dark">Starting checkout…</span>
            ) : null}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <p className="mt-3 text-[11px] text-navy/55">
        Coins credit only after Paystack verifies payment (webhook or secure reconcile). Returning
        from checkout alone does not add coins.
      </p>
    </div>
  );
}
