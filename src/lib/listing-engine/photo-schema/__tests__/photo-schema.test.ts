/**
 * Photo schema unit tests — run with:
 *   npx tsx --test src/lib/listing-engine/photo-schema/__tests__/photo-schema.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VEHICLE_PHOTO_SCHEMA,
  PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  PROPERTY_LAND_PHOTO_SCHEMA,
  isValidPhotoLabel,
  migratePhotoLabel,
  resolvePhotoSchema,
  resolvePropertyPhotoSchema,
  resolveVehiclePhotoSchema,
  schemaLabels,
  PROPERTY_PHOTO_RULES,
  VEHICLE_PHOTO_RULES,
} from "../index";
import { validateCategoryManifest } from "../../validate-config";
import { PROPERTY_CATEGORY_MANIFEST } from "../../categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "../../categories/vehicle";

describe("category-aware photo schemas", () => {
  it("vehicle schema has no bedroom/kitchen tags", () => {
    const labels = schemaLabels(VEHICLE_PHOTO_SCHEMA);
    assert.ok(labels.includes("Engine"));
    assert.ok(labels.includes("Dashboard"));
    assert.equal(labels.includes("Bedroom"), false);
    assert.equal(labels.includes("Kitchen"), false);
  });

  it("residential property schema has no engine/tyres tags", () => {
    const labels = schemaLabels(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA);
    assert.ok(labels.includes("Bedroom"));
    assert.ok(labels.includes("Kitchen"));
    assert.equal(labels.includes("Engine"), false);
    assert.equal(labels.includes("Tyres"), false);
  });

  it("land schema is boundary-focused", () => {
    const labels = schemaLabels(PROPERTY_LAND_PHOTO_SCHEMA);
    assert.ok(labels.includes("Boundary"));
    assert.ok(labels.includes("Survey Plan"));
    assert.equal(labels.includes("Bedroom"), false);
    assert.equal(labels.includes("Engine"), false);
  });

  it("resolves land vs residential from property values", () => {
    const land = resolvePhotoSchema(PROPERTY_PHOTO_RULES, {
      property_type: "land",
      listing_type: "sale",
    });
    assert.equal(land.id, "property.land");

    const flat = resolvePhotoSchema(PROPERTY_PHOTO_RULES, {
      property_type: "flat",
      listing_type: "rent",
    });
    assert.equal(flat.id, "property.residential");
  });

  it("vehicle resolver returns vehicle taxonomy", () => {
    assert.equal(resolveVehiclePhotoSchema().id, "vehicle");
    assert.equal(resolvePhotoSchema(VEHICLE_PHOTO_RULES).id, "vehicle");
  });

  it("migrates invalid cross-category labels to Other", () => {
    assert.equal(migratePhotoLabel(VEHICLE_PHOTO_SCHEMA, "Bedroom"), "Other");
    assert.equal(
      migratePhotoLabel(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA, "Engine"),
      "Other"
    );
    assert.equal(migratePhotoLabel(PROPERTY_LAND_PHOTO_SCHEMA, "Kitchen"), "Other");
  });

  it("maps legacy Exterior onto the active schema", () => {
    assert.equal(
      migratePhotoLabel(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA, "Exterior"),
      "Front View"
    );
    assert.equal(
      migratePhotoLabel(VEHICLE_PHOTO_SCHEMA, "Exterior"),
      "Exterior Front"
    );
  });

  it("validates labels against schema", () => {
    assert.equal(isValidPhotoLabel(VEHICLE_PHOTO_SCHEMA, "Engine"), true);
    assert.equal(isValidPhotoLabel(VEHICLE_PHOTO_SCHEMA, "Bedroom"), false);
    assert.equal(
      isValidPhotoLabel(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA, "Kitchen"),
      true
    );
    assert.equal(
      isValidPhotoLabel(PROPERTY_RESIDENTIAL_PHOTO_SCHEMA, "Dashboard"),
      false
    );
  });

  it("legacy property helper matches resolve", () => {
    assert.equal(
      resolvePropertyPhotoSchema({ propertyType: "land" }).id,
      "property.land"
    );
    assert.equal(
      resolvePropertyPhotoSchema({ propertyType: "shop", listingType: "rent" }).id,
      "property.commercial"
    );
  });

  it("category manifests include photo schemas and pass config validation", () => {
    assert.equal(VEHICLE_CATEGORY_MANIFEST.photo.schema.id, "vehicle");
    assert.equal(
      PROPERTY_CATEGORY_MANIFEST.photo.schema.id,
      "property.residential"
    );
    assert.deepEqual(
      validateCategoryManifest(VEHICLE_CATEGORY_MANIFEST, { throwOnError: false }),
      []
    );
    assert.deepEqual(
      validateCategoryManifest(PROPERTY_CATEGORY_MANIFEST, { throwOnError: false }),
      []
    );
  });
});
