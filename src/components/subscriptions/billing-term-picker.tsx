"use client";

import { cn } from "@/lib/utils";
import type { BillingTerm } from "@/lib/subscriptions/billing-terms";
import { maxBillingDiscount } from "@/lib/subscriptions/billing-terms";

export function BillingTermPicker({
  terms,
  value,
  onChange,
  className,
}: {
  terms: BillingTerm[];
  value: number;
  onChange: (months: number) => void;
  className?: string;
}) {
  const activeTerms = terms.filter((term) => term.active);
  const maxDiscount = maxBillingDiscount(activeTerms);

  if (!activeTerms.length) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-elevated px-4 py-3.5 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-navy">Billing period</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {maxDiscount > 0
          ? `Pay upfront — save up to ${maxDiscount}% on longer terms.`
          : "Choose how long you want your plan to run."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {activeTerms.map((term) => {
          const selected = value === term.months;
          const hasDiscount = term.discountPercent > 0;

          return (
            <button
              key={term.id}
              type="button"
              onClick={() => onChange(term.months)}
              className={cn(
                "pressable relative flex min-w-[4.5rem] flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors",
                selected
                  ? "border-gold bg-gold text-navy shadow-sm"
                  : "border-border bg-white text-navy hover:border-gold/40"
              )}
            >
              <span className="text-xs font-bold">{term.shortLabel}</span>
              {hasDiscount ? (
                <span
                  className={cn(
                    "mt-0.5 text-[10px] font-semibold",
                    selected ? "text-navy/80" : "text-gold-dark"
                  )}
                >
                  −{term.discountPercent}%
                </span>
              ) : (
                <span className="mt-0.5 text-[10px] text-muted">Standard</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
