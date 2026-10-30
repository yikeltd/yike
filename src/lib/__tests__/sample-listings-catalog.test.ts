import test from "node:test";
import assert from "node:assert/strict";
import {
  SAMPLE_ELECTRONICS,
  SAMPLE_PROPERTIES,
  SAMPLE_VEHICLES,
  sampleListingCounts,
} from "@/lib/sample-listings/catalog";
import { buildAllSampleDbRows } from "@/lib/sample-listings/build-rows";

test("sample catalog has exactly 30 per vertical (90 total)", () => {
  const c = sampleListingCounts();
  assert.equal(c.properties, 30);
  assert.equal(c.vehicles, 30);
  assert.equal(c.electronics, 30);
  assert.equal(c.total, 90);
});

test("sample slugs are unique and non-empty", () => {
  const slugs = [
    ...SAMPLE_PROPERTIES.map((p) => p.slug),
    ...SAMPLE_VEHICLES.map((v) => v.slug),
    ...SAMPLE_ELECTRONICS.map((e) => e.slug),
  ];
  assert.equal(slugs.length, 90);
  assert.equal(new Set(slugs).size, 90);
  assert.ok(slugs.every((s) => s.startsWith("sample-")));
});

test("db rows use correct asset types", () => {
  const rows = buildAllSampleDbRows();
  assert.equal(rows.length, 90);
  const types = rows.map((r) => r.asset_type);
  assert.equal(types.filter((t) => t === "PROPERTY").length, 30);
  assert.equal(types.filter((t) => t === "VEHICLE").length, 30);
  assert.equal(types.filter((t) => t === "ELECTRONICS").length, 30);
});

test("listing ids are sequential sample prefix 1–90", () => {
  const ids = buildAllSampleDbRows().map((r) => r.id);
  assert.ok(ids.every((id) => id.startsWith("s3000001-")));
  assert.equal(new Set(ids).size, 90);
});
