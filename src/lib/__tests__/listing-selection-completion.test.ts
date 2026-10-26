import assert from "node:assert/strict";
import test from "node:test";
import {
  computeSelectionCompletion,
  getListingCatalogsFromYip,
  representativeListingValues,
} from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import { catalogueCoverageReports } from "@/lib/listing-engine/catalogues/coverage";
import { validateCategoryManifest } from "@/lib/listing-engine/validate-config";

const CATALOGS = getListingCatalogsFromYip();

test("manifests validate after catalogue-first input types", () => {
  for (const m of [
    PROPERTY_CATEGORY_MANIFEST,
    VEHICLE_CATEGORY_MANIFEST,
    ELECTRONICS_CATEGORY_MANIFEST,
  ]) {
    assert.deepEqual(validateCategoryManifest(m, { throwOnError: false }), []);
  }
});

test("catalogue coverage reports include all three verticals", () => {
  const reports = catalogueCoverageReports();
  assert.equal(reports.length, 3);
  assert.ok(reports.find((r) => r.vertical === "electronics")!.models > 20);
  assert.ok(reports.find((r) => r.vertical === "vehicle")!.brandsOrMakes > 30);
});

test("representative electronics listing meets 80% catalogue-field ratio", () => {
  const values = representativeListingValues("electronics");
  const report = computeSelectionCompletion(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
  );
  assert.ok(
    report.catalogFieldRatio >= 0.8,
    `electronics catalog ratio ${report.catalogFieldRatio} < 0.8; typing fields: ${report.typingFieldIds.join(", ")}`,
  );
});

test("representative property listing meets 80% catalogue-field ratio", () => {
  const values = representativeListingValues("property");
  const report = computeSelectionCompletion(
    PROPERTY_CATEGORY_MANIFEST,
    values,
    CATALOGS,
  );
  assert.ok(
    report.catalogFieldRatio >= 0.8,
    `property catalog ratio ${report.catalogFieldRatio} < 0.8; typing: ${report.typingFieldIds.join(", ")}`,
  );
});

test("representative vehicle listing meets 80% catalogue-field ratio", () => {
  const values = representativeListingValues("vehicle");
  const report = computeSelectionCompletion(
    VEHICLE_CATEGORY_MANIFEST,
    values,
    CATALOGS,
  );
  assert.ok(
    report.catalogFieldRatio >= 0.8,
    `vehicle catalog ratio ${report.catalogFieldRatio} < 0.8; typing: ${report.typingFieldIds.join(", ")}`,
  );
});

test("electronics brand and model use searchable catalogue providers", () => {
  const values = { auto_category: "phones_tablets", brand: "Samsung" };
  const brands = CATALOGS["electronics.brands_for_category"]!(values);
  assert.ok(brands.some((b) => b.value === "Samsung"));
  const models = CATALOGS["electronics.models_for_brand"]!(values);
  assert.ok(models.some((m) => m.value.includes("Galaxy")));
});
