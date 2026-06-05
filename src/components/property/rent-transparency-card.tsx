import type { Property } from "@/types/database";
import { calculateMoveInBreakdown } from "@/lib/rent-breakdown";
import { Info } from "lucide-react";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RentTransparencyCard({ property }: { property: Property }) {
  const breakdown = calculateMoveInBreakdown(property);
  if (!breakdown) return null;

  const isRent = property.listing_type === "rent";

  return (
    <section className="rounded-2xl bg-white p-4 shadow-float ring-1 ring-gold/15 lg:p-6">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15">
          <Info className="h-4 w-4 text-gold-dark" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy lg:text-base">
            {isRent ? "Total move-in estimate" : "What you'll pay"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {isRent
              ? "Typical first payment — confirm with agent before transfer"
              : "Nightly rate plus one-time fees where listed"}
          </p>
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-navy lg:text-xl">
          {breakdown.headline}
        </p>
      </div>
      <ul className="mt-4 space-y-2 border-t border-surface pt-4">
        {breakdown.items.map((item) => (
          <li
            key={item.label}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="text-muted">
              {item.label}
              {item.note && (
                <span className="ml-1 text-xs text-muted/80">({item.note})</span>
              )}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatAmount(item.amount)}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 border-t border-surface pt-2 text-sm font-bold text-navy">
          <span>Estimated total</span>
          <span className="tabular-nums">{breakdown.headline}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Yike shows estimates to help you compare homes. Agency fees, caution, and
        agreement terms vary — always confirm on WhatsApp before paying anyone.
      </p>
    </section>
  );
}
