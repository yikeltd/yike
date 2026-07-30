/**
 * UNIVERSAL LISTING FLOW ENGINE — ANALYTICS TRACKER
 * Instruments drop-off, step duration, validation errors, and completion telemetry.
 */

export type AnalyticsEventName =
  | "flow_started"
  | "step_viewed"
  | "step_completed"
  | "validation_error_triggered"
  | "back_navigated"
  | "draft_saved"
  | "publish_attempted"
  | "publish_succeeded"
  | "publish_failed";

export type AnalyticsPayload = {
  categoryId: string;
  stepId?: string;
  stepIndex?: number;
  durationMs?: number;
  errorField?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export function trackListingEngineEvent(
  eventName: AnalyticsEventName,
  payload: AnalyticsPayload
): void {
  const eventData = {
    event: `listing_engine_${eventName}`,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  // Safe client analytics logging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[ListingEngine Analytics] ${eventName}:`, eventData);
  }

  // Push to dataLayer if present
  if (typeof window !== "undefined" && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push(eventData);
  }
}
