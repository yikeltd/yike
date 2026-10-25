import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  applyDiscoverFilters,
  DEFAULT_DISCOVER_FILTERS,
} from "@/lib/discover/filters";
import { buildDiscoverFeed } from "@/lib/discover/feed";
import {
  discoverHref,
  parseDiscoverCategoryParam,
  parseDiscoverElectronicsSubParam,
} from "@/lib/discover/categories";
import { interleaveDiscoverListings } from "@/lib/discover/mixed-feed";
import type { Property } from "@/types/database";

function row(partial: Partial<Property> & { id: string }): Property {
  return {
    title: "Test",
    price: 1_000_000,
    city: "Lagos",
    state: "Lagos",
    listing_type: "sale",
    property_type: "flat",
    media_urls: [],
    status: "approved",
    asset_type: "PROPERTY",
    ...partial,
  } as Property;
}

test("Discover defaults to mixed all-categories mode", () => {
  assert.equal(DEFAULT_DISCOVER_FILTERS.category, "all");
});

test("parseDiscoverCategoryParam maps URLs to canonical filters", () => {
  assert.equal(parseDiscoverCategoryParam(undefined), "all");
  assert.equal(parseDiscoverCategoryParam("all"), "all");
  assert.equal(parseDiscoverCategoryParam("electronics"), "electronics");
  assert.equal(parseDiscoverCategoryParam("vehicles"), "vehicle");
});

test("discoverHref builds category deep links", () => {
  assert.equal(discoverHref({ category: "all" }), "/discover");
  assert.equal(discoverHref({ category: "electronics" }), "/discover?category=electronics");
  assert.equal(
    discoverHref({ category: "electronics", electronicsSub: "phones_tablets" }),
    "/discover?category=electronics&electronics_sub=phones_tablets",
  );
});

test("applyDiscoverFilters supports electronics and sub-category", () => {
  const items = [
    row({ id: "p1", asset_type: "PROPERTY" }),
    row({ id: "v1", asset_type: "VEHICLE", auto_category: "car" }),
    row({
      id: "e1",
      asset_type: "ELECTRONICS",
      auto_category: "phones_tablets",
    }),
    row({
      id: "e2",
      asset_type: "ELECTRONICS",
      auto_category: "computers",
    }),
  ];

  const electronicsOnly = applyDiscoverFilters(items, {
    ...DEFAULT_DISCOVER_FILTERS,
    category: "electronics",
  });
  assert.equal(electronicsOnly.length, 2);

  const phonesOnly = applyDiscoverFilters(items, {
    ...DEFAULT_DISCOVER_FILTERS,
    category: "electronics",
    electronicsSub: "phones_tablets",
  });
  assert.equal(phonesOnly.length, 1);
  assert.equal(phonesOnly[0]?.id, "e1");
});

test("buildDiscoverFeed all mode interleaves property, vehicle, and electronics", () => {
  const properties = [row({ id: "p1" }), row({ id: "p2" })];
  const vehicles = [
    row({ id: "v1", asset_type: "VEHICLE", auto_category: "car" }),
  ];
  const electronics = [
    row({ id: "e1", asset_type: "ELECTRONICS", auto_category: "computers" }),
  ];

  const feed = buildDiscoverFeed(
    properties,
    vehicles,
    { ...DEFAULT_DISCOVER_FILTERS, category: "all" },
    undefined,
    electronics,
  );

  const ids = feed.map((f) => f.id);
  assert.ok(ids.includes("p1"));
  assert.ok(ids.includes("v1"));
  assert.ok(ids.includes("e1"));
  assert.notEqual(ids[0], ids[1]);
});

test("interleaveDiscoverListings rotates pools", () => {
  const a = [row({ id: "a1" }), row({ id: "a2" })];
  const b = [row({ id: "b1", asset_type: "VEHICLE" })];
  const out = interleaveDiscoverListings([a, b], 3);
  assert.deepEqual(
    out.map((x) => x.id),
    ["a1", "b1", "a2"],
  );
});

test("state city budget featured verified filters still apply on mixed pool", () => {
  const items = [
    row({ id: "p1", city: "Abuja", price: 500_000, is_featured: true }),
    row({ id: "p2", city: "Lagos", price: 5_000_000 }),
  ];
  const filtered = applyDiscoverFilters(items, {
    ...DEFAULT_DISCOVER_FILTERS,
    category: "all",
    city: "Abuja",
    maxBudget: 1_000_000,
    featuredOnly: true,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "p1");
});

test("parseDiscoverElectronicsSubParam rejects unknown sub-categories", () => {
  assert.equal(parseDiscoverElectronicsSubParam("phones_tablets"), "phones_tablets");
  assert.equal(parseDiscoverElectronicsSubParam("fashion"), "");
});

test("Discover UI surfaces electronics alongside legacy verticals", () => {
  const rail = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/discover/discover-category-rail.tsx"),
    "utf-8",
  );
  assert.match(rail, /getDiscoverCategoryOptions/);
  assert.match(rail, /Electronics|electronics/);
});

test("homepage does not ship a duplicate Explore categories promo block", () => {
  const experience = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/home/home-marketplace-experience.tsx"),
    "utf-8",
  );
  const desktop = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/home/home-desktop-view.tsx"),
    "utf-8",
  );
  assert.ok(!experience.includes("HomeExploreCategories"));
  assert.ok(!desktop.includes("HomeExploreCategories"));
  assert.ok(!experience.includes("Explore categories"));
});
