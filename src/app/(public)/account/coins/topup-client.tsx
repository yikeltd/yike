"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { cn } from "@/lib/utils";

type Pack = {
  id: string;
  amountNgn: number;
  coins: number;
  devOnly?: boolean;
};

export function YikeCoinsTopupClient() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState<boolean | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [selectedNgn, setSelectedNgn] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/yike-coins/packages")
      .then((r) => r.json())
      .then(
        (json: {
          packages?: Pack[];
          checkoutAvailable?: boolean;
          checkoutMessage?: string | null;
        }) => {
          const list = (json.packages ?? []).filter(
            (p) => !p.devOnly || process.env.NODE_ENV === "development",
          );
          setPacks(list);
          setCheckoutAvailable(json.checkoutAvailable ?? false);
          setCheckoutMessage(json.checkoutMessage ?? null);
          if (list.length === 1) setSelectedNgn(list[0]!.amountNgn);
        },
      )
      .catch(() => {
        setPacks([]);
        setCheckoutAvailable(false);
        setCheckoutMessage("Could not load top-up options.");
      });
  }, []);

  async function paySelected() {
    if (!checkoutAvailable || selectedNgn == null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "wallet_topup",
          packageId: String(selectedNgn),
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
      setLoading(false);
    }
  }

  const packsDisabled = checkoutAvailable === false;
  const selectedPack = packs.find((p) => p.amountNgn === selectedNgn);

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      {packsDisabled && checkoutMessage ? (
        <p
          className="mb-4 rounded-xl border border-navy/10 bg-surface/70 px-3 py-2.5 text-xs text-navy/80"
          role="status"
        >
          {checkoutMessage}
        </p>
      ) : null}

      {packs.length === 0 && checkoutAvailable !== null ? (
        <p className="text-sm text-navy/60">Top-up packs are unavailable right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {packs.map((pack) => {
            const selected = selectedNgn === pack.amountNgn;
            return (
              <button
                key={pack.id}
                type="button"
                disabled={packsDisabled || loading}
                onClick={() => setSelectedNgn(pack.amountNgn)}
                aria-pressed={selected}
                className={cn(
                  "pressable rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? "border-gold bg-gold/10 ring-2 ring-gold/35"
                    : "border-navy/10 bg-surface/40 hover:border-gold/25 hover:bg-white",
                )}
              >
                <span className="block text-sm font-black tabular-nums text-navy">
                  ₦{pack.amountNgn.toLocaleString("en-NG")}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-navy/65">
                  <YcAmount amount={pack.coins} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        disabled={packsDisabled || loading || selectedNgn == null}
        onClick={() => void paySelected()}
        className="pressable yike-btn-accent mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CreditCard className="h-4 w-4" aria-hidden />
        {loading
          ? "Starting checkout…"
          : selectedPack
            ? `Pay ₦${selectedPack.amountNgn.toLocaleString("en-NG")} with Paystack`
            : "Select a pack to continue"}
      </button>

      {error ? (
        <p className="mt-2 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-navy/50">
        YC credit only after Paystack verifies payment on our servers — not from the
        checkout redirect alone.
      </p>
    </div>
  );
}
