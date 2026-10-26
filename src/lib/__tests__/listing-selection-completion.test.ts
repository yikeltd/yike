import assert from "node:assert/strict";
import test from "node:test";
import {
  computeSelectionCompletion,
  getListingCatalogsFromYip,
  LISTING_SCENARIOS,
  representativeListingValues,
} from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import { validateCategoryManifest } from "@/lib/listing-engine/validate-config";
import { catalogueCoverageReports } from "@/lib/listing-engine/catalogues/coverage";

const CATALOGS = getListingCatalogsFromYip();

const MANIFEST_BY_VERTICAL = {
  property: PROPERTY_CATEGORY_MANIFEST,
  vehicle: VEHICLE_CATEGORY_MANIFEST,
  electronics: ELECTRONICS_CATEGORY_MANIFEST,
} as const;

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

test("electronics brand and model use searchable catalogue providers", () => {
  const values = { auto_category: "phones_tablets", brand: "Samsung" };
  const brands = CATALOGS["electronics.brands_for_category"]!(values);
  assert.ok(brands.some((b) => b.value === "Samsung"));
  const models = CATALOGS["electronics.models_for_brand"]!(values);
  assert.ok(models.some((m) => m.value.includes("Galaxy")));
});

test("catalogue availability is connected for all verticals (representative)", () => {
  for (const vertical of ["property", "vehicle", "electronics"] as const) {
    const values = representativeListingValues(vertical);
    const report = computeSelectionCompletion(
      MANIFEST_BY_VERTICAL[vertical],
      values,
      CATALOGS,
    );
    assert.ok(
      report.catalogAvailabilityRatio >= 0.95,
      `${vertical} availability ${report.catalogAvailabilityRatio}`,
    );
  }
});

test("diverse scenarios meet 80% selection completion without manual catalogue typing", () => {
  const failures: string[] = [];
  for (const scenario of LISTING_SCENARIOS) {
    const manifest = MANIFEST_BY_VERTICAL[scenario.vertical];
    const report = computeSelectionCompletion(manifest, scenario.values, CATALOGS);
    if (report.selectionCompletionRatio < 0.8) {
      failures.push(
        `${scenario.id}: ${(report.selectionCompletionRatio * 100).toFixed(0)}% manual=${report.manualEntryFieldIds.join(",")}`,
      );
    }
  }
  assert.equal(
    failures.length,
    0,
    `Scenarios below 80% selection completion:\n${failures.join("\n")}`,
  );
});

test("required catalogue fields selection completion by vertical", () => {
  for (const vertical of ["property", "vehicle", "electronics"] as const) {
    const scenario = LISTING_SCENARIOS.find((s) => s.vertical === vertical)!;
    const report = computeSelectionCompletion(
      MANIFEST_BY_VERTICAL[vertical],
      scenario.values,
      CATALOGS,
    );
    assert.ok(
      report.requiredSelectionCompletionRatio >= 0.85,
      `${vertical} required selection ${report.requiredSelectionCompletionRatio}`,
    );
  }
});
