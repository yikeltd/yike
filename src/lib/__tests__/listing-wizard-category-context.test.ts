import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import {
  ELECTRONICS_PHOTO_RULES,
  PROPERTY_PHOTO_RULES,
  VEHICLE_PHOTO_RULES,
  migratePhotoLabel,
  resolvePhotoSchema,
  resolvePhotoSchemaFromManifest,
  schemaLabels,
} from "@/lib/listing-engine/photo-schema";
import { validateCategoryManifest } from "@/lib/listing-engine/validate-config";

test("electronics manifest uses electronics photo rules, not vehicle", () => {
  assert.equal(ELECTRONICS_CATEGORY_MANIFEST.photo.schema.id, "electronics.generic");
  assert.notEqual(ELECTRONICS_CATEGORY_MANIFEST.photo.schema.id, "vehicle");
  assert.deepEqual(
    validateCategoryManifest(ELECTRONICS_CATEGORY_MANIFEST, { throwOnError: false }),
    [],
  );
});

test("phone electronics resolves phone photo schema without dashboard label", () => {
  const schema = resolvePhotoSchema(ELECTRONICS_PHOTO_RULES, {
    auto_category: "phones_tablets",
  });
  assert.equal(schema.id, "electronics.phone");
  const labels = schemaLabels(schema);
  assert.equal(labels.includes("Dashboard"), false);
  assert.equal(labels.includes("Odometer"), false);
  assert.ok(labels.includes("Front"));
  assert.ok(schema.uploadHint?.includes("screen"));
});

test("laptop electronics resolves laptop photo schema with keyboard", () => {
  const schema = resolvePhotoSchema(ELECTRONICS_PHOTO_RULES, {
    auto_category: "computers",
  });
  assert.equal(schema.id, "electronics.laptop");
  assert.ok(schemaLabels(schema).includes("Keyboard"));
  assert.equal(schemaLabels(schema).includes("Steering Wheel"), false);
});

test("unknown electronics subtype uses generic schema", () => {
  const schema = resolvePhotoSchema(ELECTRONICS_PHOTO_RULES, {
    auto_category: "other_electronics",
  });
  assert.equal(schema.id, "electronics.generic");
});

test("motorcycle vehicle subtype drops car interior labels", () => {
  const schema = resolvePhotoSchema(VEHICLE_PHOTO_RULES, {
    auto_category: "motorcycle",
  });
  assert.equal(schema.id, "vehicle.motorcycle");
  const labels = schemaLabels(schema);
  assert.equal(labels.includes("Dashboard"), false);
  assert.equal(labels.includes("Boot / Trunk"), false);
  assert.ok(labels.includes("Engine"));
});

test("car vehicle keeps full vehicle photo taxonomy", () => {
  const schema = resolvePhotoSchema(VEHICLE_PHOTO_RULES, { auto_category: "car" });
  assert.equal(schema.id, "vehicle");
  assert.ok(schemaLabels(schema).includes("Dashboard"));
});

test("property land uses land photo schema", () => {
  const schema = resolvePhotoSchemaFromManifest(PROPERTY_CATEGORY_MANIFEST, {
    property_type: "land",
    listing_type: "sale",
  });
  assert.equal(schema.id, "property.land");
  assert.equal(schemaLabels(schema).includes("Engine"), false);
});

test("vehicle dashboard label migrates to Other on phone electronics schema", () => {
  const phone = resolvePhotoSchema(ELECTRONICS_PHOTO_RULES, {
    auto_category: "phones_tablets",
  });
  assert.equal(migratePhotoLabel(phone, "Dashboard"), "Other");
});

test("listing engine binds photo schema to manifest values", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf-8",
  );
  assert.match(src, /resolvePhotoSchemaFromManifest\(manifest, values\)/);
  assert.match(src, /sanitizeMediaItemLabels/);
  assert.ok(!src.includes("VEHICLE_PHOTO_RULES"));
});

test("validation errors are not duplicated in publish blockers logic", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/listing-engine/wizard-progress.ts"),
    "utf-8",
  );
  assert.match(src, /seenMessages/);
});

test("draft copy states local device only once", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf-8",
  );
  assert.match(src, /Saved on this device only/);
  assert.ok(!src.includes("Save draft"));
});
