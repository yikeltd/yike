import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFieldInventory,
  getListingCatalogsFromYip,
  inventoryConnectivityGaps,
  LISTING_SCENARIOS,
} from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";

const CATALOGS = getListingCatalogsFromYip();

const MANIFESTS = [
  PROPERTY_CATEGORY_MANIFEST,
  VEHICLE_CATEGORY_MANIFEST,
  ELECTRONICS_CATEGORY_MANIFEST,
] as const;

test("field inventory has no disconnected catalogue providers", () => {
  for (const manifest of MANIFESTS) {
    const scenario = LISTING_SCENARIOS.find((s) => s.vertical === manifest.id);
    assert.ok(scenario, `missing scenario for ${manifest.id}`);
    const entries = buildFieldInventory(manifest, scenario.values, CATALOGS);
    const gaps = inventoryConnectivityGaps(entries);
    assert.deepEqual(
      gaps.map((g) => g.fieldId),
      [],
      `${manifest.id} disconnected: ${gaps.map((g) => g.fieldId).join(", ")}`,
    );
  }
});

test("electronics generator scenario resolves brand and model catalogues", () => {
  const scenario = LISTING_SCENARIOS.find((s) => s.id === "electronics-generator")!;
  const entries = buildFieldInventory(
    ELECTRONICS_CATEGORY_MANIFEST,
    scenario.values,
    CATALOGS,
  );
  const brand = entries.find((e) => e.fieldId === "brand");
  const model = entries.find((e) => e.fieldId === "model");
  assert.ok(brand?.usableOptionsAtSample);
  assert.ok(model?.usableOptionsAtSample);
  assert.ok(model!.optionCountAtSample > 0);
});
