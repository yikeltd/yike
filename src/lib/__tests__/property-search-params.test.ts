import test from "node:test";
import assert from "node:assert/strict";
import { parseSearchParams } from "@/lib/property-search";

test("parseSearchParams accepts min/max and min_price/max_price aliases", () => {
  assert.deepEqual(parseSearchParams({ min: "1000000", max: "5000000" }), {
    listing_type: undefined,
    state: undefined,
    city: undefined,
    area: undefined,
    min_price: 1_000_000,
    max_price: 5_000_000,
    bedrooms: undefined,
    bathrooms: undefined,
    property_type: undefined,
    q: undefined,
    featured: false,
    verified_only: false,
    hub: undefined,
    amenity: undefined,
  });

  assert.equal(
    parseSearchParams({ min_price: "3000000" }).min_price,
    3_000_000,
  );
  assert.equal(parseSearchParams({ max_price: "9000000" }).max_price, 9_000_000);
});
