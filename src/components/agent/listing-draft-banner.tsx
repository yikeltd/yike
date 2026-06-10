"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  clearListingDraft,
  draftDisplayLabel,
  loadListingDraft,
  type ListingDraft,
} from "@/lib/listing-draft";

export function ListingDraftBanner({
  agentId,
  onContinue,
  onDeleted,
  compact,
}: {
  agentId: string;
  onContinue?: (draft: ListingDraft) => void;
  onDeleted?: () => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState<ListingDraft | null>(null);

  useEffect(() => {
    setDraft(loadListingDraft(agentId));
  }, [agentId]);

  if (!draft) return null;

  const label = draftDisplayLabel(draft);

  function discard() {
    clearListingDraft();
    setDraft(null);
    onDeleted?.();
  }

  if (compact) {
    return (
      <div className="rounded-xl border border-gold/25 bg-gold/10 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-navy">
            Unfinished draft · <span className="text-muted">{label}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onContinue?.(draft!)}
              className="text-xs font-bold text-gold-dark underline"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={discard}
              className="text-xs font-bold text-danger underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
      <p className="font-semibold text-navy">Continue your unfinished listing?</p>
      <p className="mt-1 text-sm text-navy">{label}</p>
      <p className="mt-1 text-xs text-muted">Your progress is saved automatically.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => onContinue?.(draft)}>
          Continue draft
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={discard}>
          Delete draft
        </Button>
      </div>
    </div>
  );
}
