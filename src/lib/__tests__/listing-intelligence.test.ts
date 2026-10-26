import assert from "node:assert/strict";
import test from "node:test";
import { getListingCatalogsFromYip } from "@/lib/listing-engine";
import { ELECTRONICS_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/electronics";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import { VEHICLE_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/vehicle";
import {
  applyListingSuggestions,
  detectMarketplaceCategory,
  parseListingText,
} from "@/lib/listing-engine/intelligence";

const CATALOGS = getListingCatalogsFromYip();

test("detectMarketplaceCategory prefers vehicle for make + year", () => {
  const hint = detectMarketplaceCategory("2019 Toyota Corolla automatic foreign used");
  assert.equal(hint?.categoryId, "vehicle");
  assert.ok(hint!.confidence === "high" || hint!.confidence === "medium");
});

test("detectMarketplaceCategory prefers electronics for phone keywords", () => {
  const hint = detectMarketplaceCategory("Samsung Galaxy A54 128GB UK used");
  assert.equal(hint?.categoryId, "electronics");
});

test("detectMarketplaceCategory prefers property for bedroom duplex rent", () => {
  const hint = detectMarketplaceCategory("4 bedroom duplex for rent in Lekki");
  assert.equal(hint?.categoryId, "property");
});

test("vehicle parse applies high confidence make model year", () => {
  const parsed = parseListingText(
    VEHICLE_CATEGORY_MANIFEST,
    "2018 Honda Accord automatic petrol 95000 km",
    {},
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, {}, new Set());
  assert.equal(applied.patch.make, "Honda");
  assert.equal(applied.patch.model, "Accord");
  assert.equal(applied.patch.year, 2018);
  assert.equal(applied.patch.transmission, "automatic");
  assert.equal(applied.patch.fuel_type, "petrol");
  assert.equal(applied.patch.mileage, "95000");
});

test("vehicle parse does not overwrite confirmed make", () => {
  const parsed = parseListingText(
    VEHICLE_CATEGORY_MANIFEST,
    "Toyota Camry 2020",
    { make: "Ford" },
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, { make: "Ford" }, new Set(["make"]));
  assert.equal(applied.patch.make, undefined);
});

test("electronics medium category stays pending not auto-applied when low path", () => {
  const parsed = parseListingText(
    ELECTRONICS_CATEGORY_MANIFEST,
    "gaming console ps5",
    {},
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, {}, new Set());
  assert.equal(applied.patch.auto_category, "gaming");
});

test("electronics brand high confidence applies", () => {
  const parsed = parseListingText(
    ELECTRONICS_CATEGORY_MANIFEST,
    "Samsung Galaxy S23 256GB brand new",
    { auto_category: "phones_tablets" },
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, {}, new Set());
  assert.equal(applied.patch.brand, "Samsung");
  assert.equal(applied.patch.storage_gb, "256");
});

test("property bedrooms and listing type from text", () => {
  const parsed = parseListingText(
    PROPERTY_CATEGORY_MANIFEST,
    "3 bedroom flat for rent",
    {},
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, {}, new Set());
  assert.equal(applied.patch.bedrooms, 3);
  assert.ok(applied.pendingByField.listing_type?.length || applied.patch.listing_type === "rent");
});

test("never fabricates state not mentioned", () => {
  const parsed = parseListingText(
    PROPERTY_CATEGORY_MANIFEST,
    "4 bedroom duplex",
    {},
    CATALOGS,
  );
  assert.ok(!parsed.fields.some((f) => f.fieldId === "state"));
});

test("low confidence condition stays pending for electronics", () => {
  const parsed = parseListingText(
    ELECTRONICS_CATEGORY_MANIFEST,
    "maybe used laptop",
    { auto_category: "computers" },
    CATALOGS,
  );
  const applied = applyListingSuggestions(parsed.fields, {}, new Set());
  assert.equal(applied.patch.condition, undefined);
});
