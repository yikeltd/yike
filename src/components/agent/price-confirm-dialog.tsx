"use client";

import type { PriceAnalysisResult } from "@/lib/pricing/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PriceConfirmDialog({
  analysis,
  price,
  paymentPeriod,
  onConfirm,
  onEdit,
  busy,
}: {
  analysis: PriceAnalysisResult;
  price: number;
  paymentPeriod?: string;
  onConfirm: () => void;
  onEdit: () => void;
  busy?: boolean;
}) {
  const range = analysis.suggested_range;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="price-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-elevated p-5 shadow-float-lg">
        <h2 id="price-confirm-title" className="text-lg font-bold text-navy">
          Please confirm this price
        </h2>
        <p className="mt-2 text-sm text-muted">
          This amount differs from similar listings nearby. You can continue if it is
          intentional.
        </p>
        <p className="mt-3 text-xl font-bold text-navy">
          {formatPrice(price)}
          {paymentPeriod ? (
            <span className="text-sm font-medium text-muted"> / {paymentPeriod}</span>
          ) : null}
        </p>
        {range && range.min > 0 && range.max > 0 ? (
          <p className="mt-2 text-sm text-muted">
            Similar listings in this area are usually around{" "}
            <span className="font-semibold text-navy">
              {formatPrice(range.min)} – {formatPrice(range.max)}
            </span>
            .
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onConfirm} disabled={busy}>
            Confirm price
          </Button>
          <Button variant="outline" className="flex-1" onClick={onEdit} disabled={busy}>
            Edit price
          </Button>
        </div>
      </div>
    </div>
  );
}
