import type { FeeTransparencyMode, ListingExtras, Property } from "@/types/database";
import { parseFeeValue } from "@/lib/listing-fee-parse";

export type RentLineItem = {
  label: string;
  amount: number;
  note?: string;
  flexible?: boolean;
};

export type MoveInBreakdown = {
  items: RentLineItem[];
  total: number;
  headline: string;
};

export type EditableFeeField = {
  raw: string;
  mode: FeeTransparencyMode;
};

export type MoveInEditableState = {
  rent: number;
  agency: EditableFeeField;
  caution: EditableFeeField;
  agreement: EditableFeeField;
  serviceCharge: EditableFeeField;
  legal: EditableFeeField;
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

const FLEX_LABEL: Record<FeeTransparencyMode, string> = {
  exact: "",
  percent: "",
  negotiable: "Negotiable",
  landlord: "Discuss with landlord",
  not_fixed: "Not fixed yet",
};

function flexLabel(mode?: FeeTransparencyMode): string | null {
  if (!mode || mode === "exact" || mode === "percent") return null;
  return FLEX_LABEL[mode];
}

function percentAmount(base: number, percent: number | null | undefined): number {
  if (percent == null || !Number.isFinite(percent) || percent <= 0) return 0;
  return Math.round(base * (percent / 100));
}

export function getListingExtras(property: Property): ListingExtras {
  return property.extras ?? {};
}

function feeFieldFromExtras(
  extras: ListingExtras,
  keys: {
    mode: keyof ListingExtras;
    amount: keyof ListingExtras;
    percent: keyof ListingExtras;
    formKey?: "agency_fee" | "caution_fee" | "agreement_fee" | "service_charge" | "legal_fee";
  }
): EditableFeeField {
  const mode = (extras[keys.mode] as FeeTransparencyMode | undefined) ?? "exact";
  const amount = extras[keys.amount] as number | undefined;
  const percent = extras[keys.percent] as number | undefined;

  if (mode === "percent" && percent != null) {
    return { raw: `${percent}%`, mode: "percent" };
  }
  if (amount != null && amount > 0) {
    return { raw: String(amount), mode: mode === "percent" ? "exact" : mode };
  }
  if (percent != null && percent > 0) {
    return { raw: `${percent}%`, mode: "percent" };
  }
  return { raw: "", mode };
}

export function extrasToMoveInEditableState(property: Property): MoveInEditableState {
  const extras = getListingExtras(property);
  return {
    rent: Number(property.price),
    agency: feeFieldFromExtras(extras, {
      mode: "agency_fee_mode",
      amount: "agency_fee",
      percent: "agency_fee_percent",
    }),
    caution: feeFieldFromExtras(extras, {
      mode: "caution_fee_mode",
      amount: "caution_deposit",
      percent: "caution_fee_percent",
    }),
    agreement: feeFieldFromExtras(extras, {
      mode: "agreement_fee_mode",
      amount: "agreement_fee",
      percent: "agreement_fee_percent",
    }),
    serviceCharge: feeFieldFromExtras(extras, {
      mode: "service_charge_mode",
      amount: "service_charge",
      percent: "service_charge_percent",
    }),
    legal: feeFieldFromExtras(extras, {
      mode: "legal_fee_mode",
      amount: "legal_fee",
      percent: "legal_fee_percent",
    }),
  };
}

function resolveFeeAmount(
  rent: number,
  field: EditableFeeField
): { amount: number; labelSuffix: string; flexible: boolean; flexNote?: string } {
  const flex = flexLabel(field.mode);
  if (flex) {
    return { amount: 0, labelSuffix: "", flexible: true, flexNote: flex };
  }
  if (!field.raw.trim()) {
    return { amount: 0, labelSuffix: "", flexible: false };
  }
  const mode = field.raw.includes("%") ? "percent" : field.mode;
  const n = parseFeeValue(field.raw, mode);
  if (n == null || n <= 0) {
    return { amount: 0, labelSuffix: "", flexible: false };
  }
  if (mode === "percent") {
    return {
      amount: percentAmount(rent, n),
      labelSuffix: ` (${n}%)`,
      flexible: false,
    };
  }
  return { amount: n, labelSuffix: "", flexible: false };
}

export function buildMoveInItems(
  state: MoveInEditableState,
  isLease: boolean,
  paymentPeriod?: string
): RentLineItem[] {
  const rentLabel =
    paymentPeriod === "monthly"
      ? "Monthly rent"
      : isLease
        ? "Annual lease"
        : "Annual rent";

  const items: RentLineItem[] = [{ label: rentLabel, amount: state.rent }];

  const agency = resolveFeeAmount(state.rent, state.agency);
  if (agency.flexible) {
    items.push({
      label: `Agency fee${agency.labelSuffix}`,
      amount: 0,
      note: agency.flexNote,
      flexible: true,
    });
  } else if (agency.amount > 0) {
    items.push({
      label: `Agency fee${agency.labelSuffix}`,
      amount: agency.amount,
      note: "One-time",
    });
  }

  const caution = resolveFeeAmount(state.rent, state.caution);
  if (caution.flexible) {
    items.push({
      label: "Refundable caution",
      amount: 0,
      note: caution.flexNote,
      flexible: true,
    });
  } else if (caution.amount > 0) {
    items.push({
      label: `Refundable caution${caution.labelSuffix}`,
      amount: caution.amount,
      note: "Refundable",
    });
  }

  const agreement = resolveFeeAmount(state.rent, state.agreement);
  if (agreement.flexible) {
    items.push({
      label: "Agreement fee",
      amount: 0,
      note: agreement.flexNote,
      flexible: true,
    });
  } else if (agreement.amount > 0) {
    items.push({
      label: `Agreement fee${agreement.labelSuffix}`,
      amount: agreement.amount,
      note: "One-time",
    });
  }

  const service = resolveFeeAmount(state.rent, state.serviceCharge);
  if (service.flexible) {
    items.push({
      label: "Service charge",
      amount: 0,
      note: service.flexNote,
      flexible: true,
    });
  } else if (service.amount > 0) {
    items.push({
      label: `Service charge${service.labelSuffix}`,
      amount: service.amount,
      note: "Annual",
    });
  }

  const legal = resolveFeeAmount(state.rent, state.legal);
  if (legal.flexible) {
    items.push({
      label: "Legal fee",
      amount: 0,
      note: legal.flexNote,
      flexible: true,
    });
  } else if (legal.amount > 0) {
    items.push({
      label: `Legal fee${legal.labelSuffix}`,
      amount: legal.amount,
    });
  }

  return items;
}

function addShortletFees(property: Property, price: number): MoveInBreakdown | null {
  const extras = getListingExtras(property);
  const items: RentLineItem[] = [
    { label: "Nightly rate", amount: price, note: property.payment_period },
  ];

  const cleaning = feeFieldFromExtras(extras, {
    mode: "cleaning_fee_mode",
    amount: "cleaning_fee",
    percent: "cleaning_fee",
  });
  const caution = feeFieldFromExtras(extras, {
    mode: "caution_deposit_mode",
    amount: "caution_deposit",
    percent: "caution_deposit",
  });

  for (const [label, field] of [
    ["Cleaning fee", cleaning],
    ["Refundable caution", caution],
  ] as const) {
    const resolved = resolveFeeAmount(price, field);
    if (resolved.flexible) {
      items.push({ label, amount: 0, note: resolved.flexNote, flexible: true });
    } else if (resolved.amount > 0) {
      items.push({
        label: `${label}${resolved.labelSuffix}`,
        amount: resolved.amount,
        note: label === "Refundable caution" ? "Refundable" : undefined,
      });
    }
  }

  const total = items.reduce((sum, i) => sum + (i.flexible ? 0 : i.amount), 0);
  const hasFlex = Boolean(extras.fees_flexible_note) || items.some((i) => i.flexible);
  return {
    items,
    total,
    headline: hasFlex ? `From ${formatNaira(price)}` : formatNaira(total),
  };
}

export function calculateMoveInBreakdown(property: Property): MoveInBreakdown | null {
  const price = Number(property.price);

  if (property.listing_type === "sale" || property.payment_period === "total") {
    return null;
  }

  if (property.listing_type === "shortlet") {
    return addShortletFees(property, price);
  }

  if (property.listing_type !== "rent" && property.listing_type !== "lease") {
    return null;
  }

  const state = extrasToMoveInEditableState(property);
  const items = buildMoveInItems(
    state,
    property.listing_type === "lease",
    property.payment_period
  );
  const total = items.reduce((sum, i) => sum + (i.flexible ? 0 : i.amount), 0);
  const hasFlex =
    Boolean(property.extras?.fees_flexible_note) || items.some((i) => i.flexible);

  return {
    items,
    total,
    headline: hasFlex ? `~${formatNaira(total)}` : formatNaira(total),
  };
}

export function formatMoveInHint(property: Property): string | null {
  const breakdown = calculateMoveInBreakdown(property);
  if (!breakdown) return null;
  if (property.listing_type === "shortlet") {
    return `From ${breakdown.headline}`;
  }
  if (property.listing_type === "lease") {
    return `~${breakdown.headline} upfront`;
  }
  return `~${breakdown.headline} move-in`;
}
