import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { MetadataResolver, getListingCatalogsFromYip } from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import {
  computeListingWizardProgress,
  getWizardStageConfigs,
} from "@/lib/listing-engine/wizard-progress";
import { NAMED_VISIBILITY_RULES } from "@/lib/listing-engine/rules/registry";

const CATALOGS = getListingCatalogsFromYip();

test("category-specific details titles from manifest", () => {
  const electronics = computeListingWizardProgress(
    ELECTRONICS_CATEGORY_MANIFEST,
    {},
    {},
    { ok: false, count: 0, min: 1, max: 20, remainingToMin: 1, overMax: false, tips: [], warnings: [] },
  );
  assert.match(electronics.detailsTitle, /electronics/i);

  const property = computeListingWizardProgress(
    PROPERTY_CATEGORY_MANIFEST,
    {},
    {},
    { ok: false, count: 0, min: 1, max: 20, remainingToMin: 1, overMax: false, tips: [], warnings: [] },
  );
  assert.match(property.detailsTitle, /property/i);
});

test("wizard stages exist for all registry categories", () => {
  for (const manifest of [
    PROPERTY_CATEGORY_MANIFEST,
    VEHICLE_CATEGORY_MANIFEST,
    ELECTRONICS_CATEGORY_MANIFEST,
  ]) {
    const stages = getWizardStageConfigs(manifest);
    assert.equal(stages.length, 3);
    assert.equal(stages[0]?.id, "details");
    assert.ok(stages[0]!.stepIds.length > 0);
  }
});

test("vehicle details steps are not property listing_type steps", () => {
  const stages = getWizardStageConfigs(VEHICLE_CATEGORY_MANIFEST);
  assert.deepEqual(stages[0]?.stepIds, ["type", "identity", "specs"]);
});

test("publish blocked until required manifest fields and photos satisfied", () => {
  const values = {
    auto_category: "phones_tablets",
    brand: "Samsung",
    model: "A54",
    condition: "brand_new",
    state: "Lagos",
    city: "Ikeja",
    title: "Samsung A54",
    price: 250_000,
  };
  const resolved = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  const withoutPhotos = computeListingWizardProgress(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    resolved.stepFields,
    resolved.photoStatus,
  );
  assert.equal(withoutPhotos.canPublish, false);
  assert.ok(withoutPhotos.publishBlockers.some((m) => /photo/i.test(m)));

  const resolvedWithPhotos = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 3 },
  );
  const ready = computeListingWizardProgress(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    resolvedWithPhotos.stepFields,
    resolvedWithPhotos.photoStatus,
  );
  assert.equal(ready.canPublish, true);
});

test("listing engine UI uses manifest-driven wizard not generic property-only labels", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf-8",
  );
  assert.match(src, /computeListingWizardProgress/);
  assert.match(src, /wizard\.detailsTitle/);
  assert.match(src, /saveEngineListingDraft/);
  assert.doesNotMatch(src, /1\. Property Details/);
  assert.doesNotMatch(src, /60%/);
});

test("property land type hides bedroom requirements from progress blockers when unset", () => {
  const values = {
    listing_type: "sale",
    property_type: "land",
    state: "Lagos",
    city: "Lekki",
    title: "Plot in Lekki",
    price: 50_000_000,
  };
  const resolved = MetadataResolver.compute(
    PROPERTY_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 2 },
  );
  const progress = computeListingWizardProgress(
    PROPERTY_CATEGORY_MANIFEST,
    values,
    resolved.stepFields,
    resolved.photoStatus,
  );
  assert.ok(
    !progress.publishBlockers.some((m) => /bedroom/i.test(m)),
    "land listings should not require bedrooms",
  );
});
