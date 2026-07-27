"use client";

import { cn } from "@/lib/utils";
import type { BillingTerm } from "@/lib/subscriptions/billing-terms.shared";
import { formatBillingOptionTitle } from "@/lib/subscriptions/billing-terms.shared";

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

  if (!activeTerms.length) return null;

  return (
    <div
      className={cn(
        "inline-flex w-full items-center rounded-2xl border border-navy/10 bg-white p-1.5 shadow-sm sm:w-auto",
        className
      )}
    >
      <div className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:items-center">
        {activeTerms.map((term) => {
          const selected = value === term.months;
          const title = formatBillingOptionTitle(term);
          const hasSavings = term.discountPercent > 0;

          return (
            <button
              key={term.id}
              type="button"
              onClick={() => onChange(term.months)}
              className={cn(
                "pressable flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:px-5 sm:py-2",
                selected
                  ? "bg-navy text-white shadow-sm"
                  : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              )}
            >
              <span>{title}</span>
              {hasSavings ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
                    selected ? "bg-gold text-navy" : "bg-gold/20 text-gold-dark"
                  )}
                >
                  Save {term.discountPercent}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
