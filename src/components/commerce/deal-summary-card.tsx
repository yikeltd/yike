"use client";

import { CheckCircle2, ChevronRight, DollarSign, Shield, Sparkles, Star } from "lucide-react";
import type { Deal, DealStage } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STAGES: Array<{ id: DealStage; label: string }> = [
  { id: "LEAD", label: "Lead" },
  { id: "VIEWING", label: "Viewing" },
  { id: "INSPECTION", label: "Inspection" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "OFFER_ACCEPTED", label: "Accepted" },
  { id: "COMPLETED", label: "Completed" },
];

function getNextAction(stage: DealStage): string {
  switch (stage) {
    case "LEAD":
      return "Schedule a physical or live video viewing with the seller.";
    case "QUALIFIED":
      return "Confirm inspection parameters and preferred date.";
    case "VIEWING":
      return "Complete viewing and request a 50-point field inspection.";
    case "INSPECTION":
      return "Review field audit report and submit a formal offer.";
    case "NEGOTIATION":
      return "Accept, counter, or decline current offer.";
    case "OFFER_ACCEPTED":
      return "Complete legal title review & finalize deal closure.";
    case "CONTRACT_PENDING":
      return "Execute final contract & mark deal completed.";
    case "COMPLETED":
      return "Deal completed! Submit buyer/seller review.";
    case "CANCELLED":
    case "LOST":
      return "Deal closed. Reopen or explore other verified listings.";
  }
}

export function DealSummaryCard({
  deal,
  onOpenReviewModal,
}: {
  deal: Deal;
  onOpenReviewModal?: () => void;
}) {
  const currentStageIndex = STAGES.findIndex((s) => s.id === deal.currentStage);
  const nextActionText = getNextAction(deal.currentStage);

  return (
    <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase tracking-wider">
              Canonical Deal Object
            </span>
            <span className="text-xs font-bold text-navy/60">
              Days Open: {deal.daysOpen}d
            </span>
          </div>
          <h2 className="mt-1 text-base font-extrabold text-navy sm:text-lg">
            Deal Value: {formatPrice(deal.currentValue, "total", "rent")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {deal.status === "completed" && (
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="pressable flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <Star className="h-4 w-4 fill-white" />
              <span>Submit Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Progress Visualizer */}
      <div className="mt-4 no-scrollbar flex items-center justify-between overflow-x-auto rounded-2xl border border-navy/10 bg-surface p-2.5">
        {STAGES.map((s, idx) => {
          const isPassed = currentStageIndex >= idx;
          const isCurrent = s.id === deal.currentStage;

          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0 px-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-xs transition-all",
                  isCurrent
                    ? "bg-gold text-navy ring-2 ring-gold/40 scale-110"
                    : isPassed
                    ? "bg-navy text-white"
                    : "bg-navy/10 text-navy/40"
                )}
              >
                {isPassed ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-bold",
                  isCurrent ? "text-navy" : isPassed ? "text-navy/80" : "text-navy/40"
                )}
              >
                {s.label}
              </span>
              {idx < STAGES.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-navy/30" />
              )}
            </div>
          );
        })}
      </div>

      {/* Next Recommended Action */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold/10 p-3 text-xs text-navy">
        <Sparkles className="h-4 w-4 shrink-0 text-gold-dark mt-0.5" />
        <div>
          <span className="font-bold">Next Recommended Action: </span>
          <span className="font-medium text-navy/80">{nextActionText}</span>
        </div>
      </div>
    </div>
  );
}
