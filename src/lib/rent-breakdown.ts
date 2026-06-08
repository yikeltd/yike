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
    } else if ((extras.cleaning_fee ?? 0) > 0) {
      items.push({ label: "Cleaning fee", amount: extras.cleaning_fee! });
    }
    if (cautionFlex) {
      items.push({ label: "Refundable caution", amount: 0, note: cautionFlex, flexible: true });
    } else if ((extras.caution_deposit ?? 0) > 0) {
      items.push({ label: "Refundable caution", amount: extras.caution_deposit! });
    }
    const total =
      price +
      (extras.cleaning_fee_mode ? 0 : extras.cleaning_fee ?? 0) +
      (extras.caution_deposit_mode ? 0 : extras.caution_deposit ?? 0);
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

  const agencyPct = extras.agency_fee_percent ?? 10;
  pushFee(
    `Agency fee (${agencyPct}%)`,
    Math.round(rent * (agencyPct / 100)),
    raw.agency_fee_mode,
    "One-time"
  );
  const cautionMo = extras.caution_months ?? 12;
  pushFee(
    `Caution deposit (${cautionMo} mo)`,
    Math.round(rent * (cautionMo / 12)),
    raw.caution_fee_mode,
    "Refundable"
  );
  pushFee(
    "Agreement fee",
    extras.agreement_fee ?? 0,
    raw.agreement_fee_mode,
    "One-time"
  );
  pushFee(
    "Service charge",
    extras.service_charge ?? 0,
    raw.service_charge_mode,
    "Annual"
  );
  pushFee("Legal fee", extras.legal_fee ?? 0, raw.legal_fee_mode);

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
