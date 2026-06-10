"use client";

import type { ListingTypeValue } from "@/constants/listingTypes";
import { NairaInput } from "@/components/ui/naira-input";

type Props = {
  listingType: ListingTypeValue;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
};

const OPTIONAL = "Optional amount";

export function ListingInlineFees({ listingType, values, onValueChange }: Props) {
  if (listingType === "shortlet") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted">Optional fees</p>
        <div className="grid grid-cols-2 gap-3">
          <NairaInput
            label="Cleaning fee (optional)"
            value={values.cleaning_fee ?? ""}
            onChange={(v) => onValueChange("cleaning_fee", v)}
            placeholder={OPTIONAL}
          />
          <NairaInput
            label="Caution deposit (optional)"
            value={values.caution_deposit ?? ""}
            onChange={(v) => onValueChange("caution_deposit", v)}
            placeholder={OPTIONAL}
          />
        </div>
      </div>
    );
  }

  if (listingType === "sale") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted">Optional fees</p>
        <div className="grid grid-cols-2 gap-3">
          <NairaInput
            label="Legal fee (optional)"
            value={values.legal_fee ?? ""}
            onChange={(v) => onValueChange("legal_fee", v)}
            placeholder={OPTIONAL}
          />
          <NairaInput
            label="Agency fee (optional)"
            value={values.agency_fee ?? ""}
            onChange={(v) => onValueChange("agency_fee", v)}
            placeholder={OPTIONAL}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted">Optional fees</p>
      <div className="grid grid-cols-2 gap-3">
        <NairaInput
          label="Agency fee (optional)"
          value={values.agency_fee ?? ""}
          onChange={(v) => onValueChange("agency_fee", v)}
          placeholder={OPTIONAL}
        />
        <NairaInput
          label="Legal fee (optional)"
          value={values.legal_fee ?? ""}
          onChange={(v) => onValueChange("legal_fee", v)}
          placeholder={OPTIONAL}
        />
        <NairaInput
          label="Agreement fee (optional)"
          value={values.agreement_fee ?? ""}
          onChange={(v) => onValueChange("agreement_fee", v)}
          placeholder={OPTIONAL}
        />
        <NairaInput
          label="Service charge (optional)"
          value={values.service_charge ?? ""}
          onChange={(v) => onValueChange("service_charge", v)}
          placeholder={OPTIONAL}
        />
        <NairaInput
          label="Caution (optional)"
          value={values.caution_fee ?? ""}
          onChange={(v) => onValueChange("caution_fee", v)}
          placeholder={OPTIONAL}
        />
      </div>
    </div>
  );
}
