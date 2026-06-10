/** Safe client-side submit stage logging — no PII, no photo bytes. */

export type ListingSubmitStage =
  | "listing_submit_started"
  | "photos_waiting"
  | "photos_completed"
  | "profile_checked"
  | "listing_record_created"
  | "photo_upload_started"
  | "photo_upload_completed"
  | "listing_submit_completed"
  | "listing_submit_failed"
  | "listing_submit_timeout";

type LogPayload = {
  stage: ListingSubmitStage;
  userId?: string;
  listingId?: string;
  photoCount?: number;
  durationMs?: number;
  errorCode?: string;
};

export function logListingSubmit(payload: LogPayload): void {
  if (process.env.NODE_ENV === "production") {
    console.info("[listing-submit]", payload);
  } else {
    console.debug("[listing-submit]", payload);
  }
}

const IDEMPOTENCY_PREFIX = "yike_listing_submit_idem_";

export function getListingSubmitIdempotencyKey(agentId: string): string {
  if (typeof window === "undefined") return `server_${agentId}`;
  const key = `${IDEMPOTENCY_PREFIX}${agentId}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(key, next);
  return next;
}

export function clearListingSubmitIdempotencyKey(agentId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${IDEMPOTENCY_PREFIX}${agentId}`);
}

const PENDING_LISTING_PREFIX = "yike_listing_submit_pending_";

export function getPendingListingId(agentId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${PENDING_LISTING_PREFIX}${agentId}`);
}

export function setPendingListingId(agentId: string, listingId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${PENDING_LISTING_PREFIX}${agentId}`, listingId);
}

export function clearPendingListingId(agentId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${PENDING_LISTING_PREFIX}${agentId}`);
}
