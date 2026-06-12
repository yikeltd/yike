export type SubscriptionPlanCode = "free" | "pro_agent" | "agency" | "developer";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";

export const SUBSCRIPTION_DURATION_DAYS = 30;

export const PLAN_CODES: SubscriptionPlanCode[] = [
  "free",
  "pro_agent",
  "agency",
  "developer",
];

export const SUBSCRIPTION_ELIGIBLE_ACCOUNT_TYPES = new Set([
  "agent",
  "agency",
  "developer",
]);

export type PlanFeatures = {
  analytics: "basic" | "advanced";
  verification: "basic" | "business_included";
  featured_discount: number;
  boost_discount: number;
  priority_review?: boolean;
  agency_profile?: boolean;
  developer_profile?: boolean;
  project_showcase?: boolean;
  homepage_eligible?: boolean;
  team_support?: boolean;
  priority_support?: boolean;
  lead_insights?: boolean;
  lead_export?: boolean;
};

export const PLAN_DISPLAY: Record<
  SubscriptionPlanCode,
  {
    label: string;
    tagline: string;
    monthlyPrice: number;
    listingLimit: number | null;
    highlights: string[];
  }
> = {
  free: {
    label: "Free",
    tagline: "Start listing with trust basics",
    monthlyPrice: 0,
    listingLimit: 5,
    highlights: [
      "5 active listings",
      "Basic Verified",
      "Basic analytics",
    ],
  },
  pro_agent: {
    label: "Pro Agent",
    tagline: "Scale as a serious independent agent",
    monthlyPrice: 9_999,
    listingLimit: 30,
    highlights: [
      "30 active listings",
      "Business Verified included",
      "10% off Featured & Boost",
      "Advanced analytics",
      "Priority review queue",
      "Lead Insights included",
    ],
  },
  agency: {
    label: "Agency",
    tagline: "Branded team presence on Yike",
    monthlyPrice: 24_999,
    listingLimit: 100,
    highlights: [
      "100 active listings",
      "Agency profile page",
      "Business Verified included",
      "15% off Featured & Boost",
      "Priority support",
      "Team account support",
      "Lead Insights included",
    ],
  },
  developer: {
    label: "Developer",
    tagline: "Showcase projects at scale",
    monthlyPrice: 49_999,
    listingLimit: null,
    highlights: [
      "Unlimited project listings",
      "Developer profile & showcase",
      "Business Verified included",
      "20% off Featured & Boost",
      "Homepage eligibility",
      "Developer badge",
      "Lead Insights included",
    ],
  },
};

export const PLAN_BADGE_LABELS: Record<
  Exclude<SubscriptionPlanCode, "free">,
  string
> = {
  pro_agent: "Pro Agent",
  agency: "Agency",
  developer: "Developer",
};

/** Per-plan visual identity for pricing cards. */
export const PLAN_CARD_THEME: Record<
  SubscriptionPlanCode,
  {
    badge: string | null;
    audience: string;
    header: string;
    headerText: string;
    headerMuted: string;
    card: string;
    listingStat: string;
    check: string;
    cta: string;
    ctaMuted: string;
  }
> = {
  free: {
    badge: "Starter",
    audience: "Try Yike at no cost",
    header: "bg-slate-100 border-b border-border",
    headerText: "text-navy",
    headerMuted: "text-muted",
    card: "border-border bg-surface/60",
    listingStat: "text-slate-600",
    check: "text-slate-500",
    cta: "border border-border bg-white text-navy hover:bg-surface",
    ctaMuted: "border border-border bg-surface text-muted",
  },
  pro_agent: {
    badge: "Most popular",
    audience: "Independent agents scaling up",
    header: "bg-gold/20 border-b border-gold/30",
    headerText: "text-navy",
    headerMuted: "text-navy/70",
    card: "border-gold/45 bg-white shadow-lg ring-2 ring-gold/20 lg:-mt-1 lg:mb-1",
    listingStat: "text-gold-dark",
    check: "text-gold-dark",
    cta: "bg-gold text-navy shadow-sm hover:bg-gold/90",
    ctaMuted: "bg-gold/30 text-navy/70",
  },
  agency: {
    badge: "Teams",
    audience: "Agencies with multiple listers",
    header: "bg-navy border-b border-navy",
    headerText: "text-white",
    headerMuted: "text-white/75",
    card: "border-navy/25 bg-white shadow-md",
    listingStat: "text-navy",
    check: "text-navy",
    cta: "bg-navy text-white hover:bg-navy/90",
    ctaMuted: "bg-navy/15 text-navy/60",
  },
  developer: {
    badge: "Projects",
    audience: "Estate & project developers",
    header: "bg-gradient-to-br from-navy via-[#0a2d6b] to-navy border-b border-gold/30",
    headerText: "text-white",
    headerMuted: "text-gold/90",
    card: "border-navy/30 bg-gradient-to-b from-white via-white to-gold/10 shadow-md",
    listingStat: "text-navy",
    check: "text-gold-dark",
    cta: "bg-navy text-gold hover:bg-navy/95",
    ctaMuted: "bg-navy/10 text-navy/60",
  },
};

export function isSubscriptionPlanCode(value: string): value is SubscriptionPlanCode {
  return PLAN_CODES.includes(value as SubscriptionPlanCode);
}

export function getPlanDisplayLabel(code: string): string {
  return isSubscriptionPlanCode(code) ? PLAN_DISPLAY[code].label : "Free";
}

export function buildFallbackSubscriptionPlans(): Array<{
  plan_code: SubscriptionPlanCode;
  monthly_price: number;
  active_listing_limit: number | null;
}> {
  return PLAN_CODES.map((code) => ({
    plan_code: code,
    monthly_price: PLAN_DISPLAY[code].monthlyPrice,
    active_listing_limit: PLAN_DISPLAY[code].listingLimit,
  }));
}

export function isPaidPlan(code: SubscriptionPlanCode): boolean {
  return code !== "free";
}

export function formatListingLimit(limit: number | null): string {
  if (limit === null) return "Unlimited";
  return String(limit);
}

/** @deprecated Use getRevenueOffers() — founding offer is admin-controlled in revenue_offers. */
export function isFoundingOfferActive(): boolean {
  return true;
}
