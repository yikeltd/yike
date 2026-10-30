import { createHash } from "node:crypto";
import {
  fingerprintListingCreatePayload,
  readListingCreateIdempotencyExtras,
  type ListingCreateScope,
} from "@/lib/listing-create/payload-fingerprint";

/** Columns required to verify payload match when extras are absent (legacy rows). */
export const IDEMPOTENCY_ROW_FINGERPRINT_SELECT =
  "id, slug, status, agent_id, asset_type, extras, title, price, state, city, media_urls, listing_type, property_type, bedrooms, make, model, year, auto_category, vehicle_condition, condition";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Deterministic UUID-shaped id for create idempotency (agent + key + vertical scope). */
export function deterministicListingCreateId(
  scope: ListingCreateScope,
  agentId: string,
  idempotencyKey: string,
): string {
  const hash = createHash("sha256")
    .update(`${scope}\0${agentId}\0${idempotencyKey.trim()}`)
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function normalizeIdempotencyKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length >= 8 && trimmed.length <= 128 ? trimmed : null;
}

export type IdempotentListingRow = {
  id: string;
  slug?: string | null;
  status?: string | null;
  agent_id?: string | null;
  asset_type?: string | null;
  extras?: Record<string, unknown> | null;
};

export type PropertiesInsertClient = {
  from(table: "properties"): {
    select(cols: string): {
      eq(col: string, val: string): {
        maybeSingle(): Promise<{
          data: IdempotentListingRow | null;
          error: { message: string; code?: string } | null;
        }>;
        single(): Promise<{
          data: IdempotentListingRow | null;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
    insert(row: Record<string, unknown>): {
      select(cols: string): {
        single(): Promise<{
          data: IdempotentListingRow | null;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
  };
};

export type IdempotentInsertResult =
  | { ok: true; listing: IdempotentListingRow; created: boolean }
  | {
      ok: false;
      error: string;
      status: number;
      code?: string;
    };

function canReplayExistingRow(
  existing: IdempotentListingRow,
  expected: {
    agentId: string;
    assetType: string;
    scope: ListingCreateScope;
    payloadFingerprint: string;
  },
): { ok: true } | { ok: false; error: string; code: string } {
  if (existing.agent_id !== expected.agentId) {
    return { ok: false, error: "Listing id conflict", code: "id_conflict" };
  }
  if (
    existing.asset_type &&
    existing.asset_type !== expected.assetType
  ) {
    return {
      ok: false,
      error: "Idempotency key already used for another listing type",
      code: "idempotency_scope_mismatch",
    };
  }

  const stored = readListingCreateIdempotencyExtras(existing.extras);
  if (stored) {
    if (stored.scope !== expected.scope) {
      return {
        ok: false,
        error: "Idempotency key already used for another listing type",
        code: "idempotency_scope_mismatch",
      };
    }
    if (stored.fingerprint !== expected.payloadFingerprint) {
      return {
        ok: false,
        error:
          "This submission key was already used with different listing details. Start a new submission.",
        code: "idempotency_payload_mismatch",
      };
    }
    return { ok: true };
  }

  const derived = fingerprintListingCreatePayload(
    expected.scope,
    existing as Record<string, unknown>,
  );
  if (derived !== expected.payloadFingerprint) {
    return {
      ok: false,
      error:
        "This submission key was already used with different listing details. Start a new submission.",
      code: "idempotency_payload_mismatch",
    };
  }

  return { ok: true };
}

/**
 * Insert with a reserved primary key. Safe under concurrent duplicate requests.
 * Replays require matching agent, asset type, scope, and payload fingerprint.
 */
export async function insertPropertyRowWithReservedId(
  client: PropertiesInsertClient,
  reservedId: string,
  row: Record<string, unknown>,
  expected: {
    agentId: string;
    assetType: string;
    scope: ListingCreateScope;
    payloadFingerprint: string;
    idempotencyKey: string;
  },
): Promise<IdempotentInsertResult> {
  const existing = await client
    .from("properties")
    .select(IDEMPOTENCY_ROW_FINGERPRINT_SELECT)
    .eq("id", reservedId)
    .maybeSingle();

  if (existing.data) {
    const replay = canReplayExistingRow(existing.data, expected);
    if (!replay.ok) {
      return {
        ok: false,
        error: replay.error,
        status: 409,
        code: replay.code,
      };
    }
    return { ok: true, listing: existing.data, created: false };
  }

  const insertRow = { ...row, id: reservedId };
  const inserted = await client
    .from("properties")
    .insert(insertRow)
    .select(IDEMPOTENCY_ROW_FINGERPRINT_SELECT)
    .single();

  if (!inserted.error && inserted.data) {
    return { ok: true, listing: inserted.data, created: true };
  }

  if (inserted.error?.code === "23505") {
    const raced = await client
      .from("properties")
      .select(IDEMPOTENCY_ROW_FINGERPRINT_SELECT)
      .eq("id", reservedId)
      .single();
    if (raced.data) {
      const replay = canReplayExistingRow(raced.data, expected);
      if (!replay.ok) {
        return {
          ok: false,
          error: replay.error,
          status: 409,
          code: replay.code,
        };
      }
      return { ok: true, listing: raced.data, created: false };
    }
  }

  return {
    ok: false,
    error: inserted.error?.message ?? "Could not create listing",
    status: 400,
    code: "insert_failed",
  };
}
