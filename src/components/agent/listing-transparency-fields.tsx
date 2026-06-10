"use client";

import type { FeeTransparencyMode, ListingExtras } from "@/types/database";
import { parseFeeValue } from "@/lib/listing-fee-parse";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FeeKey =
  | "agency_fee"
  | "caution_fee"
  | "agreement_fee"
  | "service_charge"
  | "legal_fee"
  | "cleaning_fee"
  | "caution_deposit";

const MODES: { id: FeeTransparencyMode; label: string }[] = [
  { id: "exact", label: "Exact" },
  { id: "percent", label: "%" },
  { id: "negotiable", label: "Negotiable" },
  { id: "landlord", label: "Discuss with landlord" },
];

type FieldDef = {
  key: FeeKey;
  label: string;
  placeholder: string;
};

const RENT_FIELDS: FieldDef[] = [
  { key: "agency_fee", label: "Agency fee", placeholder: "e.g. 10%" },
  { key: "caution_fee", label: "Refundable caution", placeholder: "e.g. ₦300,000 or 10%" },
  { key: "agreement_fee", label: "Agreement fee", placeholder: "e.g. ₦150,000" },
  { key: "service_charge", label: "Service charge", placeholder: "e.g. ₦500,000/year" },
  { key: "legal_fee", label: "Legal fee", placeholder: "e.g. ₦150,000" },
];

export function ListingTransparencyFields({
  listingType,
  values,
  modes,
  onValueChange,
  onModeChange,
  initial,
}: {
  listingType: "rent" | "lease" | "sale" | "shortlet";
  values: Record<string, string>;
  modes: Record<string, FeeTransparencyMode>;
  onValueChange: (key: string, value: string) => void;
  onModeChange: (key: string, mode: FeeTransparencyMode) => void;
  initial?: ListingExtras | null;
}) {
  if (listingType === "shortlet") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted">Leave blank if not applicable.</p>
        <FeeRow
          field={{ key: "cleaning_fee", label: "Cleaning fee", placeholder: "e.g. ₦15,000" }}
          value={values.cleaning_fee ?? ""}
          mode={modes.cleaning_fee ?? "exact"}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
        <FeeRow
          field={{ key: "caution_deposit", label: "Refundable caution", placeholder: "e.g. ₦50,000" }}
          value={values.caution_deposit ?? ""}
          mode={modes.caution_deposit ?? "exact"}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
      </div>
    );
  }

  if (listingType === "sale") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted">Add exact fees where available.</p>
        <FeeRow
          field={{ key: "legal_fee", label: "Legal / documentation", placeholder: "e.g. ₦200,000" }}
          value={values.legal_fee ?? ""}
          mode={modes.legal_fee ?? "exact"}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">Skip any fee you don&apos;t know yet.</p>
      {RENT_FIELDS.map((field) => (
        <FeeRow
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          mode={modes[field.key] ?? "exact"}
          onValueChange={onValueChange}
          onModeChange={onModeChange}
        />
      ))}
    </div>
  );
}

function FeeRow({
  field,
  value,
  mode,
  onValueChange,
  onModeChange,
}: {
  field: FieldDef;
  value: string;
  mode: FeeTransparencyMode;
  onValueChange: (key: string, value: string) => void;
  onModeChange: (key: string, mode: FeeTransparencyMode) => void;
}) {
  const needsInput = mode === "exact" || mode === "percent";

  return (
    <div className="rounded-xl border border-navy/8 bg-surface/50 p-3">
      <p className="text-xs font-bold text-navy">{field.label}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(field.key, m.id)}
            className={cn(
              "pressable rounded-full px-2.5 py-1 text-[10px] font-bold",
              mode === m.id ? "bg-gold text-navy" : "bg-white text-muted ring-1 ring-navy/10"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {needsInput ? (
        <Input
          value={value}
          onChange={(e) => onValueChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-2 h-10 rounded-xl"
        />
      ) : (
        <p className="mt-2 text-[11px] text-muted">No fixed amount required.</p>
      )}
    </div>
  );
}

/** Map form transparency state into ListingExtras for persistence. */
export function transparencyToExtras(
  listingType: string,
  values: Record<string, string>,
  modes: Record<string, FeeTransparencyMode>
): ListingExtras {
  const extras: ListingExtras = {};
  const flex = new Set<FeeTransparencyMode>(["negotiable", "landlord", "not_fixed"]);

  function apply(
    key: FeeKey,
    modeField: keyof ListingExtras,
    valueField: keyof ListingExtras,
    raw: string,
    mode: FeeTransparencyMode,
    percentField?: keyof ListingExtras
  ) {
    (extras as Record<string, FeeTransparencyMode>)[modeField as string] = mode;
    if (!flex.has(mode)) {
      const n = parseFeeValue(raw, mode);
      if (n != null) {
        const targetField = mode === "percent" && percentField ? percentField : valueField;
        (extras as Record<string, number>)[targetField as string] = n;
      }
    }
  }

  if (listingType === "rent" || listingType === "lease") {
    apply(
      "agency_fee",
      "agency_fee_mode",
      "agency_fee",
      values.agency_fee ?? "",
      modes.agency_fee ?? "exact",
      "agency_fee_percent"
    );
    apply(
      "caution_fee",
      "caution_fee_mode",
      "caution_deposit",
      values.caution_fee ?? "",
      modes.caution_fee ?? "exact",
      "caution_fee_percent"
    );
    apply(
      "agreement_fee",
      "agreement_fee_mode",
      "agreement_fee",
      values.agreement_fee ?? "",
      modes.agreement_fee ?? "exact",
      "agreement_fee_percent"
    );
    apply(
      "service_charge",
      "service_charge_mode",
      "service_charge",
      values.service_charge ?? "",
      modes.service_charge ?? "exact",
      "service_charge_percent"
    );
    apply(
      "legal_fee",
      "legal_fee_mode",
      "legal_fee",
      values.legal_fee ?? "",
      modes.legal_fee ?? "exact",
      "legal_fee_percent"
    );
  }

  if (listingType === "shortlet") {
    apply(
      "cleaning_fee",
      "cleaning_fee_mode",
      "cleaning_fee",
      values.cleaning_fee ?? "",
      modes.cleaning_fee ?? "exact"
    );
    apply(
      "caution_deposit",
      "caution_deposit_mode",
      "caution_deposit",
      values.caution_deposit ?? "",
      modes.caution_deposit ?? "exact"
    );
  }

  if (listingType === "sale") {
    apply(
      "legal_fee",
      "legal_fee_mode",
      "legal_fee",
      values.legal_fee ?? "",
      modes.legal_fee ?? "exact"
    );
    apply(
      "agency_fee",
      "agency_fee_mode",
      "agency_fee",
      values.agency_fee ?? "",
      modes.agency_fee ?? "exact",
      "agency_fee_percent"
    );
  }

  if (Object.values(modes).some((m) => flex.has(m))) {
    extras.fees_flexible_note =
      "Some charges may be finalized with the landlord.";
  }

  return extras;
}
