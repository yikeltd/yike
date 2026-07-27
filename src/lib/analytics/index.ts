/**
 * Yike Analytics Instrumentation — Phase 1.1 Funnel Tracking
 *
 * Lightweight, zero-dependency analytics logger for transaction lifecycle events.
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
  | "deal_cancelled";

export type AnalyticsPayload = {
  conversationId?: string;
  listingId?: string;
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
