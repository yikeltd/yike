export const LISTING_HISTORY_EVENT_TYPES = [
  "listing_created",
  "listing_published",
  "price_changed",
  "status_changed",
  "marked_rented",
  "marked_sold",
  "marked_unavailable",
  "reactivated",
  "expired",
  "verified_physical",
  "legal_review_requested",
  "legal_review_completed",
  "photos_updated",
  "description_updated",
  "agent_changed",
  "company_changed",
  "listing_boosted",
  "report_received",
  "admin_reviewed",
] as const;

export type ListingHistoryEventType = (typeof LISTING_HISTORY_EVENT_TYPES)[number];

export const PUBLIC_HISTORY_EVENT_TYPES = new Set<ListingHistoryEventType>([
  "reactivated",
  "verified_physical",
  "legal_review_completed",
]);
