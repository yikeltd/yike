"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function OfferModal({
  open,
  listingTitle,
  listingPrice,
  onClose,
  onSubmitOffer,
}: {
  open: boolean;
  listingTitle: string;
  listingPrice: number;
  onClose: () => void;
  onSubmitOffer: (amount: number, terms?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState<number>(listingPrice);
  const [terms, setTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0 || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitOffer(amount, terms.trim() || undefined);
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
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gold-dark" />
            <h3 className="text-base font-bold text-navy">Make an Offer</h3>
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
            <p className="text-xs font-semibold text-navy/60">Listing</p>
            <p className="text-sm font-bold text-navy truncate">{listingTitle}</p>
            <p className="mt-0.5 text-xs text-navy/70">
              Asking Price: <span className="font-extrabold">{formatPrice(listingPrice, "total", "rent")}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Your Offer Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-4 py-3 text-lg font-bold text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Additional Terms / Notes (Optional)</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. Subject to physical inspection by Saturday"
              rows={3}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !amount}
            className="pressable flex w-full items-center justify-center rounded-full bg-gold py-3 text-sm font-bold text-navy shadow-sm transition-all hover:bg-gold-light disabled:opacity-50"
          >
            {submitting ? "Submitting Offer…" : "Submit Formal Offer"}
          </button>
        </form>
      </div>
    </div>
  );
}
