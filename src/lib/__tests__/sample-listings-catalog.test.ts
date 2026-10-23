import test from "node:test";
import assert from "node:assert/strict";
import {
  SAMPLE_ELECTRONICS,
  SAMPLE_PROPERTIES,
  SAMPLE_VEHICLES,
  sampleListingCounts,
} from "@/lib/sample-listings/catalog";
import { buildAllSampleDbRows } from "@/lib/sample-listings/build-rows";

test("sample catalog has exactly 10 per vertical", () => {
  const c = sampleListingCounts();
  assert.equal(c.properties, 10);
  assert.equal(c.vehicles, 10);
  assert.equal(c.electronics, 10);
  assert.equal(c.total, 30);
});

test("sample slugs are unique and non-empty", () => {
  const slugs = [
    ...SAMPLE_PROPERTIES.map((p) => p.slug),
    ...SAMPLE_VEHICLES.map((v) => v.slug),
    ...SAMPLE_ELECTRONICS.map((e) => e.slug),
  ];
  assert.equal(slugs.length, 30);
  assert.equal(new Set(slugs).size, 30);
  assert.ok(slugs.every((s) => s.startsWith("sample-")));
});

test("db rows use correct asset types", () => {
  const rows = buildAllSampleDbRows();
  assert.equal(rows.length, 30);
  const types = rows.map((r) => r.asset_type);
  assert.equal(types.filter((t) => t === "PROPERTY").length, 10);
  assert.equal(types.filter((t) => t === "VEHICLE").length, 10);
  assert.equal(types.filter((t) => t === "ELECTRONICS").length, 10);
});
