"use client";

import { useState } from "react";
import type { Property } from "@/types/database";
import { calculateMoveInBreakdown } from "@/lib/rent-breakdown";
import { MoveInEstimateModal } from "./move-in-estimate-modal";
import { Info, ChevronRight } from "lucide-react";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RentTransparencyCard({ property }: { property: Property }) {
  const breakdown = calculateMoveInBreakdown(property);
  const [modalOpen, setModalOpen] = useState(false);

  if (!breakdown) return null;

  const isRentOrLease =
    property.listing_type === "rent" || property.listing_type === "lease";

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="pressable w-full rounded-2xl bg-white p-4 text-left shadow-float ring-1 ring-gold/15 lg:p-6"
      >
        <div className="flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15">
            <Info className="h-4 w-4 text-gold-dark" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-navy lg:text-base">
              {isRentOrLease ? "Total move-in estimate" : "What you'll pay"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Tap to edit breakdown and share
            </p>
          </div>
          <p className="shrink-0 text-lg font-bold tabular-nums text-navy lg:text-xl">
            {breakdown.headline}
          </p>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
        </div>
        <ul className="mt-4 space-y-2 border-t border-surface pt-4">
          {breakdown.items.slice(0, 4).map((item) => (
            <li
              key={item.label}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-muted">{item.label}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatAmount(item.amount)}
              </span>
            </li>
          ))}
          {breakdown.items.length > 4 && (
            <li className="text-xs font-medium text-gold-dark">
              +{breakdown.items.length - 4} more — tap to view all
            </li>
          )}
        </ul>
      </button>
      <MoveInEstimateModal
        property={property}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
