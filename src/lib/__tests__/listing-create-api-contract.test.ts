import assert from "node:assert/strict";
import test from "node:test";
import {
  deterministicListingCreateId,
  insertPropertyRowWithReservedId,
} from "@/lib/listing-create/idempotency";
import {
  fingerprintListingCreatePayload,
  withListingCreateIdempotencyExtras,
} from "@/lib/listing-create/payload-fingerprint";
import { parseVehicleBody } from "@/lib/listing-create/vehicle-body";
import { parseElectronicsBody } from "@/lib/listing-create/electronics-body";
import {
  buildPropertyCreateApiBody,
  normalizePropertyCreateRequest,
} from "@/lib/listing-create/property-api-body";
import { createMockPropertiesInsertClient } from "@/lib/__tests__/listing-create-idempotency-mock";

const HTTPS_MEDIA = [
  "https://abc.supabase.co/storage/v1/object/public/property-media/a.jpg",
  "https://abc.supabase.co/storage/v1/object/public/property-media/b.jpg",
];

const VEHICLE_BASE = {
  auto_category: "car",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  vehicle_condition: "used",
  state: "Lagos",
  city: "Ikeja",
  title: "Camry",
  price: 8_000_000,
  media_urls: HTTPS_MEDIA,
};

function vehicleInsertExpected(agentId: string, payload: Record<string, unknown>) {
  const fingerprint = fingerprintListingCreatePayload("vehicle", payload);
  return {
    agentId,
    assetType: "VEHICLE",
    scope: "vehicle" as const,
    payloadFingerprint: fingerprint,
    idempotencyKey: "vehicle-key-1",
  };
}

test("vehicle create contract rejects missing idempotency fields at parse layer", () => {
  assert.equal(parseVehicleBody({ ...VEHICLE_BASE, media_urls: [HTTPS_MEDIA[0]!] }), null);
  assert.ok(parseVehicleBody(VEHICLE_BASE));
});

test("electronics create contract rejects under-minimum photos", () => {
  assert.equal(
    parseElectronicsBody({
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      title: "Phone",
      price: 100_000,
      state: "Lagos",
      city: "Lagos",
      media_urls: [HTTPS_MEDIA[0]!],
    }),
    null,
  );
});

test("property envelope normalizes to stable create payload for fingerprinting", () => {
  const body = buildPropertyCreateApiBody(
    {
      title: "Flat",
      listing_type: "rent",
      property_type: "flat",
      state: "Enugu",
      city: "Enugu",
      price: 1_000_000,
    },
    { listingId: "11111111-1111-4111-8111-111111111111", mediaUrls: HTTPS_MEDIA, idempotencyKey: "p-key" },
  );
  const normalized = normalizePropertyCreateRequest(body);
  assert.ok(normalized.payload.title);
  const fp1 = fingerprintListingCreatePayload("property", normalized.payload as Record<string, unknown>);
  const fp2 = fingerprintListingCreatePayload("property", normalized.payload as Record<string, unknown>);
  assert.equal(fp1, fp2);
});

test("idempotent insert rejects replay when agent_id differs", async () => {
  const { client, rows } = createMockPropertiesInsertClient();
  const id = deterministicListingCreateId("vehicle", "owner-a", "shared-key");
  const payload = {
    ...VEHICLE_BASE,
    agent_id: "owner-a",
    asset_type: "VEHICLE",
  };
  const expected = vehicleInsertExpected("owner-a", payload);
  const row = withListingCreateIdempotencyExtras(payload, {
    scope: "vehicle",
    fingerprint: expected.payloadFingerprint,
    idempotency_key: expected.idempotencyKey,
  });

  const first = await insertPropertyRowWithReservedId(client, id, row, expected);
  assert.equal(first.ok, true);

  const attacker = await insertPropertyRowWithReservedId(
    client,
    id,
    { ...row, agent_id: "owner-b" },
    { ...expected, agentId: "owner-b" },
  );
  assert.equal(attacker.ok, false);
  if (!attacker.ok) {
    assert.equal(attacker.status, 409);
    assert.equal(attacker.code, "id_conflict");
  }
  assert.equal(rows.size, 1);
});

test("idempotent insert rejects same key with different payload fingerprint", async () => {
  const { client } = createMockPropertiesInsertClient();
  const id = deterministicListingCreateId("vehicle", "agent-1", "dup-key");
  const payloadA = {
    agent_id: "agent-1",
    asset_type: "VEHICLE",
    ...VEHICLE_BASE,
    title: "First title",
  };
  const fpA = fingerprintListingCreatePayload("vehicle", payloadA);
  const rowA = withListingCreateIdempotencyExtras(payloadA, {
    scope: "vehicle",
    fingerprint: fpA,
    idempotency_key: "dup-key",
  });
  const expectedA = {
    agentId: "agent-1",
    assetType: "VEHICLE",
    scope: "vehicle" as const,
    payloadFingerprint: fpA,
    idempotencyKey: "dup-key",
  };

  const first = await insertPropertyRowWithReservedId(client, id, rowA, expectedA);
  assert.equal(first.ok, true);

  const payloadB = { ...payloadA, title: "Different title" };
  const fpB = fingerprintListingCreatePayload("vehicle", payloadB);
  assert.notEqual(fpA, fpB);

  const second = await insertPropertyRowWithReservedId(
    client,
    id,
    withListingCreateIdempotencyExtras(payloadB, {
      scope: "vehicle",
      fingerprint: fpB,
      idempotency_key: "dup-key",
    }),
    { ...expectedA, payloadFingerprint: fpB },
  );
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.status, 409);
    assert.equal(second.code, "idempotency_payload_mismatch");
  }
});

test("concurrent duplicate insert replays safely with matching fingerprint", async () => {
  const { client, rows } = createMockPropertiesInsertClient();
  const id = deterministicListingCreateId("electronics", "agent-e", "race-key");
  const payload = {
    agent_id: "agent-e",
    asset_type: "ELECTRONICS",
    title: "Phone",
    price: 50_000,
    state: "Lagos",
    city: "Lagos",
    brand: "Apple",
    model: "iPhone",
    auto_category: "phones_tablets",
    condition: "brand_new",
    media_urls: HTTPS_MEDIA,
  };
  const fingerprint = fingerprintListingCreatePayload("electronics", payload);
  const expected = {
    agentId: "agent-e",
    assetType: "ELECTRONICS",
    scope: "electronics" as const,
    payloadFingerprint: fingerprint,
    idempotencyKey: "race-key",
  };
  const row = withListingCreateIdempotencyExtras(payload, {
    scope: "electronics",
    fingerprint,
    idempotency_key: "race-key",
  });

  const [a, b] = await Promise.all([
    insertPropertyRowWithReservedId(client, id, row, expected),
    insertPropertyRowWithReservedId(client, id, row, expected),
  ]);
  assert.equal(a.ok && b.ok, true);
  if (a.ok) assert.equal(a.created, true);
  if (b.ok) assert.equal(b.created, false);
  assert.equal(rows.size, 1);
});

test("legacy row without extras still rejects mismatched payload replay", async () => {
  const id = deterministicListingCreateId("vehicle", "agent-legacy", "legacy-key");
  const payloadA = {
    ...VEHICLE_BASE,
    agent_id: "agent-legacy",
    asset_type: "VEHICLE",
    title: "Original title",
  };
  const fpA = fingerprintListingCreatePayload("vehicle", payloadA);
  const rowLegacy = { ...payloadA, id, extras: undefined };

  const { client: innerClient, rows } = createMockPropertiesInsertClient();
  rows.set(id, rowLegacy);

  const payloadB = { ...payloadA, title: "Changed title" };
  const fpB = fingerprintListingCreatePayload("vehicle", payloadB);
  const expectedB = {
    agentId: "agent-legacy",
    assetType: "VEHICLE",
    scope: "vehicle" as const,
    payloadFingerprint: fpB,
    idempotencyKey: "legacy-key",
  };

  const replay = await insertPropertyRowWithReservedId(
    innerClient,
    id,
    withListingCreateIdempotencyExtras(payloadB, {
      scope: "vehicle",
      fingerprint: fpB,
      idempotency_key: "legacy-key",
    }),
    expectedB,
  );
  assert.equal(replay.ok, false);
  if (!replay.ok) {
    assert.equal(replay.code, "idempotency_payload_mismatch");
  }
  assert.notEqual(fpA, fpB);
});

test("property id scope differs from vehicle for same idempotency key string", () => {
  const key = "user-submit-key";
  const propertyId = deterministicListingCreateId("property", "agent-1", key);
  const vehicleId = deterministicListingCreateId("vehicle", "agent-1", key);
  assert.notEqual(propertyId, vehicleId);
});
