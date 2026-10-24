"use client";

import { useState } from "react";
import { formatYikeCoins, ngnToCoins } from "@/lib/yike-coins/constants";

export function YikeCoinsTopupClient({ packs }: { packs: number[] }) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <h2 className="text-sm font-black text-navy">Top up</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {packs.map((ngn) => (
          <button
            key={ngn}
            type="button"
            disabled={loading !== null}
            onClick={() => void topUp(ngn)}
            className="pressable rounded-xl border border-navy/10 bg-white px-3 py-3 text-left disabled:opacity-60"
          >
            <span className="block text-sm font-bold text-navy">₦{ngn.toLocaleString("en-NG")}</span>
            <span className="block text-xs text-muted">{formatYikeCoins(ngnToCoins(ngn))}</span>
            {loading === ngn ? (
              <span className="text-[10px] text-gold-dark">Starting checkout…</span>
            ) : null}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
