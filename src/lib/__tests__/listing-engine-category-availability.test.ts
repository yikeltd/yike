import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  MANIFEST_CATEGORY_IDS,
  UNSUPPORTED_LISTING_CATEGORY_IDS,
  getManifestDetailsStepIds,
  hasCategoryManifest,
  isListingCategoryCreatable,
} from "@/lib/listing-engine/category-availability";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";

test("manifest registry covers launch listing verticals", () => {
  assert.deepEqual([...MANIFEST_CATEGORY_IDS].sort(), [
    "electronics",
    "property",
    "vehicle",
  ]);
});

test("unsupported type ids have no manifest", () => {
  for (const id of UNSUPPORTED_LISTING_CATEGORY_IDS) {
    assert.equal(hasCategoryManifest(id), false);
    assert.equal(isListingCategoryCreatable(id), false);
  }
});

test("details step ids are derived per manifest", () => {
  assert.deepEqual(getManifestDetailsStepIds(PROPERTY_CATEGORY_MANIFEST), [
    "listing_type",
    "property_type",
    "details",
  ]);
  assert.deepEqual(getManifestDetailsStepIds(VEHICLE_CATEGORY_MANIFEST), [
    "type",
    "identity",
    "specs",
  ]);
  assert.deepEqual(getManifestDetailsStepIds(ELECTRONICS_CATEGORY_MANIFEST), [
    "type",
    "identity",
    "specs",
  ]);
});

test("legacy config loader does not fallback to vehicles", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/listing-engine/configs/index.ts"),
    "utf-8",
  );
  assert.doesNotMatch(src, /Fallback to vehicles/);
  assert.match(src, /unknown category/);
});

test("listing engine blocks unknown categories instead of property defaults", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf-8",
  );
  assert.match(src, /isListingCategoryCreatable/);
  assert.match(src, /not available yet/i);
});
