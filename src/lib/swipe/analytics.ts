import { trackEvent } from "@/lib/analytics";

export type SwipeAnalyticsPayload = {
  listing_id: string;
  city?: string;
  area?: string;
  frame_count?: number;
  frame_index?: number;
  dwell_ms?: number;
  reason?: string;
  direction?: "left" | "right";
};

export function trackSwipeSkip(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_skip", { ...payload, direction: payload.direction ?? "left" });
}

export function trackSwipePhotoAdvance(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_photo_advance", payload);
}

export function trackSwipeListingOpen(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_listing_open", payload);
}

export function trackSwipeNotInterested(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_not_interested", payload);
}

export function trackSwipeFrameComplete(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_frame_complete", payload);
}

export function trackSwipeDwell(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_dwell", payload);
}

export function trackSwipeSave(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_save", payload);
}

export function trackSwipeWhatsapp(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_whatsapp", payload);
}

export function trackSwipeExit(payload: SwipeAnalyticsPayload) {
  trackEvent("swipe_exit", payload);
}
