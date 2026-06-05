import type { ListingExtras, Property } from "@/types/database";

export type RentLineItem = {
  label: string;
  amount: number;
  note?: string;
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
    const cleaning = extras.cleaning_fee ?? 0;
    const caution = extras.caution_deposit ?? 0;
    const items: RentLineItem[] = [
      {
        label: `Nightly rate`,
        amount: price,
        note: property.payment_period,
      },
    ];
    if (cleaning > 0) items.push({ label: "Cleaning fee", amount: cleaning });
    if (caution > 0)
      items.push({ label: "Refundable caution", amount: caution });
    const total = price + cleaning + caution;
    return {
      items,
      total,
      headline: formatNaira(total),
    };
  }

  if (property.listing_type !== "rent" && property.listing_type !== "lease") {
    return null;
  }

  const isLease = property.listing_type === "lease";
  const extras = { ...DEFAULT_EXTRAS, ...getListingExtras(property) };
  const rent = price;
  const agencyFee = Math.round(rent * (extras.agency_fee_percent / 100));
  const cautionDeposit = Math.round(rent * (extras.caution_months / 12));
  const rentLabel =
    property.payment_period === "monthly"
      ? "Monthly lease"
      : isLease
        ? "Annual lease"
        : "Annual rent";
  const items: RentLineItem[] = [
    { label: rentLabel, amount: rent },
    {
      label: `Agency fee (${extras.agency_fee_percent}%)`,
      amount: agencyFee,
      note: "One-time",
    },
    {
      label: `Caution deposit (${extras.caution_months} mo)`,
      amount: cautionDeposit,
      note: "Refundable",
    },
  ];

  if (extras.agreement_fee > 0) {
    items.push({
      label: "Agreement fee",
      amount: extras.agreement_fee,
      note: "One-time",
    });
  }
  if (extras.service_charge > 0) {
    items.push({
      label: "Service charge",
      amount: extras.service_charge,
      note: "Annual",
    });
  }
  if (extras.legal_fee > 0) {
    items.push({ label: "Legal fee", amount: extras.legal_fee });
  }

  const total = items.reduce((sum, i) => sum + i.amount, 0);
  return {
    items,
    total,
    headline: formatNaira(total),
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
