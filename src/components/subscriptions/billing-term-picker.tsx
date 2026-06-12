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
        "yike-card overflow-hidden",
        className
      )}
    >
      <div className="border-b border-border/80 bg-gradient-to-r from-surface/70 to-white px-3 py-2.5 sm:px-4">
        <h3 className="text-sm font-bold leading-tight text-navy">Billing Period</h3>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">
          Choose a plan duration
          {maxDiscount > 0 ? " and save more on longer terms." : "."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-2.5 sm:gap-2 sm:p-3 lg:grid-cols-4">
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
                "pressable relative flex min-h-[4.25rem] flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition-all sm:min-h-[4.5rem] sm:px-2.5",
                selected
                  ? "yike-neon-selected border-navy bg-navy text-white"
                  : "border-border/80 bg-elevated/50 text-navy hover:border-navy/20 hover:bg-white"
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
