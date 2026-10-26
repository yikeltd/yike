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

test("shared specifications grid uses compact two-column layout and text wrapping", () => {
  const grid = readFileSync(
    join(root, "components/marketplace/listing-detail-specifications-grid.tsx"),
    "utf8",
  );
  assert.match(grid, /listing-detail-spec-grid/);
  assert.match(grid, /min-\[480px\]:grid-cols-2/);
  assert.match(grid, /min-w-0/);
  assert.match(grid, /break-words/);
  assert.match(grid, /overflow-wrap:anywhere/);
  assert.doesNotMatch(grid, /truncate/);
  assert.doesNotMatch(grid, /rounded-2xl border border-slate-100 bg-slate-50/);
  assert.match(grid, /max-w-full/);
});

test("globals.css includes specifications grid column fallback", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  assert.match(css, /\.listing-detail-spec-grid/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("property, vehicle, and electronics detail use shared specifications section", () => {
  for (const file of DETAIL_FILES) {
    const src = readFileSync(join(root, file), "utf8");
    assert.match(src, /ListingDetailSpecificationsSection/, file);
    assert.doesNotMatch(src, /grid grid-cols-2 gap-2\.5 text-xs/, file);
  }
});
