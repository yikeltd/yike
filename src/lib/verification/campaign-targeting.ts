/**
 * Internal signals for selective verification / trust assistance promos.
 * Not exposed publicly. Used by admin tooling and future targeting jobs.
 */

export const BANNER_CAMPAIGN_TYPES = [
  "general_promo",
  "verification_promo",
  "legal_review_promo",
  "relocation_assistance",
  "premium_trust_assistance",
] as const;

export type BannerCampaignType = (typeof BANNER_CAMPAIGN_TYPES)[number];

/** Audience tags admins can attach to campaigns (stored in audience_targeting.audience). */
export const CAMPAIGN_AUDIENCE_TAGS = [
  "high_budget_search",
  "land_searcher",
  "relocation",
  "diaspora",
  "commercial_interest",
  "premium_area",
  "repeat_saver",
  "long_session",
  "high_intent_no_inquiry",
] as const;

export type CampaignAudienceTag = (typeof CAMPAIGN_AUDIENCE_TAGS)[number];

/** Internal value thresholds (NGN) — never show to users. */
export const INTERNAL_VALUE_THRESHOLDS = {
  landMinPrice: 5_000_000,
  propertyMinPrice: 3_000_000,
  commercialMinPrice: 10_000_000,
} as const;

export type CampaignAudienceTargeting = {
  audience?: CampaignAudienceTag[];
  notes?: string;
  minBudgetNgn?: number;
  propertyTypes?: string[];
};

export function parseAudienceTargeting(raw: unknown): CampaignAudienceTargeting {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const audience = Array.isArray(o.audience)
    ? o.audience.filter((t): t is CampaignAudienceTag =>
        typeof t === "string" && (CAMPAIGN_AUDIENCE_TAGS as readonly string[]).includes(t)
      )
    : undefined;
  return {
    audience,
    notes: typeof o.notes === "string" ? o.notes : undefined,
    minBudgetNgn: typeof o.minBudgetNgn === "number" ? o.minBudgetNgn : undefined,
    propertyTypes: Array.isArray(o.propertyTypes)
      ? o.propertyTypes.filter((t): t is string => typeof t === "string")
      : undefined,
  };
}
