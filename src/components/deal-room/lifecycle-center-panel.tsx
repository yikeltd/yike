"use client";

import { useState } from "react";
import type { TransactionLifecycleAggregate } from "@/lib/deal-room/lifecycle/types";
import {
  CheckCircle,
  Star,
  ShieldCheck,
  AlertTriangle,
  Award,
  ThumbsUp,
  MessageSquare,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  lifecycle: TransactionLifecycleAggregate;
  onAcceptTransaction?: () => void;
  onSubmitReview?: (rating: number, text: string) => void;
  onOpenDispute?: (reason: string) => void;
};

export function LifecycleCenterPanel({
  lifecycle,
  onAcceptTransaction,
  onSubmitReview,
  onOpenDispute,
}: Props) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState(false);

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Transaction Completion Center
              </h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                  lifecycle.lifecycleState === "completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : lifecycle.lifecycleState === "disputed"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                )}
              >
                {lifecycle.lifecycleState.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Asset Acceptance, Immutable Reviews & Dispute Resolution
            </p>
          </div>
        </div>

        {/* REPUTATION BADGE */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <Award className="h-5 w-5 text-[#F59E0B]" />
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-400">Community Reputation</span>
            <p className="text-xs font-black text-[#031B4E]">96 / 100 • Verified Trader</p>
          </div>
        </div>
      </div>

      {/* ACCEPTANCE FLOW STEPPER */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-[#031B4E]">Asset Acceptance Status</span>
          <span className="text-[10px] font-bold text-slate-500">Both Parties Must Confirm</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={cn(
              "rounded-xl p-3 border flex items-center justify-between text-xs font-bold",
              lifecycle.buyerAccepted
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-white text-slate-600 border-slate-200"
            )}
          >
            <span>Buyer Delivery Acceptance</span>
            {lifecycle.buyerAccepted ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-slate-400" />}
          </div>

          <div
            className={cn(
              "rounded-xl p-3 border flex items-center justify-between text-xs font-bold",
              lifecycle.sellerAccepted
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-white text-slate-600 border-slate-200"
            )}
          >
            <span>Seller Transfer Acceptance</span>
            {lifecycle.sellerAccepted ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-slate-400" />}
          </div>
        </div>

        {lifecycle.lifecycleState !== "completed" && onAcceptTransaction && (
          <button
            type="button"
            onClick={onAcceptTransaction}
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-xl hover:bg-emerald-700 min-h-[44px]"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>Confirm & Accept Delivery</span>
          </button>
        )}
      </div>

      {/* REVIEWS & REPUTATION SECTION */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase text-slate-400">Immutable Reviews ({lifecycle.reviews.length})</h4>

        {onSubmitReview && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#031B4E]">Rate Transaction Experience:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        s <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write immutable feedback for this transaction..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#031B4E] bg-white min-h-[70px]"
            />

            <button
              type="button"
              disabled={!reviewText.trim()}
              onClick={() => {
                onSubmitReview(rating, reviewText);
                setReviewText("");
              }}
              className="pressable flex items-center justify-center gap-1.5 rounded-xl bg-[#031B4E] px-4 py-2 text-xs font-black text-white shadow-2xs hover:bg-[#07142B] disabled:opacity-50 min-h-[38px]"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Publish Review</span>
            </button>
          </div>
        )}

        {/* REVIEW LIST */}
        <div className="space-y-2">
          {lifecycle.reviews.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  v{rev.currentVersionNumber} • Immutable
                </span>
              </div>
              <p className="font-medium text-slate-800">&quot;{rev.reviewText}&quot;</p>
            </div>
          ))}
        </div>
      </div>

      {/* DISPUTE DRAWER TRIGGER */}
      {onOpenDispute && (
        <div className="pt-2 border-t border-slate-100">
          {!showDisputeInput ? (
            <button
              type="button"
              onClick={() => setShowDisputeInput(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Report an Issue / Open Formal Dispute</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-red-50 p-4 border border-red-200 space-y-3 text-xs">
              <h5 className="font-black text-red-900 uppercase">Open Formal Transaction Dispute</h5>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the dispute reason (damage, non-delivery, fraudulent title)..."
                className="w-full rounded-xl border border-red-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-600 bg-white min-h-[70px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!disputeReason.trim()}
                  onClick={() => {
                    onOpenDispute(disputeReason);
                    setShowDisputeInput(false);
                  }}
                  className="pressable rounded-xl bg-red-600 px-4 py-2 font-black text-white shadow-2xs hover:bg-red-700 min-h-[36px]"
                >
                  Freeze Escrow & Open Dispute
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisputeInput(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
