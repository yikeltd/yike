import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOME_MOBILE_FILTER_EXPANDED_PANEL_CLASS,
  HOME_MOBILE_FILTER_TOGGLE_CLASS,
} from "@/components/home/home-mobile-filter-shell";

const root = process.cwd();

test("mobile header shows unified search pill by default", () => {
  const header = readFileSync(
    join(root, "src/components/layout/header-mobile.tsx"),
    "utf8",
  );
  assert.match(header, /home-unified-search-bar/);
  assert.match(header, /HeaderUniversalSearch/);
  assert.match(header, /Search property, vehicles & electronics/);
  assert.doesNotMatch(header, /home-unified-search-collapsed/);
  assert.doesNotMatch(header, /Select filters below to search/);
});

test("header universal search opens homepage hero filters from sliders", () => {
  const search = readFileSync(
    join(root, "src/components/search/header-universal-search.tsx"),
    "utf8",
  );
  assert.match(search, /openHomeMarketplaceFilters/);
  assert.match(search, /isHomeMarketplace/);
  assert.match(search, /stopPropagation/);
});

test("properties and vehicles use shared mobile filter toggle classes", () => {
  const vehicle = readFileSync(
    join(root, "src/components/home/home-vehicle-search.tsx"),
    "utf8",
  );
  const property = readFileSync(
    join(root, "src/components/search/browse-listings-block.tsx"),
    "utf8",
  );
  const electronics = readFileSync(
    join(root, "src/components/home/home-desktop-electronics-search.tsx"),
    "utf8",
  );
  for (const src of [vehicle, property, electronics]) {
    assert.match(src, /HomeMobileFilterShell/);
  }
  assert.match(property, /collapseEnabled=\{mobileFilterCollapse\}/);
  assert.match(
    property,
    /if \(useMobileShell\)[\s\S]*<div className="space-y-2">[\s\S]*HomeMobileFilterShell/,
  );
  assert.match(HOME_MOBILE_FILTER_TOGGLE_CLASS, /min-h-\[44px\]/);
  assert.match(HOME_MOBILE_FILTER_TOGGLE_CLASS, /rounded-xl/);
  assert.match(HOME_MOBILE_FILTER_EXPANDED_PANEL_CLASS, /backdrop-blur-sm/);
});

test("filter context exposes openHomeMarketplaceFilters", () => {
  const ctx = readFileSync(
    join(root, "src/lib/home/home-marketplace-filter-context.tsx"),
    "utf8",
  );
  assert.match(ctx, /openHomeMarketplaceFilters/);
  assert.match(ctx, /home-search/);
});
