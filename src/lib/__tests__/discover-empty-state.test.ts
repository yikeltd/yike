import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_DISCOVER_FILTERS } from "@/lib/discover/filters";
import {
  discoverFiltersAreRestrictive,
  getDiscoverEmptyCopy,
  getDiscoverEmptyPrimaryAction,
  resolveDiscoverEmptyReason,
} from "@/lib/discover/empty-state";

test("resolveDiscoverEmptyReason distinguishes zero feed from exhausted deck", () => {
  assert.equal(resolveDiscoverEmptyReason(0, 0), "no_results");
  assert.equal(resolveDiscoverEmptyReason(0, 5), "no_results");
  assert.equal(resolveDiscoverEmptyReason(3, 3), "deck_exhausted");
  assert.equal(resolveDiscoverEmptyReason(3, 10), "deck_exhausted");
});

test("no_results copy never claims deck exhaustion", () => {
  const electronics = getDiscoverEmptyCopy("no_results", {
    ...DEFAULT_DISCOVER_FILTERS,
    category: "electronics",
  });
  assert.match(electronics.title, /No electronics listings/i);
  assert.doesNotMatch(electronics.title, /seen everything/i);

  const allFiltered = getDiscoverEmptyCopy("no_results", {
    ...DEFAULT_DISCOVER_FILTERS,
    city: "Lagos",
  });
  assert.match(allFiltered.title, /No listings match/i);
});

test("deck_exhausted copy mentions seeing everything", () => {
  const copy = getDiscoverEmptyCopy("deck_exhausted", DEFAULT_DISCOVER_FILTERS);
  assert.match(copy.title, /seen everything/i);
});

test("primary actions respect filter context", () => {
  assert.equal(
    getDiscoverEmptyPrimaryAction("no_results", {
      ...DEFAULT_DISCOVER_FILTERS,
      category: "electronics",
    }),
    "browse_all_categories",
  );
  assert.equal(
    getDiscoverEmptyPrimaryAction("no_results", {
      ...DEFAULT_DISCOVER_FILTERS,
      maxBudget: 500_000,
    }),
    "increase_budget",
  );
  assert.equal(
    getDiscoverEmptyPrimaryAction("no_results", {
      ...DEFAULT_DISCOVER_FILTERS,
      city: "Abuja",
    }),
    "widen_search",
  );
  assert.equal(
    getDiscoverEmptyPrimaryAction("deck_exhausted", DEFAULT_DISCOVER_FILTERS),
    "refresh_deck",
  );
  assert.equal(
    getDiscoverEmptyPrimaryAction("deck_exhausted", {
      ...DEFAULT_DISCOVER_FILTERS,
      category: "vehicle",
    }),
    "clear_filters",
  );
});

test("discoverFiltersAreRestrictive detects active constraints", () => {
  assert.equal(discoverFiltersAreRestrictive(DEFAULT_DISCOVER_FILTERS), false);
  assert.equal(
    discoverFiltersAreRestrictive({
      ...DEFAULT_DISCOVER_FILTERS,
      electronicsSub: "phones_tablets",
    }),
    true,
  );
});

test("category rail hides electronics sub-row by default", () => {
  const rail = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "src/components/discover/discover-category-rail.tsx",
    ),
    "utf-8",
  );
  assert.match(rail, /filters\.category === "electronics"/);
  assert.doesNotMatch(rail, /filters\.category === "all"/);

  const categories = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/discover/categories.ts"),
    "utf-8",
  );
  assert.match(categories, /shortLabel: "Properties"/);
});

test("discover empty UI exposes single reason marker", () => {
  const empty = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/discover/discover-empty.tsx"),
    "utf-8",
  );
  assert.match(empty, /data-empty-reason/);
  assert.doesNotMatch(empty, /Explore nearby cities/);
  assert.doesNotMatch(empty, /discover-empty-home/);
});
