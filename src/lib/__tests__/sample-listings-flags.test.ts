import assert from "node:assert/strict";
import test from "node:test";
import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";

test("sample fixtures respect explicit opt-out", () => {
  const prevFlag = process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "0";
  assert.equal(isSampleListingFixtureEnabled(), false);
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "1";
  assert.equal(isSampleListingFixtureEnabled(), true);
  if (prevFlag === undefined) delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  else process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = prevFlag;
});
