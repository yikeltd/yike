"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property } from "@/types/database";
import type { FeeTransparencyMode } from "@/types/database";
import {
  buildMoveInItems,
  extrasToMoveInEditableState,
  type EditableFeeField,
  type MoveInEditableState,
} from "@/lib/rent-breakdown";
import { Button } from "@/components/ui/button";
import { formatFlexibleFeeTyping } from "@/lib/naira-input";
import { X, Copy, Share2 } from "lucide-react";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
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
  const initial = useMemo(
    () => extrasToMoveInEditableState(property),
    [property]
  );
  const [state, setState] = useState<MoveInEditableState>(initial);
  const isLease = property.listing_type === "lease";

  useEffect(() => {
    if (open) setState(extrasToMoveInEditableState(property));
  }, [open, property]);

  if (!open) return null;

  const items = buildMoveInItems(state, isLease, property.payment_period);
  const total = items.reduce((sum, i) => sum + (i.flexible ? 0 : i.amount), 0);
  const shareText = [
    `Yike move-in estimate — ${property.title}`,
    ...items.map((i) =>
      i.flexible && i.note
        ? `${i.label}: ${i.note}`
        : `${i.label}: ${formatAmount(i.amount)}`
    ),
    `Total: ${formatAmount(total)}`,
    "Confirm all fees with your agent before payment.",
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

  function updateFee(
    key: keyof Omit<MoveInEditableState, "rent">,
    raw: string
  ) {
    setState((s) => {
      const prev = s[key];
      const flexModes = new Set<FeeTransparencyMode>([
        "negotiable",
        "landlord",
        "not_fixed",
      ]);
      let mode: FeeTransparencyMode = prev.mode;
      if (raw.includes("%")) {
        mode = "percent";
      } else if (raw.trim()) {
        mode = "exact";
      } else if (!flexModes.has(prev.mode)) {
        mode = "exact";
      }
      return {
        ...s,
        [key]: { raw, mode } satisfies EditableFeeField,
      };
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(92dvh,calc(100dvh-var(--bottom-nav-stack)))] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-float-lg sm:max-h-[90dvh] sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-surface px-5 pb-3 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="pr-8 text-lg font-bold text-navy">Move-in estimate</h2>
          <p className="mt-1 text-xs text-muted">
            Rent is from the listing. Adjust fees if your agent quoted differently.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <div className="rounded-xl border border-surface bg-surface/50 px-3 py-2.5">
              <p className="text-xs font-semibold text-muted">
                {isLease ? "Annual lease" : "Annual rent"}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-navy">
                {formatAmount(state.rent)}
              </p>
            </div>
            <FeeField
              label="Agency fee"
              value={state.agency.raw}
              onChange={(v) => updateFee("agency", v)}
            />
            <FeeField
              label="Refundable caution"
              value={state.caution.raw}
              onChange={(v) => updateFee("caution", v)}
            />
            <FeeField
              label="Agreement fee"
              value={state.agreement.raw}
              onChange={(v) => updateFee("agreement", v)}
            />
            <FeeField
              label="Legal fee"
              value={state.legal.raw}
              onChange={(v) => updateFee("legal", v)}
            />
            <FeeField
              label="Service charge"
              value={state.serviceCharge.raw}
              onChange={(v) => updateFee("serviceCharge", v)}
            />
          </div>

          <ul className="mt-4 space-y-2 border-t border-surface pt-4 text-sm">
            {items.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex justify-between gap-3">
                <span className="text-muted">{item.label}</span>
                <span className="font-semibold tabular-nums text-navy">
                  {item.flexible && item.note ? item.note : formatAmount(item.amount)}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-surface pt-2 font-bold text-navy">
              <span>Total</span>
              <span className="tabular-nums">{formatAmount(total)}</span>
            </li>
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Refundable caution is returned if there is no damage. Confirm every fee with your
            agent before payment.
          </p>
        </div>

        <div className="shrink-0 border-t border-surface bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-2">
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
    </div>
  );
}

function FeeField({
  label,
  value,
  onChange,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
}) {
  const displaySuffix =
    suffix ?? (value.includes("%") ? "%" : value.trim() ? "₦" : "₦ or %");

  return (
    <label className="block text-xs font-semibold text-muted">
      {label}
      <div className="relative mt-1">
        <input
          type="text"
          inputMode="text"
          value={value}
          onChange={(e) => onChange(formatFlexibleFeeTyping(e.target.value))}
          placeholder={value.includes("%") ? "10%" : "300,000"}
          className="h-10 w-full rounded-xl border border-surface bg-surface/50 px-3 pr-14 text-sm font-semibold text-foreground"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted">
          {displaySuffix}
        </span>
      </div>
      {hint ? <span className="mt-1 block text-[10px] text-muted">{hint}</span> : null}
    </label>
  );
}
