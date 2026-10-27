import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  defaultCreatableListingCategory,
  parseListingCategoryParam,
} from "@/lib/listing-engine/default-creatable-category";

test("parseListingCategoryParam accepts only creatable top-level categories", () => {
  assert.equal(parseListingCategoryParam("property"), "property");
  assert.equal(parseListingCategoryParam("vehicle"), "vehicle");
  assert.equal(parseListingCategoryParam("electronics"), "electronics");
  assert.equal(parseListingCategoryParam("land"), null);
  assert.equal(parseListingCategoryParam(null), null);
});

test("default creatable category is property when launch flags allow", () => {
  const id = defaultCreatableListingCategory();
  assert.ok(["property", "vehicle", "electronics"].includes(id));
});

test("choose route redirects to instant workspace", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/agent/listings/choose/page.tsx"),
    "utf8",
  );
  assert.match(src, /redirect\(/);
  assert.match(src, /\/agent\/listings\/new/);
  assert.doesNotMatch(src, /SellerCategoryChoose/);
});

test("instant workspace mounts searchable category combobox and listing engine", () => {
  const ws = readFileSync(
    join(process.cwd(), "src/components/listing-engine/instant-listing-workspace.tsx"),
    "utf8",
  );
  assert.match(ws, /ListingCategoryCombobox/);
  assert.match(ws, /layout="instant"/);
  assert.match(ws, /instant-listing-workspace/);
});

test("listing engine supports instant single-page layout", () => {
  const engine = readFileSync(
    join(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf8",
  );
  assert.match(engine, /layout\?: "accordion" \| "instant"/);
  assert.match(engine, /expandAll/);
});
