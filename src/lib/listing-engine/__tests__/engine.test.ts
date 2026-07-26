/**
 * Listing engine unit tests — run with:
 *   npx tsx --test src/lib/listing-engine/__tests__/engine.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { evaluateVisibility, filterVisibleFields } from "../visibility";
import { applyDependencyClears, getOptionsForField } from "../dependency";
import { validateValues } from "../validation";
import { buildTitleFromRecipe, applyAutofill } from "../autofill";
import { photoChecklistStatus } from "../photo";
import { validateCategoryManifest } from "../validate-config";
import { MetadataResolver } from "../resolver";
import { CATALOG_REGISTRY } from "../catalogs/registry";
import { NAMED_VALIDATION_RULES, NAMED_VISIBILITY_RULES } from "../rules/registry";
import { VEHICLE_CATEGORY_MANIFEST } from "../categories/vehicle";
import { PROPERTY_CATEGORY_MANIFEST } from "../categories/property";
import { valuesToVehiclePayload } from "../adapters/vehicle";
import { valuesToPropertyPayload } from "../adapters/property";
import type { CategoryManifest, ListingFieldDef } from "../types";

describe("visibility engine", () => {
  it("always is visible by default", () => {
    assert.equal(evaluateVisibility(undefined, {}), true);
    assert.equal(evaluateVisibility({ op: "always" }, {}), true);
  });

  it("equals supports single value and arrays", () => {
    assert.equal(
      evaluateVisibility({ op: "equals", field: "x", value: "a" }, { x: "a" }),
      true
    );
    assert.equal(
      evaluateVisibility({ op: "equals", field: "x", value: ["a", "b"] }, { x: "b" }),
      true
    );
    assert.equal(
      evaluateVisibility({ op: "equals", field: "x", value: ["a", "b"] }, { x: "c" }),
      false
    );
  });

  it("and / or / not compose correctly", () => {
    const rule = {
      op: "and" as const,
      rules: [
        { op: "truthy" as const, field: "a" },
        { op: "or" as const, rules: [{ op: "equals" as const, field: "b", value: 1 }, { op: "falsy" as const, field: "c" }] },
      ],
    };
    assert.equal(evaluateVisibility(rule, { a: true, b: 1, c: 0 }), true);
    assert.equal(evaluateVisibility(rule, { a: false, b: 1, c: 0 }), false);
    assert.equal(evaluateVisibility({ op: "not", rule: { op: "truthy", field: "a" } }, { a: true }), false);
  });

  it("resolves named rule ids and throws on unknown ids", () => {
    assert.equal(
      evaluateVisibility({ op: "rule", id: "always-true" }, {}, { "always-true": () => true }),
      true
    );
    assert.throws(() => evaluateVisibility({ op: "rule", id: "missing" }, {}));
  });

  it("uses the named property.show_room_fields rule to hide land bedrooms", () => {
    const visibleFields = filterVisibleFields(
      PROPERTY_CATEGORY_MANIFEST.fields,
      { property_type: "land", listing_type: "sale" },
      NAMED_VISIBILITY_RULES
    );
    assert.equal(visibleFields.some((f) => f.id === "bedrooms"), false);

    const apartmentFields = filterVisibleFields(
      PROPERTY_CATEGORY_MANIFEST.fields,
      { property_type: "flat", listing_type: "rent" },
      NAMED_VISIBILITY_RULES
    );
    assert.equal(apartmentFields.some((f) => f.id === "bedrooms"), true);
  });

  it("hides VIN outside vehicle categories that carry it", () => {
    const carFields = filterVisibleFields(VEHICLE_CATEGORY_MANIFEST.fields, {
      auto_category: "car",
    });
    assert.equal(carFields.some((f) => f.id === "vin"), true);

    const motorcycleFields = filterVisibleFields(VEHICLE_CATEGORY_MANIFEST.fields, {
      auto_category: "motorcycle",
    });
    assert.equal(motorcycleFields.some((f) => f.id === "vin"), false);
  });
});

describe("dependency engine", () => {
  it("clears model when make changes without catalogs (conservative default)", () => {
    const next = applyDependencyClears(VEHICLE_CATEGORY_MANIFEST, "make", {
      make: "Toyota",
      model: "Camry",
    });
    assert.equal(next.model, undefined);
  });

  it("keeps a still-valid model and clears an invalid one when catalogs are provided", () => {
    const stillValid = applyDependencyClears(
      VEHICLE_CATEGORY_MANIFEST,
      "make",
      { make: "Toyota", model: "Camry" },
      CATALOG_REGISTRY
    );
    assert.equal(stillValid.model, "Camry");

    const invalid = applyDependencyClears(
      VEHICLE_CATEGORY_MANIFEST,
      "make",
      { make: "Honda", model: "Camry" },
      CATALOG_REGISTRY
    );
    assert.equal(invalid.model, undefined);
  });

  it("cascades clears for property state -> city -> area", () => {
    const next = applyDependencyClears(
      PROPERTY_CATEGORY_MANIFEST,
      "state",
      { state: "Lagos", city: "Aba", area: "Aba Town" },
      CATALOG_REGISTRY
    );
    assert.equal(next.city, undefined);
  });

  it("getOptionsForField resolves catalog options for a dependent field", () => {
    const modelField = VEHICLE_CATEGORY_MANIFEST.fields.find((f) => f.id === "model") as ListingFieldDef;
    const options = getOptionsForField(modelField, { make: "Toyota" }, CATALOG_REGISTRY);
    assert.ok(options.some((o) => o.value === "Camry"));
  });
});

describe("validation engine", () => {
  it("only validates visible fields (land hides bedrooms requirement)", () => {
    const result = validateValues(
      PROPERTY_CATEGORY_MANIFEST,
      {
        listing_type: "sale",
        property_type: "land",
        title: "Prime plot in Lekki",
        price: 5000000,
        state: "Lagos",
        city: "Lekki",
      },
      { visibilityEvaluators: NAMED_VISIBILITY_RULES, validationEvaluators: NAMED_VALIDATION_RULES }
    );
    assert.equal(result.ok, true);
    assert.equal(result.errors.bedrooms, undefined);
  });

  it("flags missing required fields for a visible apartment flow", () => {
    const result = validateValues(
      PROPERTY_CATEGORY_MANIFEST,
      { listing_type: "rent", property_type: "flat" },
      { visibilityEvaluators: NAMED_VISIBILITY_RULES }
    );
    assert.equal(result.ok, false);
    assert.ok(result.errors.title);
    assert.ok(result.errors.price);
    assert.ok(result.errors.state);
  });

  it("validates min / integer / pattern rules", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [
        {
          id: "year",
          label: "Year",
          input: "year",
          required: true,
          validation: [{ type: "min", value: 1980 }, { type: "integer" }],
        },
      ],
    };
    const bad = validateValues(manifest, { year: 1900.5 });
    assert.equal(bad.ok, false);
    const good = validateValues(manifest, { year: 2020 });
    assert.equal(good.ok, true);
  });
});

describe("autofill engine", () => {
  it("builds a title from a recipe, skipping empty parts", () => {
    const title = buildTitleFromRecipe(["year", "make", "model", "transmission"], {
      year: 2020,
      make: "Toyota",
      model: "Camry",
    });
    assert.equal(title, "2020 Toyota Camry");
  });

  it("does not overwrite a title the seller has touched", () => {
    const patch = applyAutofill(
      VEHICLE_CATEGORY_MANIFEST,
      { year: 2020, make: "Toyota", model: "Camry", title: "My custom title" },
      { titleTouched: true }
    );
    assert.equal(patch.title, undefined);
  });

  it("suggests a title when untouched", () => {
    const patch = applyAutofill(VEHICLE_CATEGORY_MANIFEST, { year: 2020, make: "Toyota", model: "Camry" }, {});
    assert.equal(patch.title, "2020 Toyota Camry");
  });
});

describe("photo engine", () => {
  it("computes checklist status against min/max", () => {
    const status = photoChecklistStatus(VEHICLE_CATEGORY_MANIFEST.photo, 0);
    assert.equal(status.ok, false);
    assert.equal(status.remainingToMin, 1);

    const ok = photoChecklistStatus(VEHICLE_CATEGORY_MANIFEST.photo, 3);
    assert.equal(ok.ok, true);
    assert.equal(ok.overMax, false);
  });
});

describe("resolver", () => {
  it("computes visible fields, options, and photo status together", () => {
    const state = MetadataResolver.compute(
      VEHICLE_CATEGORY_MANIFEST,
      { auto_category: "car", make: "Toyota" },
      CATALOG_REGISTRY,
      { photoCount: 2 }
    );
    assert.ok(state.visibleFields.some((f) => f.id === "vin"));
    assert.ok(state.optionsByField.model.some((o) => o.value === "Camry"));
    assert.equal(state.photoStatus.ok, true);
    assert.ok(Array.isArray(state.stepFields.identity));
  });
});

describe("config validator", () => {
  it("passes for the shipped vehicle and property manifests", () => {
    assert.doesNotThrow(() => validateCategoryManifest(VEHICLE_CATEGORY_MANIFEST));
    assert.doesNotThrow(() => validateCategoryManifest(PROPERTY_CATEGORY_MANIFEST));
  });

  it("rejects duplicate field ids", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [
        ...VEHICLE_CATEGORY_MANIFEST.fields,
        { id: "make", label: "Make dup", input: "text" },
      ],
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes("Duplicate field id")));
  });

  it("rejects step references to missing field ids", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      steps: [{ id: "ghost", title: "Ghost", fieldIds: ["does_not_exist"] }],
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes('missing field id "does_not_exist"')));
  });

  it("rejects broken dependsOn.watch and optionsFrom references", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [
        { id: "a", label: "A", input: "text" },
        {
          id: "b",
          label: "B",
          input: "select",
          dependsOn: { watch: ["nonexistent"], optionsFrom: "no.such.catalog" },
        },
      ],
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes('missing field id "nonexistent"')));
    assert.ok(errors.some((e) => e.includes('unknown catalog "no.such.catalog"')));
  });

  it("rejects circular dependency graphs", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [
        { id: "a", label: "A", input: "select", dependsOn: { watch: ["b"], optionsFrom: "vehicle.makes" } },
        { id: "b", label: "B", input: "select", dependsOn: { watch: ["a"], optionsFrom: "vehicle.makes" } },
      ],
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes("Circular dependency")));
  });

  it("rejects unknown visibility / validation rule ids", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [
        { id: "a", label: "A", input: "text", visible: { op: "rule", id: "nope.visibility" } },
        {
          id: "b",
          label: "B",
          input: "text",
          validation: [{ type: "rule", id: "nope.validation" }],
        },
      ],
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes('unknown visibility rule id "nope.visibility"')));
    assert.ok(errors.some((e) => e.includes('unknown validation rule id "nope.validation"')));
  });

  it("rejects photo min greater than max", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      photo: { ...VEHICLE_CATEGORY_MANIFEST.photo, min: 10, max: 2 },
    };
    const errors = validateCategoryManifest(manifest, { throwOnError: false });
    assert.ok(errors.some((e) => e.includes("Photo rules invalid")));
  });

  it("throws by default when errors are present", () => {
    const manifest: CategoryManifest = {
      ...VEHICLE_CATEGORY_MANIFEST,
      fields: [...VEHICLE_CATEGORY_MANIFEST.fields, { id: "make", label: "dup", input: "text" }],
    };
    assert.throws(() => validateCategoryManifest(manifest));
  });
});

describe("adapters", () => {
  it("maps engine values to the vehicle create payload shape", () => {
    const payload = valuesToVehiclePayload({
      auto_category: "car",
      make: "Toyota",
      model: "Camry",
      year: 2020,
      vehicle_condition: "foreign_used",
      price: 15000000,
      state: "Lagos",
      city: "Lekki",
      title: "2020 Toyota Camry",
      media_urls: ["https://example.com/a.webp"],
      financing_available: "on",
    });
    assert.equal(payload.make, "Toyota");
    assert.equal(payload.year, 2020);
    assert.equal(payload.financing_available, true);
    assert.deepEqual(payload.media_urls, ["https://example.com/a.webp"]);
  });

  it("maps engine values to the property create payload shape and zeroes rooms for land", () => {
    const payload = valuesToPropertyPayload({
      listing_type: "sale",
      property_type: "land",
      title: "Prime plot",
      price: 5000000,
      state: "Lagos",
      city: "Lekki",
      bedrooms: 3,
    });
    assert.equal(payload.bedrooms, 0);
    assert.equal(payload.property_type, "land");
  });
});
