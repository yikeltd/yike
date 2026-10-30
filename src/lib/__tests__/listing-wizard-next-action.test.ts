import assert from "node:assert/strict";
import test from "node:test";
import { MetadataResolver, getListingCatalogsFromYip } from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import {
  listListingWizardBlockers,
  resolveListingWizardNextAction,
} from "@/lib/listing-engine/wizard-next-action";
import { NAMED_VISIBILITY_RULES } from "@/lib/listing-engine/rules/registry";

const CATALOGS = getListingCatalogsFromYip();

function resolveElectronics(values: Record<string, unknown>, photoCount: number) {
  const resolved = MetadataResolver.compute(
    ELECTRONICS_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount },
  );
  const next = resolveListingWizardNextAction({
    manifest: ELECTRONICS_CATEGORY_MANIFEST,
    values,
    stepFields: resolved.stepFields,
    photoStatus: resolved.photoStatus,
  });
  const blockers = listListingWizardBlockers({
    manifest: ELECTRONICS_CATEGORY_MANIFEST,
    values,
    stepFields: resolved.stepFields,
    photoStatus: resolved.photoStatus,
  });
  return { next, blockers, resolved };
}

test("electronics phone missing brand targets brand field", () => {
  const { next } = resolveElectronics(
    {
      auto_category: "phones_tablets",
      model: "A54",
      condition: "brand_new",
    },
    3,
  );
  assert.equal(next.fieldId, "brand");
  assert.match(next.message, /brand/i);
  assert.equal(next.sectionIndex, 0);
});

test("electronics phone with brand but missing price", () => {
  const { next } = resolveElectronics(
    {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      state: "Lagos",
      city: "Ikeja",
      title: "Samsung A54",
    },
    3,
  );
  assert.equal(next.fieldId, "price");
  assert.match(next.message, /price/i);
});

test("three photos but location incomplete suggests city or state", () => {
  const { next } = resolveElectronics(
    {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      title: "Samsung A54",
      price: 250_000,
    },
    3,
  );
  assert.ok(next.fieldId === "state" || next.fieldId === "city");
  assert.match(next.message, /state|city|buyers/i);
});

test("valid electronics phone ready for review", () => {
  const { next, blockers } = resolveElectronics(
    {
      auto_category: "phones_tablets",
      brand: "Samsung",
      model: "A54",
      condition: "brand_new",
      state: "Lagos",
      city: "Ikeja",
      title: "Samsung A54",
      price: 250_000,
    },
    3,
  );
  assert.equal(next.kind, "ready");
  assert.match(next.message, /ready for review/i);
  assert.equal(blockers.length, 0);
});

test("vehicle guidance prefers make when empty", () => {
  const values = { auto_category: "car", model: "Camry", year: 2020 };
  const resolved = MetadataResolver.compute(
    VEHICLE_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  const next = resolveListingWizardNextAction({
    manifest: VEHICLE_CATEGORY_MANIFEST,
    values,
    stepFields: resolved.stepFields,
    photoStatus: resolved.photoStatus,
  });
  assert.ok(
    next.fieldId === "make" ||
      next.fieldId === "vehicle_condition" ||
      next.stageId === "photos_price",
  );
});

test("property guidance is category-specific not electronics copy", () => {
  const values = { listing_type: "rent" };
  const resolved = MetadataResolver.compute(
    PROPERTY_CATEGORY_MANIFEST,
    values,
    CATALOGS,
    { visibilityEvaluators: NAMED_VISIBILITY_RULES, photoCount: 0 },
  );
  const next = resolveListingWizardNextAction({
    manifest: PROPERTY_CATEGORY_MANIFEST,
    values,
    stepFields: resolved.stepFields,
    photoStatus: resolved.photoStatus,
  });
  assert.match(next.message, /property|listing|Choose|Add|photo/i);
  assert.doesNotMatch(next.message, /phone's brand/i);
});
