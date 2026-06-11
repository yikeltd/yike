export type PromotionAnalyticsClientEvent =
  | "featured_impression"
  | "featured_click"
  | "boost_impression"
  | "boost_click";

export function logFeaturedAnalyticsEvent(
  listingId: string,
  eventType: "featured_impression" | "featured_click"
): void {
  void fetch("/api/analytics/featured-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, eventType }),
  });
}

export function logPromotionAnalyticsEvent(
  listingId: string,
  eventType: PromotionAnalyticsClientEvent
): void {
  void fetch("/api/analytics/promotion-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, eventType }),
  });
}
