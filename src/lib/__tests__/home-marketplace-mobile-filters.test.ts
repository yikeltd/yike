import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES,
  VEHICLE_HOME_SEARCH_CATEGORIES,
  resolveVehicleCategoryFilter,
  isPersistedVehicleCategory,
} from "@/lib/marketplace/vehicle-taxonomy";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { propertyTypesForListingType } from "@/constants/listingTypes";
import { vehiclePrimaryCategorySelectOptions } from "@/lib/marketplace/vehicle-specs";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";

test("mobile hero uses collapsible filter shell on compact marketplace hero", () => {
  const hero = readFileSync(
    join(process.cwd(), "src/components/home/home-compact-marketplace-hero.tsx"),
    "utf8",
  );
  assert.match(hero, /mobileFilterCollapse/);
  assert.match(hero, /useState\(false\)/);
  assert.match(hero, /filtersExpanded/);
});

test("mobile filter shell keeps search visible while filters collapse", () => {
  const shell = readFileSync(
    join(process.cwd(), "src/components/home/home-mobile-filter-shell.tsx"),
    "utf8",
  );
  assert.match(shell, /Filters & location/);
  assert.match(shell, /searchButton/);
});

test("vehicle search activates detail filters after category on mobile", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /showDetailFilters/);
  assert.match(src, /mobileFilterCollapse \|\| Boolean\(category\)/);
});

test("property browse block gates location filters until deal type chosen on mobile", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/search/browse-listings-block.tsx"),
    "utf8",
  );
  assert.match(src, /showPropertyDetailFilters/);
  assert.match(src, /dealKey !== ""/);
});

test("electronics search gates detail filters until category chosen on mobile", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-electronics-search.tsx"),
    "utf8",
  );
  assert.match(src, /showDetailFilters/);
  assert.match(src, /mobileFilterCollapse \|\| Boolean\(category\)/);
});

test("vehicle primary marketplace categories (five road types)", () => {
  const ids = VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids, [
    "car",
    "suv",
    "pickup_van",
    "bus_minibus",
    "motorcycle_tricycle",
  ]);
  assert.deepEqual(VEHICLE_HOME_SEARCH_CATEGORIES, VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES);
  for (const id of ids) {
    assert.equal(isPersistedVehicleCategory(id), true);
    const resolved = resolveVehicleCategoryFilter({ category: id });
    assert.ok(resolved?.includes(id), `filter resolves ${id}`);
  }
});

test("listing engine vehicle.types uses primary marketplace catalog", () => {
  const catalog = readFileSync(
    join(process.cwd(), "src/lib/listing-engine/catalogs/vehicle.ts"),
    "utf8",
  );
  assert.match(catalog, /vehiclePrimaryCategorySelectOptions/);
  const options = vehiclePrimaryCategorySelectOptions();
  assert.equal(options.length, 5);
});

test("property and electronics category SSOT align with listing catalogs", () => {
  assert.ok(PROPERTY_CATEGORIES.length >= 10);
  assert.ok(ELECTRONICS_CATEGORIES.length >= 8);
  const electronicsCatalog = readFileSync(
    join(process.cwd(), "src/lib/listing-engine/catalogs/electronics.ts"),
    "utf8",
  );
  assert.match(electronicsCatalog, /ELECTRONICS_CATEGORIES/);
  const propertyCatalog = readFileSync(
    join(process.cwd(), "src/lib/listing-engine/catalogs/property.ts"),
    "utf8",
  );
  assert.match(propertyCatalog, /propertyTypesForListingType/);
  const searchOpts = readFileSync(
    join(process.cwd(), "src/lib/search-dropdown-options.ts"),
    "utf8",
  );
  assert.match(searchOpts, /buildPropertyTypeSelectOptions|propertyCategories/);
});

test("wallet page requires auth before feature-flag redirect", () => {
  const page = readFileSync(
    join(process.cwd(), "src/app/(public)/account/coins/page.tsx"),
    "utf8",
  );
  const authIdx = page.indexOf('redirect("/auth/login?next=/account/coins")');
  const flagIdx = page.indexOf("isYikeCoinsEnabled()");
  assert.ok(authIdx >= 0 && flagIdx > authIdx);
});

test("home vehicle search uses primary category SSOT", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES/);
  assert.doesNotMatch(src, /value: "truck"/);
});

test("desktop vehicle hero chips use primary marketplace categories", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES/);
  assert.doesNotMatch(src, /value: "truck"/);
});

test("home vehicle search maps category selection to URL search params", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /params\.set\("category", category\)/);
  assert.match(src, /params\.set\("make", make\)/);
  assert.match(src, /params\.set\("min_price"/);
});

test("primary vehicle category labels match consumer copy", () => {
  assert.equal(vehicleCategoryLabel("car"), "Cars");
  assert.equal(vehicleCategoryLabel("suv"), "SUVs");
  assert.equal(vehicleCategoryLabel("pickup_van"), "Pickups");
  assert.equal(vehicleCategoryLabel("bus_minibus"), "Buses");
  assert.equal(vehicleCategoryLabel("motorcycle_tricycle"), "Motorcycles");
  assert.equal(vehicleCategoryLabel("truck"), "Truck (legacy)");
});

test("property listing types are subset of PROPERTY_CATEGORIES SSOT", () => {
  const known = new Set(PROPERTY_CATEGORIES.map((c) => c.value));
  for (const listingType of ["rent", "lease", "sale", "shortlet"] as const) {
    for (const t of propertyTypesForListingType(listingType)) {
      assert.ok(known.has(t.value), `${t.value} missing from PROPERTY_CATEGORIES`);
    }
  }
});

test("electronics home search and listing catalog share category ids", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-electronics-search.tsx"),
    "utf8",
  );
  assert.match(src, /ELECTRONICS_CATEGORIES\.map/);
  const catalogIds = ELECTRONICS_CATEGORIES.map((c) => c.id).sort();
  const specIds = [...ELECTRONICS_CATEGORIES.map((c) => c.id)].sort();
  assert.deepEqual(catalogIds, specIds);
});
