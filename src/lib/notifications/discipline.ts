/** Intentional notification categories — avoid spam / engagement farming. */
export const ALLOWED_NOTIFICATION_TYPES = new Set([
  "saved_listing_updated",
  "new_listing_followed_area",
  "agent_responded",
  "verification_approved",
  "inspection_scheduled",
  "listing_approved",
  "listing_rejected",
]);

export const BLOCKED_NOTIFICATION_TYPES = new Set([
  "marketing_push",
  "engagement_reminder",
  "daily_digest",
  "promo_blast",
]);

export function isAllowedNotificationType(type: string): boolean {
  if (BLOCKED_NOTIFICATION_TYPES.has(type)) return false;
  return ALLOWED_NOTIFICATION_TYPES.has(type);
}
