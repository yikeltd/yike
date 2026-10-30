import { createHash } from "node:crypto";

export type ListingCreateScope = "property" | "vehicle" | "electronics";

const SCOPE_FIELDS: Record<ListingCreateScope, string[]> = {
  property: [
    "title",
    "price",
    "listing_type",
    "property_type",
    "state",
    "city",
    "bedrooms",
    "media_urls",
  ],
  vehicle: [
    "title",
    "price",
    "state",
    "city",
    "make",
    "model",
    "year",
    "auto_category",
    "vehicle_condition",
    "media_urls",
  ],
  electronics: [
    "title",
    "price",
    "state",
    "city",
    "make",
    "model",
    "auto_category",
    "condition",
    "media_urls",
  ],
};

function normalizeValue(key: string, value: unknown): unknown {
  if (key === "media_urls" && Array.isArray(value)) {
    return [...value.map(String).filter(Boolean)].sort();
  }
  if (typeof value === "string") return value.trim();
  return value;
}

export function fingerprintListingCreatePayload(
  scope: ListingCreateScope,
  row: Record<string, unknown>,
): string {
  const keys = SCOPE_FIELDS[scope];
  const canonical: Record<string, unknown> = { scope };
  for (const key of keys) {
    if (row[key] !== undefined) {
      canonical[key] = normalizeValue(key, row[key]);
    }
  }
  const json = JSON.stringify(canonical);
  return createHash("sha256").update(json).digest("hex");
}

export type ListingCreateIdempotencyExtras = {
  scope: ListingCreateScope;
  fingerprint: string;
  idempotency_key: string;
};

export function readListingCreateIdempotencyExtras(
  extras: unknown,
): ListingCreateIdempotencyExtras | null {
  if (!extras || typeof extras !== "object" || Array.isArray(extras)) return null;
  const block = (extras as Record<string, unknown>).listing_create_idempotency;
  if (!block || typeof block !== "object" || Array.isArray(block)) return null;
  const rec = block as Record<string, unknown>;
  const scope = rec.scope;
  const fingerprint = rec.fingerprint;
  const idempotency_key = rec.idempotency_key;
  if (
    (scope !== "property" && scope !== "vehicle" && scope !== "electronics") ||
    typeof fingerprint !== "string" ||
    typeof idempotency_key !== "string"
  ) {
    return null;
  }
  return {
    scope,
    fingerprint,
    idempotency_key,
  };
}

export function withListingCreateIdempotencyExtras(
  row: Record<string, unknown>,
  meta: ListingCreateIdempotencyExtras,
): Record<string, unknown> {
  const prevExtras =
    row.extras && typeof row.extras === "object" && !Array.isArray(row.extras)
      ? (row.extras as Record<string, unknown>)
      : {};
  return {
    ...row,
    extras: {
      ...prevExtras,
      listing_create_idempotency: meta,
    },
  };
}
