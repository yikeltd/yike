"use client";

import { useEffect, useState } from "react";
import { clearListingDraft, loadListingDraft } from "@/lib/listing-draft";
import { Button } from "@/components/ui/button";

export function ListingDraftResume({
  agentId,
  onContinue,
  onDiscard,
}: {
  agentId: string;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(Boolean(loadListingDraft(agentId)));
  }, [agentId]);

  if (!hasDraft) return null;

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
      <p className="font-semibold text-navy">Continue your unfinished listing?</p>
      <p className="mt-1 text-xs text-muted">Your progress is saved automatically.</p>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={onContinue}>
          Continue draft
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            clearListingDraft();
            setHasDraft(false);
            onDiscard();
          }}
        >
          Start new
        </Button>
      </div>
    </div>
  );
}
