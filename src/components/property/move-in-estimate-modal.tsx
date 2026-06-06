"use client";

import { useMemo, useState } from "react";
import type { Property } from "@/types/database";
import {
  calculateMoveInBreakdown,
  getListingExtras,
  type RentLineItem,
} from "@/lib/rent-breakdown";
import { Button } from "@/components/ui/button";
import { X, Copy, Share2 } from "lucide-react";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

type EditableState = {
  rent: number;
  agencyPercent: number;
  cautionMonths: number;
  agreementFee: number;
  legalFee: number;
  serviceCharge: number;
  otherFees: number;
};

function buildItems(state: EditableState, isLease: boolean): RentLineItem[] {
  const agencyFee = Math.round(state.rent * (state.agencyPercent / 100));
  const caution = Math.round(state.rent * (state.cautionMonths / 12));
  const rentLabel = isLease ? "Annual lease" : "Annual rent";
  const items: RentLineItem[] = [
    { label: rentLabel, amount: state.rent },
    {
      label: `Agency fee (${state.agencyPercent}%)`,
      amount: agencyFee,
      note: "One-time",
    },
    {
      label: `Caution deposit (${state.cautionMonths} mo)`,
      amount: caution,
      note: "Refundable",
    },
  ];
  if (state.agreementFee > 0) {
    items.push({ label: "Agreement fee", amount: state.agreementFee, note: "One-time" });
  }
  if (state.serviceCharge > 0) {
    items.push({ label: "Service charge", amount: state.serviceCharge, note: "Annual" });
  }
  if (state.legalFee > 0) {
    items.push({ label: "Legal fee", amount: state.legalFee });
  }
  if (state.otherFees > 0) {
    items.push({ label: "Other fees", amount: state.otherFees });
  }
  return items;
}

export function MoveInEstimateModal({
  property,
  open,
  onClose,
}: {
  property: Property;
  open: boolean;
  onClose: () => void;
}) {
  const base = calculateMoveInBreakdown(property);
  const extras = getListingExtras(property);
  const isLease = property.listing_type === "lease";

  const initial = useMemo<EditableState>(() => {
    const rent = Number(property.price);
    return {
      rent,
      agencyPercent: extras.agency_fee_percent ?? 10,
      cautionMonths: extras.caution_months ?? 12,
      agreementFee: extras.agreement_fee ?? 50_000,
      legalFee: extras.legal_fee ?? 0,
      serviceCharge: extras.service_charge ?? 0,
      otherFees: 0,
    };
  }, [property, extras]);

  const [state, setState] = useState(initial);

  if (!open || !base) return null;

  const items = buildItems(state, isLease);
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const shareText = [
    `Yike move-in estimate — ${property.title}`,
    ...items.map((i) => `${i.label}: ${formatAmount(i.amount)}`),
    `Total: ${formatAmount(total)}`,
    "Figures are estimates. Confirm all fees directly before payment.",
  ].join("\n");

  function copyEstimate() {
    void navigator.clipboard?.writeText(shareText);
  }

  async function shareEstimate() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Yike move-in estimate", text: shareText });
        return;
      } catch {
        /* fall through */
      }
    }
    copyEstimate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-float-lg sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-lg font-bold text-navy">Move-in estimate</h2>
        <p className="mt-1 text-xs text-muted">Edit amounts to match what your agent quoted.</p>

        <div className="mt-4 space-y-3">
          <Field label="Annual rent" value={state.rent} onChange={(v) => setState((s) => ({ ...s, rent: v }))} />
          <Field
            label="Agency %"
            value={state.agencyPercent}
            onChange={(v) => setState((s) => ({ ...s, agencyPercent: v }))}
            suffix="%"
          />
          <Field
            label="Caution (months)"
            value={state.cautionMonths}
            onChange={(v) => setState((s) => ({ ...s, cautionMonths: v }))}
          />
          <Field
            label="Agreement fee"
            value={state.agreementFee}
            onChange={(v) => setState((s) => ({ ...s, agreementFee: v }))}
          />
          <Field
            label="Legal fee"
            value={state.legalFee}
            onChange={(v) => setState((s) => ({ ...s, legalFee: v }))}
          />
          <Field
            label="Service charge"
            value={state.serviceCharge}
            onChange={(v) => setState((s) => ({ ...s, serviceCharge: v }))}
          />
          <Field
            label="Other fees"
            value={state.otherFees}
            onChange={(v) => setState((s) => ({ ...s, otherFees: v }))}
          />
        </div>

        <ul className="mt-4 space-y-2 border-t border-surface pt-4 text-sm">
          {items.map((item) => (
            <li key={item.label} className="flex justify-between gap-3">
              <span className="text-muted">{item.label}</span>
              <span className="font-semibold tabular-nums">{formatAmount(item.amount)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-surface pt-2 font-bold text-navy">
            <span>Total</span>
            <span className="tabular-nums">{formatAmount(total)}</span>
          </li>
        </ul>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Figures are estimates. Confirm all fees directly before payment.
        </p>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={copyEstimate}>
            <Copy className="mr-1.5 h-4 w-4" />
            Copy
          </Button>
          <Button type="button" className="flex-1" onClick={shareEstimate}>
            <Share2 className="mr-1.5 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-muted">
      {label}
      <div className="relative mt-1">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-10 w-full rounded-xl border border-surface bg-surface/50 px-3 text-sm font-semibold text-foreground"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
