import type { ListingValues } from "@/lib/listing-engine/types";
import { valuesToPropertyPayload } from "@/lib/listing-engine/adapters/property";

export type PropertyCreateApiBody = {
  listingId?: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
  pricingFields?: Record<string, unknown>;
};

const ENVELOPE_KEYS = new Set([
  "listingId",
  "idempotencyKey",
  "pricingFields",
  "payload",
]);

/** Build the POST body expected by `/api/agent/listings/create`. */
export function buildPropertyCreateApiBody(
  values: ListingValues,
  opts: {
    listingId?: string;
    mediaUrls?: string[];
    mediaItems?: unknown[];
    idempotencyKey?: string;
    pricingFields?: Record<string, unknown>;
  } = {},
): PropertyCreateApiBody {
  const flat = valuesToPropertyPayload(values, {
    listingId: opts.listingId,
    mediaUrls: opts.mediaUrls,
    mediaItems: opts.mediaItems,
  });
  const { listingId, ...payload } = flat;
  const resolvedListingId = opts.listingId ?? (listingId != null ? String(listingId) : undefined);
  return {
    ...(resolvedListingId ? { listingId: resolvedListingId } : {}),
    ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
    payload,
    pricingFields: opts.pricingFields ?? {},
  };
}

/**
 * Normalize inbound JSON for property create — supports envelope and legacy flat adapter bodies.
 */
export function normalizePropertyCreateRequest(
  body: Record<string, unknown>,
): PropertyCreateApiBody {
  if (body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)) {
    return {
      listingId:
        body.listingId != null ? String(body.listingId).trim() || undefined : undefined,
      idempotencyKey:
        body.idempotencyKey != null
          ? String(body.idempotencyKey).trim() || undefined
          : undefined,
      payload: body.payload as Record<string, unknown>,
      pricingFields:
        body.pricingFields && typeof body.pricingFields === "object"
          ? (body.pricingFields as Record<string, unknown>)
          : {},
    };
  }

  const payload: Record<string, unknown> = {};
  let listingId: string | undefined;
  let idempotencyKey: string | undefined;
  let pricingFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === "listingId" && value != null) {
      listingId = String(value).trim() || undefined;
      continue;
    }
    if (key === "idempotencyKey" && value != null) {
      idempotencyKey = String(value).trim() || undefined;
      continue;
    }
    if (key === "pricingFields" && value && typeof value === "object") {
      pricingFields = value as Record<string, unknown>;
      continue;
    }
    if (!ENVELOPE_KEYS.has(key)) {
      payload[key] = value;
    }
  }

  return { listingId, idempotencyKey, payload, pricingFields };
}
