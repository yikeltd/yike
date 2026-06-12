"use client";

import { cn } from "@/lib/utils";
import type { BillingTerm } from "@/lib/subscriptions/billing-terms.shared";
import {
  formatBillingOptionSubtitle,
  formatBillingOptionTitle,
  maxBillingDiscount,
} from "@/lib/subscriptions/billing-terms.shared";

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
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-border/80 bg-gradient-to-r from-surface/80 to-white px-4 py-3.5 sm:px-5">
        <h3 className="text-sm font-bold text-navy">Billing Period</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Choose a plan duration
          {maxDiscount > 0 ? " and save more on longer terms." : "."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
        {activeTerms.map((term) => {
          const selected = value === term.months;
          const title = formatBillingOptionTitle(term);
          const subtitle = formatBillingOptionSubtitle(term);
          const hasSavings = term.discountPercent > 0;

          return (
            <button
              key={term.id}
              type="button"
              onClick={() => onChange(term.months)}
              className={cn(
                "pressable relative flex min-h-[5.25rem] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-all sm:min-h-[5.5rem] sm:px-3",
                selected
                  ? "border-navy bg-navy text-white shadow-md ring-2 ring-navy/15"
                  : "border-border bg-elevated/50 text-navy hover:border-navy/25 hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "text-sm font-bold leading-tight",
                  selected ? "text-white" : "text-navy"
                )}
              >
                {title}
              </span>
              <span
                className={cn(
                  "mt-1.5 text-[11px] font-medium leading-tight",
                  selected
                    ? hasSavings
                      ? "text-gold"
                      : "text-white/75"
                    : hasSavings
                      ? "text-gold-dark"
                      : "text-muted"
                )}
              >
                {subtitle}
              </span>
              {hasSavings && !selected ? (
                <span
                  className="absolute right-2 top-2 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-dark"
                  aria-hidden
                >
                  −{term.discountPercent}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
