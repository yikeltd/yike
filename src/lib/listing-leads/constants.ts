export type ListingLeadType =
  | "whatsapp"
  | "call"
  | "save"
  | "follow"
  | "message"
  | "verification_request";

export type ListingLeadStatus = "new" | "contacted" | "qualified" | "closed" | "lost";

export type LeadSource =
  | "homepage"
  | "search"
  | "featured"
  | "boosted"
  | "agency_profile"
  | "developer_profile"
  | "direct_link"
  | "social"
  | "other";

export const LISTING_LEAD_STATUSES: ListingLeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "closed",
  "lost",
];

export const LEAD_QUALITY_SCORE: Record<ListingLeadType, number> = {
  whatsapp: 1,
  call: 2,
  save: 1,
  follow: 1,
  message: 4,
  verification_request: 5,
};

export const FREE_PLAN_LEAD_LIMIT = 10;

export const LEAD_INSIGHTS_MONTHLY_PRICE = 4_999;

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  homepage: "Homepage",
  search: "Search",
  featured: "Featured",
  boosted: "Boosted",
  agency_profile: "Agency profile",
  developer_profile: "Developer profile",
  direct_link: "Direct link",
  social: "Social",
  other: "Other",
};

export function isListingLeadType(value: string): value is ListingLeadType {
  return (
    value === "whatsapp" ||
    value === "call" ||
    value === "save" ||
    value === "follow" ||
    value === "message" ||
    value === "verification_request"
  );
}

export function isListingLeadStatus(value: string): value is ListingLeadStatus {
  return LISTING_LEAD_STATUSES.includes(value as ListingLeadStatus);
}
