"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import type { BuyerAssistanceServiceType } from "@/lib/conversations/types";
import { cn } from "@/lib/utils";

const SERVICES: Array<{ id: BuyerAssistanceServiceType; label: string; desc: string }> = [
  { id: "property_search", label: "Property Search", desc: "Help finding alternative verified listings" },
  { id: "vehicle_search", label: "Vehicle Sourcing", desc: "Help finding inspected car options" },
  { id: "negotiation_help", label: "Negotiation Assistance", desc: "Guidance on market pricing & offer terms" },
  { id: "inspection_coordination", label: "Inspection Coordination", desc: "Dedicated support booking field audits" },
  { id: "document_review", label: "Document & Title Review", desc: "Legal partner coordination" },
  { id: "viewing_coordination", label: "Viewing Coordination", desc: "Schedule multi-property site tours" },
];

export function BuyerAssistanceModal({
  open,
  onClose,
  onSubmitAssistance,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitAssistance: (serviceType: BuyerAssistanceServiceType, notes?: string) => Promise<void>;
}) {
  const [selectedService, setSelectedService] = useState<BuyerAssistanceServiceType>("property_search");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmitAssistance(selectedService, notes.trim() || undefined);
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
            <HelpCircle className="h-5 w-5 text-gold-dark" />
            <h3 className="text-base font-bold text-navy">Yike Buyer Assistance</h3>
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
            Select the type of assistance you need. A Yike Concierge officer will be assigned to your conversation.
          </p>

          <div className="space-y-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedService(s.id)}
                className={cn(
                  "flex w-full items-start justify-between rounded-2xl border p-3 text-left transition-all",
                  selectedService === s.id
                    ? "border-gold/50 bg-gold/10 ring-1 ring-gold/30"
                    : "border-navy/10 bg-white hover:bg-navy/5"
                )}
              >
                <div>
                  <p className="text-xs font-bold text-navy">{s.label}</p>
                  <p className="text-[11px] text-navy/60">{s.desc}</p>
                </div>
                {selectedService === s.id ? (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
                    Selected
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-navy">Additional Context (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us more about your specific requirements…"
              rows={2}
              className="mt-1 w-full rounded-2xl border border-navy/10 bg-surface p-3 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="pressable flex w-full items-center justify-center rounded-full bg-gold py-3 text-sm font-bold text-navy shadow-sm transition-all hover:bg-gold-light disabled:opacity-50"
          >
            {submitting ? "Engaging Concierge…" : "Engage Buyer Assistance"}
          </button>
        </form>
      </div>
    </div>
  );
}
