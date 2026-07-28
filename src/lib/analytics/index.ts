/**
 * Yike Analytics Instrumentation — Funnel, Operations, Identity, Commerce, Seller CRM, Revenue, SMS & Intelligence Tracking (Phase 1.1–1.9)
 *
 * Lightweight, zero-dependency analytics logger for transaction lifecycle, case operations, Yike Passport, Deal, Seller CRM, Revenue, SMS, and Intelligence events.
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
  | "review_submitted"
  | "deal_created"
  | "deal_stage_changed"
  | "review_unlocked"
  | "gated_review_submitted"
  | "crm_opened"
  | "lead_progressed"
  | "listing_recommended"
  | "performance_insight_viewed"
  | "activity_opened"
  | "automation_triggered"
  | "order_created"
  | "order_paid"
  | "order_fulfilled"
  | "entitlement_granted"
  | "checkout_abandoned"
  | "coupon_applied"
  | "sms_otp_sent"
  | "sms_otp_verified"
  | "sms_notification_sent"
  | "recommendation_viewed"
  | "recommendation_accepted"
  | "recommendation_dismissed"
  | "listing_improved"
  | "deal_recovered"
  | "trust_improved"
  | "crm_insight_clicked";

export type AnalyticsPayload = {
  conversationId?: string;
  listingId?: string;
  caseId?: string;
  dealId?: string;
  sellerId?: string;
  orderId?: string;
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
