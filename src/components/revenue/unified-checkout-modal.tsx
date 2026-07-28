"use client";

import { useState } from "react";
import { CheckCircle2, Shield, Sparkles, Tag, X } from "lucide-react";
import type { ProductItem } from "@/lib/revenue/types";
import { formatPrice } from "@/lib/utils";

export function UnifiedCheckoutModal({
  open,
  product,
  onClose,
  onSuccess,
}: {
  open: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !product) return null;

  const basePrice = product.priceAmount;
  const discountAmount = discountPercent ? Math.round((basePrice * discountPercent) / 100) : 0;
  const finalPrice = basePrice - discountAmount;

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();
    if (code === "YIKE2026") {
      setDiscountPercent(20);
      setError(null);
    } else if (code === "FOUNDER50") {
      setDiscountPercent(50);
      setError(null);
    } else {
      setError("Invalid promo coupon code");
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (processing || !product) return;

    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/revenue/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          couponCode: discountPercent ? couponCode.toUpperCase() : undefined,
          simulateSuccess: true,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Checkout processing failed");
        return;
      }

      onSuccess?.();
      onClose();
    } catch {
      setError("Network error during checkout");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy/10 pb-4">
          <div>
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase">
              Yike Checkout
            </span>
            <h3 className="mt-1 text-base font-bold text-navy">{product.name}</h3>
            <p className="text-xs text-navy/60">{product.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Order Details */}
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-navy/10 bg-surface p-3 text-xs space-y-1.5">
            <div className="flex justify-between font-medium text-navy/70">
              <span>Item Price</span>
              <span>{formatPrice(basePrice, "total", "rent")}</span>
            </div>

            {discountPercent && (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Promo Discount ({discountPercent}%)</span>
                <span>-{formatPrice(discountAmount, "total", "rent")}</span>
              </div>
            )}

            <div className="border-t border-navy/10 pt-1.5 flex justify-between font-black text-sm text-navy">
              <span>Total Payable</span>
              <span>{formatPrice(finalPrice, "total", "rent")}</span>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Promo coupon code (e.g. YIKE2026)"
              className="flex-1 rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="pressable rounded-xl bg-navy/10 px-3 py-2 text-xs font-bold text-navy hover:bg-navy/20"
            >
              Apply
            </button>
          </div>

          {error && <p className="text-xs font-bold text-danger">{error}</p>}

          <form onSubmit={(e) => void handleCheckout(e)}>
            <button
              type="submit"
              disabled={processing}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-navy-light disabled:opacity-50"
            >
              <Shield className="h-4 w-4 text-gold" />
              <span>{processing ? "Processing Checkout…" : `Pay ${formatPrice(finalPrice, "total", "rent")}`}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
