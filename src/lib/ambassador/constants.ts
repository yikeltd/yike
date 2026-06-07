export const AMBASSADOR_REF_COOKIE = "yike_ambassador_ref";
export const AMBASSADOR_REF_COOKIE_MAX_AGE = 30 * 86_400;

export const AMBASSADOR_CODE_PREFIX = "YKA";
export const DEFAULT_COMMISSION_RATE = 0.1;
export const DEFAULT_HOLD_DAYS = 10;
export const INACTIVITY_DAYS = 90;

export type AmbassadorStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "paused"
  | "disabled"
  | "inactive";

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "waitlisted";

export type CommissionStatus =
  | "pending"
  | "approved"
  | "payable"
  | "paid"
  | "reversed"
  | "fraud_review"
  | "held";

export type RevenueSourceType =
  | "featured_listing"
  | "premium_plan"
  | "listing_boost"
  | "company_verification"
  | "inspection_fee"
  | "direct_lead_package"
  | "future_premium_service";

export const REVENUE_SOURCE_LABELS: Record<RevenueSourceType, string> = {
  featured_listing: "Featured listing",
  premium_plan: "Premium plan",
  listing_boost: "Listing boost",
  company_verification: "Company verification",
  inspection_fee: "Inspection fee",
  direct_lead_package: "Lead package",
  future_premium_service: "Premium service",
};

export const ACTIVE_AMBASSADOR_STATUSES: AmbassadorStatus[] = [
  "approved",
  "paused",
  "inactive",
];

export function isValidAmbassadorCode(code: string): boolean {
  return /^YKA-[A-Z0-9]{5,12}$/i.test(code.trim());
}

export function normalizeAmbassadorCode(code: string): string {
  return code.trim().toUpperCase();
}

export function lagosYearMonth(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}
