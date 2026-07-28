"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GatedReviewModal({
  open,
  dealId,
  targetName,
  onClose,
  onSubmitReview,
}: {
  open: boolean;
  dealId: string;
  targetName: string;
  onClose: () => void;
  onSubmitReview: (rating: number, feedback: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitReview(rating, feedback.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-navy/10 pb-4">
          <div>
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
              Deal Completed
            </span>
            <h3 className="mt-1 text-base font-bold text-navy">Submit Verified Review</h3>
            <p className="text-xs text-navy/60 font-medium">Rate your experience with {targetName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy">Star Rating</label>
            <div className="mt-2 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="pressable p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= rating ? "fill-gold text-gold" : "text-navy/20"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Detailed Feedback & Review</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share details about inspection accuracy, communication, and transaction smoothness…"
              rows={4}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !feedback.trim()}
            className="pressable flex w-full items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Publishing Review…" : "Publish Verified Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
