import test from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultLatestOnYikeConfig,
  validateLatestOnYikeConfigPatch,
} from "@/lib/home/latest-on-yike-config";
import { buildLatestOnYikeFeed } from "@/lib/home/latest-on-yike-feed";
import type { Property } from "@/types/database";

function row(
  id: string,
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  createdAt: string,
): Property {
  return {
    id,
    asset_type: asset,
    status: "approved",
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    availability_status: "available",
    created_at: createdAt,
    title: id,
    price: 1,
    state: "Lagos",
    city: "Lagos",
    agent_id: "a",
    media_urls: [],
  } as unknown as Property;
}

test("automatic mode mixes enabled categories by recency", () => {
  const config = getDefaultLatestOnYikeConfig();
  config.totalLimit = 6;
  const result = buildLatestOnYikeFeed({
    config,
    livePools: {
      property: [row("p1", "PROPERTY", "2026-01-03T00:00:00Z")],
      vehicle: [row("v1", "VEHICLE", "2026-01-05T00:00:00Z")],
      electronics: [row("e1", "ELECTRONICS", "2026-01-04T00:00:00Z")],
    },
    manualResolved: [],
    gates: { vehicles: true, electronics: true },
  });
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0]?.id, "v1");
  assert.equal(result.items[1]?.id, "e1");
  assert.equal(result.items[2]?.id, "p1");
});

test("category inclusion excludes disabled verticals", () => {
  const config = getDefaultLatestOnYikeConfig();
  config.enabledCategories.electronics = false;
  config.enabledCategories.vehicle = false;
  const result = buildLatestOnYikeFeed({
    config,
    livePools: {
      property: [row("p1", "PROPERTY", "2026-01-01T00:00:00Z")],
      vehicle: [row("v1", "VEHICLE", "2026-01-09T00:00:00Z")],
      electronics: [row("e1", "ELECTRONICS", "2026-01-08T00:00:00Z")],
    },
    manualResolved: [],
    gates: { vehicles: true, electronics: true },
  });
  assert.ok(result.items.every((i) => i.id === "p1"));
});

test("manual mode preserves order and skips unavailable listings", () => {
  const config = getDefaultLatestOnYikeConfig();
  config.mode = "manual";
  config.manualListingIds = ["v1", "missing", "e1"];
  const expired = row("v1", "VEHICLE", "2026-01-01T00:00:00Z");
  expired.expires_at = new Date(Date.now() - 1000).toISOString();
  const result = buildLatestOnYikeFeed({
    config,
    livePools: { property: [], vehicle: [], electronics: [] },
    manualResolved: [
      expired,
      row("e1", "ELECTRONICS", "2026-01-02T00:00:00Z"),
    ],
    gates: { vehicles: true, electronics: true },
  });
  assert.deepEqual(result.items.map((i) => i.id), ["e1"]);
  assert.equal(result.unavailableManualCount, 2);
});

test("fetch failure never returns demo inventory", () => {
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  const result = buildLatestOnYikeFeed({
    config: getDefaultLatestOnYikeConfig(),
    livePools: { property: [], vehicle: [], electronics: [] },
    manualResolved: [],
    gates: { vehicles: true, electronics: true },
    sampleFixtureMode: true,
    fetchFailed: true,
  });
  assert.equal(result.items.length, 0);
  assert.equal(result.error, true);
  assert.equal(result.usedSampleFixture, false);
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
});

test("fixture force mode uses sample catalog over live pools", () => {
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE_FORCE = "1";
  const result = buildLatestOnYikeFeed({
    config: getDefaultLatestOnYikeConfig(),
    livePools: {
      property: [row("live-p", "PROPERTY", "2026-12-01T00:00:00Z")],
      vehicle: [],
      electronics: [],
    },
    manualResolved: [],
    gates: { vehicles: true, electronics: true },
    sampleFixtureMode: true,
    sampleFixtureForce: true,
  });
  assert.ok(result.usedSampleFixture);
  assert.ok(result.items.length > 0);
  assert.ok(result.items.every((i) => i.id.startsWith("s3000001-")));
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE_FORCE;
});

test("validateLatestOnYikeConfigPatch rejects empty categories", () => {
  const base = getDefaultLatestOnYikeConfig();
  base.enabledCategories = {
    property: false,
    vehicle: false,
    electronics: false,
  };
  const result = validateLatestOnYikeConfigPatch(base);
  assert.equal(result.ok, false);
});
