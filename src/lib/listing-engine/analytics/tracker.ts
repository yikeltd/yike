import { activeAnalyticsProvider } from "./analytics-adapter";

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
  activeAnalyticsProvider.trackEvent(eventName, payload);
}
