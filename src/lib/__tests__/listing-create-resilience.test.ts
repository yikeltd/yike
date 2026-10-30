import assert from "node:assert/strict";
import test from "node:test";
import { MetadataResolver, getListingCatalogsFromYip } from "@/lib/listing-engine";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import { VEHICLE_PHOTO_RULES } from "@/lib/listing-engine/photo-schema/rules";
import { computeListingWizardProgress } from "@/lib/listing-engine/wizard-progress";
import { NAMED_VISIBILITY_RULES } from "@/lib/listing-engine/rules/registry";
import { valuesToVehiclePayload } from "@/lib/listing-engine/adapters/vehicle";
import { valuesToElectronicsPayload } from "@/lib/listing-engine/adapters/electronics";
import {
  buildPropertyCreateApiBody,
  normalizePropertyCreateRequest,
} from "@/lib/listing-create/property-api-body";
import {
  deterministicListingCreateId,
  insertPropertyRowWithReservedId,
} from "@/lib/listing-create/idempotency";
import {
  fingerprintListingCreatePayload,
  withListingCreateIdempotencyExtras,
} from "@/lib/listing-create/payload-fingerprint";
import { createMockPropertiesInsertClient } from "@/lib/__tests__/listing-create-idempotency-mock";
import {
  parseVehicleBody,
  VEHICLE_CREATE_MIN_PHOTOS,
} from "@/lib/listing-create/vehicle-body";
import { parseElectronicsBody } from "@/lib/listing-create/electronics-body";
import { allVerticalPhotoRulesAlignWithServer } from "@/lib/listing-create/validation-contract";
import { readyListingPhotoUrls } from "@/lib/listing-create/photo-readiness";
import { buildPropertyCreateApiBody as fromEngine } from "@/lib/listing-engine";
import { LISTING_CREATE_MIN_PHOTOS } from "@/lib/listing-create/constants";

const CATALOGS = getListingCatalogsFromYip();
const HTTPS_MEDIA = [
  "https://abc.supabase.co/storage/v1/object/public/property-media/a.jpg",
  "https://abc.supabase.co/storage/v1/object/public/property-media/b.jpg",
];

test("buildPropertyCreateApiBody matches listings/create envelope", () => {
  const body = buildPropertyCreateApiBody(
    {
      title: "Flat in Enugu",
      listing_type: "rent",
      property_type: "flat",
      state: "Enugu",
      city: "Enugu",
      price: 1_200_000,
    },
    {
      listingId: "11111111-1111-4111-8111-111111111111",
      mediaUrls: HTTPS_MEDIA,
      idempotencyKey: "test-key-1",
    },
  );
  assert.ok(body.payload);
  assert.equal(body.payload.title, "Flat in Enugu");
  assert.equal(body.listingId, "11111111-1111-4111-8111-111111111111");
  assert.equal(body.idempotencyKey, "test-key-1");
  assert.deepEqual(body.pricingFields, {});
  assert.equal("listing_type" in body.payload, true);
  assert.equal(body.payload.listingId, undefined);
});

test("normalizePropertyCreateRequest accepts envelope and legacy flat bodies", () => {
  const envelope = normalizePropertyCreateRequest({
    listingId: "abc",
    idempotencyKey: "k1",
    payload: { title: "T", city: "Lagos", price: 1 },
    pricingFields: { price_review_status: "confirmed_by_agent" },
  });
  assert.equal(envelope.payload.title, "T");
  assert.equal(envelope.pricingFields?.price_review_status, "confirmed_by_agent");

  const flat = normalizePropertyCreateRequest({
    listingId: "abc",
    title: "Flat",
    city: "Abuja",
    price: 500_000,
    listing_type: "sale",
  });
  assert.equal(flat.payload.title, "Flat");
  assert.equal(flat.payload.city, "Abuja");
});

test("property create export re-exports buildPropertyCreateApiBody from listing-engine", () => {
  assert.equal(typeof fromEngine, "function");
});

test("vehicle photo rules min matches API minimum", () => {
  assert.equal(VEHICLE_PHOTO_RULES.min, VEHICLE_CREATE_MIN_PHOTOS);
  assert.equal(VEHICLE_CREATE_MIN_PHOTOS, 2);
});

test("vehicle wizard cannot publish with one ready photo", () => {
  const values = {
    auto_category: "car",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    vehicle_condition: "used",
    state: "Lagos",
    city: "Ikeja",
    title: "Camry",
    price: 8_000_000,
  };
  const resolved = MetadataResolver.compute(
    VEHICLE_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 1 },
  );
  const progress = computeListingWizardProgress(
    VEHICLE_CATEGORY_MANIFEST,
    values,
    resolved.stepFields,
    resolved.photoStatus,
  );
  assert.equal(progress.canPublish, false);
  assert.equal(parseVehicleBody({ ...values, media_urls: [HTTPS_MEDIA[0]!] }), null);
});

test("vehicle parse accepts two ready photos", () => {
  const parsed = parseVehicleBody({
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
  });
  assert.ok(parsed);
  assert.equal(parsed!.media_urls?.length, 2);
});

test("adapters include idempotencyKey for vehicle and electronics", () => {
  const v = valuesToVehiclePayload(
    { auto_category: "car", make: "A", model: "B", title: "T", price: 1, state: "Lagos", city: "Lagos", vehicle_condition: "used" },
    { idempotencyKey: "idem-1", mediaUrls: HTTPS_MEDIA },
  );
  assert.equal(v.idempotencyKey, "idem-1");

  const e = valuesToElectronicsPayload(
    {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      title: "Phone",
      price: 100_000,
      state: "Lagos",
      city: "Lagos",
    },
    { idempotencyKey: "idem-2", mediaUrls: HTTPS_MEDIA },
  );
  assert.equal(e.idempotencyKey, "idem-2");
});

test("deterministic listing ids are stable per agent scope and key", () => {
  const a = deterministicListingCreateId("vehicle", "agent-1", "key-a");
  const b = deterministicListingCreateId("vehicle", "agent-1", "key-a");
  const c = deterministicListingCreateId("electronics", "agent-1", "key-a");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("insertPropertyRowWithReservedId replays on existing row", async () => {
  const { client, rows } = createMockPropertiesInsertClient();
  const id = deterministicListingCreateId("vehicle", "agent-1", "dup-key");
  const base = {
    agent_id: "agent-1",
    asset_type: "VEHICLE",
    title: "Car",
    media_urls: HTTPS_MEDIA,
  };
  const fingerprint = fingerprintListingCreatePayload("vehicle", base);
  const row = withListingCreateIdempotencyExtras(base, {
    scope: "vehicle",
    fingerprint,
    idempotency_key: "dup-key",
  });
  const expected = {
    agentId: "agent-1",
    assetType: "VEHICLE",
    scope: "vehicle" as const,
    payloadFingerprint: fingerprint,
    idempotencyKey: "dup-key",
  };

  const first = await insertPropertyRowWithReservedId(client, id, row, expected);
  assert.equal(first.ok, true);
  if (first.ok) assert.equal(first.created, true);

  const second = await insertPropertyRowWithReservedId(client, id, row, expected);
  assert.equal(second.ok, true);
  if (second.ok) {
    assert.equal(second.created, false);
    assert.equal(second.listing.id, id);
  }
  assert.equal(rows.size, 1);
});

test("shared validation contract aligns all vertical photo minimums", () => {
  assert.equal(allVerticalPhotoRulesAlignWithServer(), true);
  assert.equal(LISTING_CREATE_MIN_PHOTOS, 2);
});

test("readyListingPhotoUrls excludes in-flight uploads for publish payloads", () => {
  const urls = readyListingPhotoUrls([
    { upload_status: "uploading", image_url: HTTPS_MEDIA[0]! },
    { upload_status: "ready", image_url: HTTPS_MEDIA[1]! },
  ]);
  assert.deepEqual(urls, [HTTPS_MEDIA[1]!]);
});

test("lost response retry replays same reserved property row id", async () => {
  const { client, rows } = createMockPropertiesInsertClient();
  const id = deterministicListingCreateId("property", "agent-retry", "retry-key");
  const payload = {
    agent_id: "agent-retry",
    asset_type: "PROPERTY",
    title: "Flat",
    media_urls: HTTPS_MEDIA,
  };
  const fingerprint = fingerprintListingCreatePayload("property", payload);
  const row = withListingCreateIdempotencyExtras(payload, {
    scope: "property",
    fingerprint,
    idempotency_key: "retry-key",
  });
  const expected = {
    agentId: "agent-retry",
    assetType: "PROPERTY",
    scope: "property" as const,
    payloadFingerprint: fingerprint,
    idempotencyKey: "retry-key",
  };

  const first = await insertPropertyRowWithReservedId(client, id, row, expected);
  const retry = await insertPropertyRowWithReservedId(client, id, row, expected);
  assert.equal(first.ok && retry.ok, true);
  if (first.ok) assert.equal(first.created, true);
  if (retry.ok) assert.equal(retry.created, false);
  assert.equal(rows.size, 1);
});

test("electronics parse rejects one photo", () => {
  assert.equal(
    parseElectronicsBody({
      auto_category: "phones_tablets",
      brand: "Apple",
      model: "iPhone",
      condition: "brand_new",
      title: "Phone",
      price: 500_000,
      state: "Lagos",
      city: "Lagos",
      media_urls: [HTTPS_MEDIA[0]!],
    }),
    null,
  );
});
