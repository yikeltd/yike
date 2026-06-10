"use client";

import type { ListingTypeValue } from "@/constants/listingTypes";
import type { FeeTransparencyMode } from "@/types/database";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { formatAmountOrPercentTyping } from "@/lib/naira-input";

type Props = {
  listingType: ListingTypeValue;
  values: Record<string, string>;
  modes: Record<string, FeeTransparencyMode>;
  onValueChange: (key: string, value: string) => void;
  onModeChange: (key: string, mode: FeeTransparencyMode) => void;
};

const OPTIONAL = "Amount or %";

function modeFromValue(value: string): FeeTransparencyMode {
  return value.includes("%") ? "percent" : "exact";
}

function FlexibleFeeInput({
  label,
  fieldKey,
  value,
  mode,
  onValueChange,
  onModeChange,
  placeholder = OPTIONAL,
}: {
  label: string;
  fieldKey: string;
  value: string;
  mode: FeeTransparencyMode | undefined;
  onValueChange: (key: string, value: string) => void;
  onModeChange: (key: string, mode: FeeTransparencyMode) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            const next = formatAmountOrPercentTyping(e.target.value);
            onValueChange(fieldKey, next);
            onModeChange(fieldKey, modeFromValue(next));
          }}
          placeholder={placeholder}
          inputMode="decimal"
          autoComplete="off"
          className="pr-16"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
          {mode === "percent" || value.includes("%") ? "%" : "₦"}
        </span>
      </div>
    </div>
  );
}

export function ListingInlineFees({
  listingType,
  values,
  modes,
  onValueChange,
  onModeChange,
}: Props) {
  if (listingType === "shortlet") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted">Optional fees</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FlexibleFeeInput
            label="Cleaning fee (optional)"
            fieldKey="cleaning_fee"
            value={values.cleaning_fee ?? ""}
            mode={modes.cleaning_fee}
            onValueChange={onValueChange}
            onModeChange={onModeChange}
          />
          <FlexibleFeeInput
            label="Refundable caution (optional)"
            fieldKey="caution_deposit"
            value={values.caution_deposit ?? ""}
            mode={modes.caution_deposit}
            onValueChange={onValueChange}
            onModeChange={onModeChange}
          />
        </div>
      </div>
    );
  }

  if (listingType === "sale") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted">Optional fees</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FlexibleFeeInput
            label="Legal fee (optional)"
            fieldKey="legal_fee"
            value={values.legal_fee ?? ""}
            mode={modes.legal_fee}
            onValueChange={onValueChange}
            onModeChange={onModeChange}
          />
          <FlexibleFeeInput
            label="Agency fee (optional)"
            fieldKey="agency_fee"
            value={values.agency_fee ?? ""}
            mode={modes.agency_fee}
            onValueChange={onValueChange}
            onModeChange={onModeChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted">Optional fees</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FlexibleFeeInput
          label="Agency fee (optional)"
          fieldKey="agency_fee"
          value={values.agency_fee ?? ""}
          mode={modes.agency_fee}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
        <FlexibleFeeInput
          label="Legal fee (optional)"
          fieldKey="legal_fee"
          value={values.legal_fee ?? ""}
          mode={modes.legal_fee}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
        <FlexibleFeeInput
          label="Agreement fee (optional)"
          fieldKey="agreement_fee"
          value={values.agreement_fee ?? ""}
          mode={modes.agreement_fee}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
        <FlexibleFeeInput
          label="Service charge (optional)"
          fieldKey="service_charge"
          value={values.service_charge ?? ""}
          mode={modes.service_charge}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
        <FlexibleFeeInput
          label="Refundable caution (optional)"
          fieldKey="caution_fee"
          value={values.caution_fee ?? ""}
          mode={modes.caution_fee}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
      </div>
    </div>
  );
}
