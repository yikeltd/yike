import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSmartFilterHref,
  clearIncompatibleFilterFields,
  defaultSmartFilterState,
  filterRouteForVertical,
  smartFilterToUrlParams,
} from "@/lib/search/smart-filter-engine";

test("electronics filters route to /electronics with category and brand", () => {
  const href = buildSmartFilterHref({
    ...defaultSmartFilterState("electronics"),
    vertical: "electronics",
    state: "Lagos",
    city: "Ikeja",
    category: "phones_tablets",
    brand: "Samsung",
    condition: "brand_new",
    min_price: "100000",
    max_price: "500000",
    q: "galaxy",
  });
  assert.ok(href.startsWith("/electronics?"));
  const sp = new URLSearchParams(href.split("?")[1]);
  assert.equal(sp.get("category"), "phones_tablets");
  assert.equal(sp.get("brand"), "Samsung");
  assert.equal(sp.get("condition"), "brand_new");
  assert.equal(sp.get("min_price"), "100000");
  assert.equal(sp.get("q"), "galaxy");
});

test("vehicle filters use /vehicles and condition param", () => {
  const href = buildSmartFilterHref({
    ...defaultSmartFilterState("vehicle"),
    vertical: "vehicle",
    make: "Toyota",
    vehicle_condition: "foreign_used",
  });
  assert.ok(href.startsWith("/vehicles?"));
  const sp = new URLSearchParams(href.split("?")[1]);
  assert.equal(sp.get("make"), "Toyota");
  assert.equal(sp.get("condition"), "foreign_used");
});

test("reset default category is all via defaultSmartFilterState", () => {
  const s = defaultSmartFilterState("all");
  assert.equal(s.vertical, "all");
  assert.equal(s.make, "");
  assert.equal(s.category, "");
});

test("clearIncompatibleFilterFields strips vehicle fields when switching to electronics", () => {
  const prev = {
    ...defaultSmartFilterState("vehicle"),
    make: "Toyota",
    vertical: "vehicle" as const,
  };
  const next = clearIncompatibleFilterFields(prev, "electronics");
  assert.equal(next.vertical, "electronics");
  assert.equal(next.make, "");
  assert.equal(next.category, "");
});

test("buildSmartFilterHref reset state routes to bare /search", () => {
  const href = buildSmartFilterHref(defaultSmartFilterState("all"));
  assert.equal(href, "/search");
});

test("mobile header uses unified search layout without sticky positioning classes", () => {
  const src = readFileSync(
    join(process.cwd(), "src/components/layout/header-mobile.tsx"),
    "utf8",
  );
  const classBlock = src.match(/className=\{cn\([\s\S]*?\)\}/)?.[0] ?? "";
  assert.doesNotMatch(classBlock, /\bsticky\b/);
  assert.doesNotMatch(classBlock, /\bfixed\b/);
  assert.match(src, /layout="unified"/);
});

test("all vertical uses /search with shared params only in builder", () => {
  const params = smartFilterToUrlParams({
    ...defaultSmartFilterState("all"),
    vertical: "all",
    state: "FCT",
    q: "duplex",
    min: "5000000",
  });
  assert.equal(params.get("state"), "FCT");
  assert.equal(params.get("q"), "duplex");
  assert.equal(params.get("min"), "5000000");
  assert.equal(filterRouteForVertical("all"), "/search");
});
