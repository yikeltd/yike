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

test("diverse scenarios: filled applicable fields completed via catalogue (no manual picks)", () => {
  const failures: string[] = [];
  for (const scenario of LISTING_SCENARIOS) {
    const manifest = MANIFEST_BY_VERTICAL[scenario.vertical];
    const report = computeSelectionCompletion(manifest, scenario.values, CATALOGS);
    if (report.manualEntryFieldIds.length > 0) {
      failures.push(`${scenario.id}: manual catalogue overrides=${report.manualEntryFieldIds.join(",")}`);
    }
    if (report.noTypingAmongFilledApplicableRatio < 1) {
      failures.push(
        `${scenario.id}: noTypingAmongFilled=${(report.noTypingAmongFilledApplicableRatio * 100).toFixed(0)}%`,
      );
    }
  }
  assert.equal(failures.length, 0, failures.join("\n"));
});

test("diverse scenarios: required applicable fields filled in representative states", () => {
  for (const scenario of LISTING_SCENARIOS) {
    const manifest = MANIFEST_BY_VERTICAL[scenario.vertical];
    const report = computeSelectionCompletion(manifest, scenario.values, CATALOGS);
    assert.equal(
      report.requiredFieldsFilledRatio,
      1,
      `${scenario.id}: missing required (${report.requiredFieldsFilledCount}/${report.requiredApplicableCount})`,
    );
  }
});

test("required catalogue field slots use catalogue options when filled (by vertical)", () => {
  for (const vertical of ["property", "vehicle", "electronics"] as const) {
    const scenario = LISTING_SCENARIOS.find((s) => s.vertical === vertical)!;
    const report = computeSelectionCompletion(
      MANIFEST_BY_VERTICAL[vertical],
      scenario.values,
      CATALOGS,
    );
    assert.ok(
      report.requiredSelectionCompletionRatio >= 0.85,
      `${vertical} required catalogue slots via pick ${report.requiredSelectionCompletionRatio}`,
    );
  }
});
