/**
 * Yike Intelligence Platform (YIP) — shared primitive types.
 *
 * These types have zero framework dependencies (no Next.js, no React) so this
 * package stays extractable as a standalone marketplace-intelligence library.
 */

/** Nominal-typing helper — keeps string-based ids from being interchanged by accident. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type CapabilityId = Brand<string, "CapabilityId">;
export type ProviderId = Brand<string, "ProviderId">;
export type EventType = Brand<string, "EventType">;

export function toCapabilityId(id: string): CapabilityId {
  return id as CapabilityId;
}

export function toProviderId(id: string): ProviderId {
  return id as ProviderId;
}

/** Qualitative confidence band — used wherever a numeric score would overstate certainty. */
export type Confidence = "low" | "medium" | "high";

/** 0–1 numeric confidence, for capabilities that can justify a finer signal. */
export type ConfidenceScore = number;

/**
 * Standard success/failure envelope for capability calls. Prefer this over
 * throwing so callers (UI, adapters) can render "not available yet" states
 * without try/catch sprawl.
 */
export type Result<T, E = YipErrorInfo> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export type YipErrorInfo = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

/** Generic label/value option — the knowledge layer's currency for pickable choices. */
export type KnowledgeOption = {
  value: string;
  label: string;
};

/** Marketplace vertical a piece of knowledge or a capability applies to. */
export type MarketplaceDomain = "vehicle" | "property" | (string & {});

/** Simple audit stamp reused across context/events/decisions. */
export type Actor = {
  userId?: string;
  role?: "guest" | "seller" | "agent" | "buyer" | "staff" | (string & {});
};
