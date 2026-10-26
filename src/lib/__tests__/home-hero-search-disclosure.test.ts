import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  vehicleHomeSearchCategorySelectOptions,
  VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES,
  VEHICLE_CATEGORIES_BROWSE,
  isPersistedVehicleCategory,
} from "@/lib/marketplace/vehicle-taxonomy";
import {
  propertyMarketplaceMeaningfulSelection,
  vehicleMarketplaceMeaningfulSelection,
} from "@/lib/home/marketplace-filter-engagement";

test("mobile filter shell hides search until meaningful selection", () => {
  const shell = readFileSync(
    join(process.cwd(), "src/components/home/home-mobile-filter-shell.tsx"),
    "utf8",
  );
  assert.match(shell, /showSearchButton/);
  assert.match(shell, /home-mobile-search-cta/);
});

test("header mobile hides unified search on homepage until filters engaged", () => {
  const header = readFileSync(
    join(process.cwd(), "src/components/layout/header-mobile.tsx"),
    "utf8",
  );
  assert.match(header, /useHomeLargeSearchBarVisible/);
  assert.match(header, /home-unified-search-collapsed/);
  assert.match(header, /home-unified-search-bar/);
});

test("meaningful selection requires actual filter values not panel open alone", () => {
  assert.equal(
    propertyMarketplaceMeaningfulSelection({
      dealKey: "",
      state: "",
      city: "",
      area: "",
      propertyType: "",
      budget: "",
    }),
    false,
  );
  assert.equal(
    propertyMarketplaceMeaningfulSelection({
      dealKey: "rent",
      state: "",
      city: "",
      area: "",
      propertyType: "",
      budget: "",
    }),
    true,
  );
  assert.equal(
    vehicleMarketplaceMeaningfulSelection({
      category: "car",
      state: "",
      city: "",
      make: "",
      carType: "",
      budget: "",
    }),
    true,
  );
});

test("vehicle home search category options include five primary plus browse taxonomy", () => {
  const options = vehicleHomeSearchCategorySelectOptions();
  const values = options
    .filter((o): o is { value: string; label: string } => "value" in o)
    .map((o) => o.value);

  const primaryIds = VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES.map((c) => c.id);
  for (const id of primaryIds) {
    assert.ok(values.includes(id), `missing primary ${id}`);
  }

  const primaryIndex = (id: string) => values.indexOf(id);
  for (let i = 1; i < primaryIds.length; i++) {
    assert.ok(
      primaryIndex(primaryIds[i]!) > primaryIndex(primaryIds[i - 1]!),
      "primary order preserved",
    );
  }

  const moreId = VEHICLE_CATEGORIES_BROWSE.find(
    (c) => !primaryIds.includes(c.id as (typeof primaryIds)[number]),
  )?.id;
  if (moreId) {
    assert.ok(values.includes(moreId), "includes non-primary browse category");
  }

  const unique = new Set(values.filter(Boolean));
  assert.equal(unique.size, values.filter(Boolean).length, "no duplicate values");

  for (const v of values) {
    if (v) assert.equal(isPersistedVehicleCategory(v), true, `invalid id ${v}`);
  }
});

test("compact hero reserves minimum height on mobile", () => {
  const hero = readFileSync(
    join(process.cwd(), "src/components/home/home-compact-marketplace-hero.tsx"),
    "utf8",
  );
  assert.match(hero, /min-h-\[/);
});
