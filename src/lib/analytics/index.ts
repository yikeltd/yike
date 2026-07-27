/**
 * Yike Analytics Instrumentation — Funnel, Operations & Identity Tracking (Phase 1.1, 1.2, 1.3)
 *
 * Lightweight, zero-dependency analytics logger for transaction lifecycle, case operations, and Yike Passport events.
 */

export type AnalyticsEventName =
  | "conversation_created"
  | "message_sent"
  | "offer_created"
  | "offer_accepted"
  | "offer_rejected"
  | "viewing_requested"
  | "viewing_accepted"
  | "inspection_requested"
  | "buyer_assistance_requested"
  | "deal_completed"
  | "deal_cancelled"
  | "case_created"
  | "case_assigned"
  | "case_started"
  | "case_completed"
  | "customer_updated"
  | "officer_changed"
  | "case_escalated"
  | "identity_verified"
  | "business_verified"
  | "trust_score_changed"
  | "badge_awarded"
  | "badge_removed"
  | "trust_profile_viewed"
  | "review_submitted";

export type AnalyticsPayload = {
  conversationId?: string;
  listingId?: string;
  caseId?: string;
  userId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

/** Log transaction lifecycle event for analytics instrumentation */
export function trackTransactionEvent(
  eventName: AnalyticsEventName,
  payload: AnalyticsPayload
): void {
  const event = {
    eventName,
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };

  // In production posture, writes to time-series event log table or analytics stream
  if (process.env.NODE_ENV !== "test") {
    console.log(`[YIKE_ANALYTICS] ${eventName}:`, JSON.stringify(event));
  }
}
