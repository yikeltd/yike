"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import {
  LISTING_DELETE_REASONS,
  type ListingDeleteReason,
} from "@/lib/admin/listing-delete";

type Props = {
  open: boolean;
  listingTitle?: string;
  onConfirm: (payload: {
    reason: ListingDeleteReason;
    notes: string;
  }) => void | Promise<void>;
  onCancel: () => void;
};

export function ListingDeleteConfirmModal({
  open,
  listingTitle,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState<ListingDeleteReason | "">("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  if (!open) return null;

  function reset() {
    setReason("");
    setNotes("");
    setError("");
    setLoading(false);
    setShowPin(false);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  async function execute() {
    if (!reason) {
      setError("Select a reason before deleting.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm({ reason, notes: notes.trim() });
      reset();
    } catch {
      setError("Delete failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-delete-title"
        >
          <h2 id="listing-delete-title" className="text-lg font-bold text-navy">
            Delete this listing permanently?
          </h2>
          <p className="mt-2 text-sm text-muted">
            This action permanently removes the listing from the marketplace. This
            cannot be undone.
          </p>
          {listingTitle ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
              {listingTitle}
            </p>
          ) : null}

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reason) {
                setError("Select a reason before deleting.");
                return;
              }
              setShowPin(true);
            }}
          >
            <div>
              <label
                htmlFor="listing-delete-reason"
                className="text-xs font-bold uppercase text-muted"
              >
                Reason (required)
              </label>
              <select
                id="listing-delete-reason"
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as ListingDeleteReason | "")
                }
                className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"
                required
              >
                <option value="">Select a reason…</option>
                {LISTING_DELETE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="listing-delete-notes"
                className="text-xs font-bold uppercase text-muted"
              >
                Additional notes (optional)
              </label>
              <Textarea
                id="listing-delete-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context for the audit log"
                rows={3}
                className="mt-1"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" fullWidth onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={loading || !reason}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </form>

          <p className="mt-3 text-center text-[10px] text-muted">
            Admin PIN required · soft-delete with audit trail
          </p>
        </div>
      </div>

      {showPin ? (
        <PinConfirmModal
          title="Confirm with admin PIN"
          description="Permanent listing delete requires your admin PIN."
          onVerified={async () => {
            setShowPin(false);
            await execute();
          }}
          onCancel={() => setShowPin(false)}
        />
      ) : null}
    </>
  );
}
