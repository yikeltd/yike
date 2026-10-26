import assert from "node:assert/strict";
import test from "node:test";

test("sample fixtures default on in test env unless explicitly disabled", async () => {
  const prevNode = process.env.NODE_ENV;
  const prevFlag = process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  process.env.NODE_ENV = "test";
  delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  const { isSampleListingFixtureEnabled } = await import(
    "@/lib/sample-listings/flags"
  );
  assert.equal(isSampleListingFixtureEnabled(), true);
  process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = "0";
  const mod2 = await import("@/lib/sample-listings/flags");
  assert.equal(mod2.isSampleListingFixtureEnabled(), false);
  process.env.NODE_ENV = prevNode;
  if (prevFlag === undefined) delete process.env.YIKE_SAMPLE_LISTINGS_FIXTURE;
  else process.env.YIKE_SAMPLE_LISTINGS_FIXTURE = prevFlag;
});
