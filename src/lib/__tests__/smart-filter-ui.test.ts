import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSmartFilterHref,
  defaultSmartFilterState,
} from "@/lib/search/smart-filter-engine";

const filtersSrc = readFileSync(
  join(process.cwd(), "src/components/search/search-context-filters.tsx"),
  "utf8",
);

const headerSrc = readFileSync(
  join(process.cwd(), "src/components/search/header-universal-search.tsx"),
  "utf8",
);

test("Smart Filter Engine keeps Search CTA in sticky footer outside scroll region", () => {
  assert.match(filtersSrc, /data-testid="smart-filter-search-submit"/);
  assert.match(filtersSrc, />\s*Search\s*</);
  assert.match(filtersSrc, /shrink-0 border-t[\s\S]*type="submit"/);
  assert.match(filtersSrc, /flex-1 space-y-4 overflow-y-auto/);
  assert.doesNotMatch(filtersSrc, /Apply filters & search/);
});

test("Smart Filter form submit prevents default and uses onApply", () => {
  assert.match(filtersSrc, /function handleFormSubmit\(e: React\.FormEvent\)/);
  assert.match(filtersSrc, /e\.preventDefault\(\)/);
  assert.match(filtersSrc, /onApply\(form\)/);
  assert.match(filtersSrc, /onSubmit=\{handleFormSubmit\}/);
});

test("Keywords field supports Enter-to-search via form submit", () => {
  assert.match(filtersSrc, /enterKeyHint="search"/);
  assert.match(filtersSrc, /name="q"/);
});

test("Reset clears form locally without applying or closing", () => {
  assert.match(filtersSrc, /data-testid="smart-filter-reset"/);
  const handleResetFn =
    filtersSrc.match(/function handleReset\(\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(handleResetFn.length > 0);
  assert.doesNotMatch(handleResetFn, /onApply/);
  assert.doesNotMatch(handleResetFn, /onClose/);
});

test("header universal search opens Smart Filter modal from sliders on all routes", () => {
  assert.match(headerSrc, /setFiltersOpen\(true\)/);
  assert.match(headerSrc, /SearchContextFilters/);
  assert.match(headerSrc, /buildSmartFilterHref\(filters\)/);
  const slidersBlock =
    headerSrc.match(
      /onClick=\{\(e\) => \{[\s\S]*?setFiltersOpen\(true\)[\s\S]*?Open Smart Filter Engine/,
    )?.[0] ?? "";
  assert.ok(slidersBlock.length > 0);
  assert.doesNotMatch(slidersBlock, /openHomeMarketplaceFilters/);
});

test("smart filter submission builds URLs for property, land, and agents", () => {
  const property = buildSmartFilterHref({
    ...defaultSmartFilterState("property"),
    state: "Lagos",
    city: "Lekki",
    listing_type: "rent",
    property_type: "flat",
    beds: "3",
    min: "1000000",
    max: "5000000",
    q: "duplex",
  });
  assert.ok(property.startsWith("/search?"));
  const spProp = new URLSearchParams(property.split("?")[1]);
  assert.equal(spProp.get("type"), "rent");
  assert.equal(spProp.get("beds"), "3");
  assert.equal(spProp.get("q"), "duplex");

  const land = buildSmartFilterHref({
    ...defaultSmartFilterState("land"),
    state: "Ogun",
    property_type: "land",
  });
  assert.ok(land.includes("hub=land_sale"));

  const agent = buildSmartFilterHref({
    ...defaultSmartFilterState("agent"),
    role: "dealer",
    city: "Abuja",
  });
  assert.ok(agent.startsWith("/agents?"));
  assert.equal(new URLSearchParams(agent.split("?")[1]).get("role"), "dealer");
});
