"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import type { InspectionType } from "@/lib/conversations/types";
import { cn } from "@/lib/utils";

const INSPECTION_TYPES: Array<{ id: InspectionType; label: string; desc: string }> = [
  { id: "property_50_point", label: "Property 50-Point Inspection", desc: "Structural, plumbing, electrical & physical audit" },
  { id: "vehicle_50_point", label: "Vehicle 50-Point Inspection", desc: "Engine, chassis, transmission & VIN verification" },
  { id: "legal_title_search", label: "Legal Title Search", desc: "C of O, Governor's Consent & Registry Search" },
];

export function InspectionRequestModal({
  open,
  onClose,
  onSubmitInspection,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitInspection: (inspectionType: InspectionType, preferredDate: string, notes?: string) => Promise<void>;
}) {
  const [inspectionType, setInspectionType] = useState<InspectionType>("property_50_point");
  const [preferredDate, setPreferredDate] = useState("2026-08-02");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preferredDate || submitting) return;

    setSubmitting(true);
    try {
      await onSubmitInspection(inspectionType, preferredDate, notes.trim() || undefined);
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
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-navy">Order Field Inspection</h3>
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
          <p className="text-xs text-navy/70">
            A certified Yike Field Inspector will be assigned to perform on-site audit and generate an immutable 50-point report.
          </p>

          <div className="space-y-2">
            {INSPECTION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInspectionType(t.id)}
                className={cn(
                  "flex w-full items-start justify-between rounded-2xl border p-3 text-left transition-all",
                  inspectionType === t.id
                    ? "border-emerald-500/50 bg-emerald-50/30 ring-1 ring-emerald-500/30"
                    : "border-navy/10 bg-white hover:bg-navy/5"
                )}
              >
                <div>
                  <p className="text-xs font-bold text-navy">{t.label}</p>
                  <p className="text-[11px] text-navy/60">{t.desc}</p>
                </div>
                {inspectionType === t.id ? (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Selected
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Preferred Inspection Date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface px-3 py-2 text-xs font-bold text-navy focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Notes for Inspector (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on plumbing and roof leaks"
              rows={2}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="pressable flex w-full items-center justify-center rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Dispatching Inspector…" : "Confirm Inspection Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
