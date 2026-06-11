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
