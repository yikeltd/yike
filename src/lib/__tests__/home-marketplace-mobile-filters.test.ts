import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  VEHICLE_HOME_SEARCH_CATEGORIES,
  resolveVehicleCategoryFilter,
} from "@/lib/marketplace/vehicle-taxonomy";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";

test("mobile hero uses collapsible filter shell on compact marketplace hero", () => {
  const hero = readFileSync(
    join(process.cwd(), "src/components/home/home-compact-marketplace-hero.tsx"),
    "utf8",
  );
  assert.match(hero, /mobileFilterCollapse/);
  assert.match(hero, /filtersExpanded/);
  assert.match(hero, /HomeMobileFilterShell|mobileFilterCollapse/);
});

test("vehicle home search categories include five required road types", () => {
  const ids = VEHICLE_HOME_SEARCH_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids, [
    "car",
    "suv",
    "pickup_van",
    "bus_minibus",
    "motorcycle_tricycle",
  ]);
  for (const id of ids) {
    const resolved = resolveVehicleCategoryFilter({ category: id });
    assert.ok(resolved?.includes(id), `filter resolves ${id}`);
  }
});

test("home vehicle search imports shared home category list", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /VEHICLE_HOME_SEARCH_CATEGORIES/);
  assert.doesNotMatch(src, /value: "truck"/);
});

test("property and electronics category SSOT remain non-empty", () => {
  assert.ok(PROPERTY_CATEGORIES.length >= 10);
  assert.ok(ELECTRONICS_CATEGORIES.length >= 8);
});

test("browse listings block supports mobile filter collapse for home premium", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/search/browse-listings-block.tsx"),
    "utf8",
  );
  assert.match(src, /HomeMobileFilterShell/);
  assert.match(src, /mobileFilterCollapse/);
});
