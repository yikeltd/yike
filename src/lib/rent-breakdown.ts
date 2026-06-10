import type { FeeTransparencyMode, ListingExtras, Property } from "@/types/database";

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

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

const DEFAULT_EXTRAS: Required<
  Pick<
    ListingExtras,
    | "agency_fee_percent"
    | "caution_months"
    | "agreement_fee"
    | "service_charge"
    | "legal_fee"
  >
> = {
  agency_fee_percent: 10,
  caution_months: 12,
  agreement_fee: 50_000,
  service_charge: 0,
  legal_fee: 0,
};

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

export function calculateMoveInBreakdown(
  property: Property
): MoveInBreakdown | null {
  const price = Number(property.price);

  if (property.listing_type === "sale" || property.payment_period === "total") {
    return null;
  }

  if (property.listing_type === "shortlet") {
    const extras = getListingExtras(property);
    const items: RentLineItem[] = [
      {
        label: `Nightly rate`,
        amount: price,
        note: property.payment_period,
      },
    ];
    const cleaningFlex = flexLabel(extras.cleaning_fee_mode);
    const cautionFlex = flexLabel(extras.caution_deposit_mode);
    if (cleaningFlex) {
      items.push({ label: "Cleaning fee", amount: 0, note: cleaningFlex, flexible: true });
    } else {
      const cleaningAmount =
        extras.cleaning_fee_mode === "percent"
          ? percentAmount(price, extras.cleaning_fee)
          : (extras.cleaning_fee ?? 0);
      if (cleaningAmount > 0) {
        items.push({
          label:
            extras.cleaning_fee_mode === "percent"
              ? `Cleaning fee (${extras.cleaning_fee}%)`
              : "Cleaning fee",
          amount: cleaningAmount,
        });
      }
    }
    if (cautionFlex) {
      items.push({ label: "Refundable caution", amount: 0, note: cautionFlex, flexible: true });
    } else {
      const cautionAmount =
        extras.caution_deposit_mode === "percent"
          ? percentAmount(price, extras.caution_deposit)
          : (extras.caution_deposit ?? 0);
      if (cautionAmount > 0) {
        items.push({
          label:
            extras.caution_deposit_mode === "percent"
              ? `Refundable caution (${extras.caution_deposit}%)`
              : "Refundable caution",
          amount: cautionAmount,
        });
      }
    }
    const cleaningTotal =
      extras.cleaning_fee_mode === "percent"
        ? percentAmount(price, extras.cleaning_fee)
        : (extras.cleaning_fee ?? 0);
    const cautionTotal =
      extras.caution_deposit_mode === "percent"
        ? percentAmount(price, extras.caution_deposit)
        : (extras.caution_deposit ?? 0);
    const total =
      price +
      (flexLabel(extras.cleaning_fee_mode) ? 0 : cleaningTotal) +
      (flexLabel(extras.caution_deposit_mode) ? 0 : cautionTotal);
    return {
      items,
      total,
      headline: extras.fees_flexible_note
        ? `From ${formatNaira(price)}`
        : formatNaira(total),
    };
  }

  if (property.listing_type !== "rent" && property.listing_type !== "lease") {
    return null;
  }

  const isLease = property.listing_type === "lease";
  const raw = getListingExtras(property);
  const extras = { ...DEFAULT_EXTRAS, ...raw };
  const rent = price;
  const rentLabel =
    property.payment_period === "monthly"
      ? "Monthly lease"
      : isLease
        ? "Annual lease"
        : "Annual rent";
  const items: RentLineItem[] = [{ label: rentLabel, amount: rent }];

  function pushFee(
    label: string,
    amount: number,
    mode?: FeeTransparencyMode,
    note?: string
  ) {
    const flex = flexLabel(mode);
    if (flex) {
      items.push({ label, amount: 0, note: flex, flexible: true });
      return;
    }
    if (amount > 0) items.push({ label, amount, note });
  }

  const agencyMode = raw.agency_fee_mode;
  if (agencyMode === "exact" && raw.agency_fee != null) {
    pushFee("Agency fee", raw.agency_fee, agencyMode, "One-time");
  } else {
    const agencyPct = extras.agency_fee_percent ?? 10;
    pushFee(
      `Agency fee (${agencyPct}%)`,
      percentAmount(rent, agencyPct),
      raw.agency_fee_mode,
      "One-time"
    );
  }
  const cautionMo = extras.caution_months ?? 12;
  if (raw.caution_fee_mode === "percent" && raw.caution_fee_percent != null) {
    pushFee(
      `Caution deposit (${raw.caution_fee_percent}%)`,
      percentAmount(rent, raw.caution_fee_percent),
      raw.caution_fee_mode,
      "Refundable"
    );
  } else if (raw.caution_deposit != null) {
    pushFee("Caution deposit", raw.caution_deposit, raw.caution_fee_mode, "Refundable");
  } else {
    pushFee(
      `Caution deposit (${cautionMo} mo)`,
      Math.round(rent * (cautionMo / 12)),
      raw.caution_fee_mode,
      "Refundable"
    );
  }
  pushFee(
    raw.agreement_fee_mode === "percent" && raw.agreement_fee_percent != null
      ? `Agreement fee (${raw.agreement_fee_percent}%)`
      : "Agreement fee",
    raw.agreement_fee_mode === "percent"
      ? percentAmount(rent, raw.agreement_fee_percent)
      : (extras.agreement_fee ?? 0),
    raw.agreement_fee_mode,
    "One-time"
  );
  pushFee(
    raw.service_charge_mode === "percent" && raw.service_charge_percent != null
      ? `Service charge (${raw.service_charge_percent}%)`
      : "Service charge",
    raw.service_charge_mode === "percent"
      ? percentAmount(rent, raw.service_charge_percent)
      : (extras.service_charge ?? 0),
    raw.service_charge_mode,
    "Annual"
  );
  pushFee(
    raw.legal_fee_mode === "percent" && raw.legal_fee_percent != null
      ? `Legal fee (${raw.legal_fee_percent}%)`
      : "Legal fee",
    raw.legal_fee_mode === "percent"
      ? percentAmount(rent, raw.legal_fee_percent)
      : (extras.legal_fee ?? 0),
    raw.legal_fee_mode
  );

  const total = items.reduce((sum, i) => sum + (i.flexible ? 0 : i.amount), 0);
  const hasFlex =
    Boolean(raw.fees_flexible_note) ||
    items.some((i) => i.flexible);
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
