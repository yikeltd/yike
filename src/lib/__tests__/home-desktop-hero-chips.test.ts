import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { HOME_DEAL_TYPES } from "@/constants/listingTypes";
import { VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";

test("desktop vehicle hero exposes All plus five primary category chips", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-vehicle-search.tsx"),
    "utf8",
  );
  assert.match(src, /VEHICLE_DEAL_CHIPS/);
  assert.match(src, /label: "All"/);
  assert.match(src, /VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES\.map/);
  assert.equal(VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES.length, 5);
});

test("desktop property hero exposes All Rent Buy Land chips", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/search/browse-listings-block.tsx"),
    "utf8",
  );
  assert.match(src, /HOME_DEAL_TYPES/);
  const labels = HOME_DEAL_TYPES.map((c) => c.label);
  assert.deepEqual(labels, ["All", "Rent", "Buy", "Land"]);
});

test("desktop electronics hero exposes All plus ELECTRONICS_CATEGORIES chips", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-electronics-search.tsx"),
    "utf8",
  );
  assert.match(src, /ELECTRONICS_DEAL_CHIPS/);
  assert.match(src, /ELECTRONICS_CATEGORIES\.map/);
  assert.match(src, /home-desktop-electronics-category-chips/);
  assert.match(src, /params\.set\("category", category\)/);
  assert.equal(
    ELECTRONICS_CATEGORIES.length + 1,
    12,
    "All chip plus one row per taxonomy category",
  );
});

test("desktop electronics category chips count matches taxonomy", () => {
  assert.equal(ELECTRONICS_CATEGORIES.length, 11);
});
