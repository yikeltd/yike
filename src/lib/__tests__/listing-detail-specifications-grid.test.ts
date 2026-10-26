import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");

const DETAIL_FILES = [
  "components/property/property-detail-experience.tsx",
  "components/marketplace/vehicle-detail-experience.tsx",
  "components/marketplace/electronics-detail-experience.tsx",
] as const;

test("shared specifications grid uses compact two-column layout and YDS spec cells", () => {
  const grid = readFileSync(
    join(root, "components/marketplace/listing-detail-specifications-grid.tsx"),
    "utf8",
  );
  assert.match(grid, /yike-spec-cell/);
  assert.match(grid, /min-\[480px\]:grid-cols-2/);
  assert.match(grid, /min-w-0/);
  assert.match(grid, /text-muted/);
  assert.doesNotMatch(grid, /rounded-2xl border border-slate-100 bg-slate-50/);
});

test("property, vehicle, and electronics detail use shared specifications section", () => {
  for (const file of DETAIL_FILES) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailSpecificationsSection/, file);
  }
});

test("property and vehicle detail pages use warm YDS canvas", () => {
  for (const file of [
    "components/property/property-detail-experience.tsx",
    "components/marketplace/vehicle-detail-experience.tsx",
  ]) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /yike-detail-canvas/, file);
    assert.doesNotMatch(src, /bg-\[#f7f9fc\]/, file);
  }
});
