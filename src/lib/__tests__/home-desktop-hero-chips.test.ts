import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { HOME_DEAL_TYPES } from "@/constants/listingTypes";
import { VEHICLE_PRIMARY_MARKETPLACE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { DESKTOP_ELECTRONICS_HERO_SHORTCUTS } from "@/components/home/home-desktop-electronics-search";

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

test("desktop electronics hero exposes exactly four category shortcuts", () => {
  assert.deepEqual(
    DESKTOP_ELECTRONICS_HERO_SHORTCUTS.map((c) => c.label),
    ["Phones", "Laptops", "TVs", "Home Appliances"],
  );
  assert.deepEqual(
    DESKTOP_ELECTRONICS_HERO_SHORTCUTS.map((c) => c.value),
    ["phones_tablets", "computers", "tv_audio", "home_appliances"],
  );
  assert.equal(DESKTOP_ELECTRONICS_HERO_SHORTCUTS.length, 4);

  const src = readFileSync(
    join(process.cwd(), "src/components/home/home-desktop-electronics-search.tsx"),
    "utf8",
  );
  assert.match(src, /DESKTOP_ELECTRONICS_HERO_SHORTCUTS/);
  assert.doesNotMatch(src, /ELECTRONICS_DEAL_CHIPS/);
  assert.match(src, /home-desktop-electronics-category-chips/);
  assert.match(src, /params\.set\("category", category\)/);
  assert.match(src, /ELECTRONICS_CATEGORIES\.map/);
});

test("full electronics taxonomy remains available for mobile and forms", () => {
  assert.equal(ELECTRONICS_CATEGORIES.length, 11);
  for (const shortcut of DESKTOP_ELECTRONICS_HERO_SHORTCUTS) {
    assert.ok(
      ELECTRONICS_CATEGORIES.some((c) => c.id === shortcut.value),
      `missing taxonomy id ${shortcut.value}`,
    );
  }
});
