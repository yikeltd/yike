"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";

export function ViewingModal({
  open,
  listingTitle,
  onClose,
  onSubmitViewing,
}: {
  open: boolean;
  listingTitle: string;
  onClose: () => void;
  onSubmitViewing: (date: string, time: string, meetingPoint: string, notes?: string) => Promise<void>;
}) {
  const [date, setDate] = useState("2026-08-01");
  const [time, setTime] = useState("02:00 PM");
  const [meetingPoint, setMeetingPoint] = useState("Property Main Gate / Entrance");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !meetingPoint || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitViewing(date, time, meetingPoint, notes.trim() || undefined);
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
            <Calendar className="h-5 w-5 text-navy" />
            <h3 className="text-base font-bold text-navy">Schedule Viewing</h3>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy">Preferred Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-3 py-2 text-xs font-bold text-navy focus:border-gold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy">Preferred Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 2:00 PM"
                className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-3 py-2 text-xs font-bold text-navy focus:border-gold focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Meeting Point</label>
            <input
              type="text"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="e.g. Property Entrance / Lekki Junction"
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-4 py-2.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Notes for Seller (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Coming with my spouse"
              rows={2}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="pressable flex w-full items-center justify-center rounded-full bg-navy py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-navy/90 disabled:opacity-50"
          >
            {submitting ? "Scheduling…" : "Confirm Viewing Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
