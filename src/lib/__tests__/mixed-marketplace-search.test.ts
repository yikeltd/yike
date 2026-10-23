import test from "node:test";
import assert from "node:assert/strict";
import { isMixedMarketplaceSearch } from "@/lib/search/marketplace-search-mode";
import { sampleMixedBrowse } from "@/lib/sample-listings/query-fixtures";

test("isMixedMarketplaceSearch detects marketplace=all", () => {
  assert.equal(isMixedMarketplaceSearch({ marketplace: "all" }), true);
  assert.equal(isMixedMarketplaceSearch({ marketplace: ["all"] }), true);
  assert.equal(isMixedMarketplaceSearch({}), false);
});

test("sampleMixedBrowse returns multiple asset types when fixtures enabled", () => {
  const prev = process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  try {
    const rows = sampleMixedBrowse({});
    const types = new Set(rows.map((r) => r.asset_type));
    assert.ok(types.has("PROPERTY"));
    assert.ok(types.has("VEHICLE"));
    assert.ok(types.has("ELECTRONICS"));
  } finally {
    if (prev === undefined) delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
    else process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = prev;
  }
});
