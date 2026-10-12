import assert from "node:assert/strict";
import test from "node:test";
import { canUseEmptyInventoryFixtures } from "@/lib/demo-ui-fixtures";
import { assertCanCreateListing } from "@/lib/seller-trust";

const originalNodeEnv = process.env.NODE_ENV;
const originalAppEnv = process.env.APP_ENV;
const originalFixtures = process.env.YIKE_EMPTY_INVENTORY_FIXTURES;

function eligibleSeller(overrides: Record<string, unknown> = {}) {
  return {
    role: "agent_verified",
    email_verified: true,
    phone_verified: true,
    is_banned: false,
    verification_status: "approved",
    seller_profile_completed_at: "2026-10-01T00:00:00.000Z",
    ...overrides,
  } as never;
}

test.after(() => {
  Object.assign(process.env, { NODE_ENV: originalNodeEnv });
  if (originalAppEnv === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = originalAppEnv;
  if (originalFixtures === undefined) delete process.env.YIKE_EMPTY_INVENTORY_FIXTURES;
  else process.env.YIKE_EMPTY_INVENTORY_FIXTURES = originalFixtures;
});

test("production never enables empty-inventory fixtures", () => {
  Object.assign(process.env, { NODE_ENV: "production", APP_ENV: "production" });
  process.env.YIKE_EMPTY_INVENTORY_FIXTURES = "1";
  assert.equal(canUseEmptyInventoryFixtures(), false);
});

test("fixtures require an explicit non-production opt-in", () => {
  Object.assign(process.env, { NODE_ENV: "test", APP_ENV: "test" });
  delete process.env.YIKE_EMPTY_INVENTORY_FIXTURES;
  assert.equal(canUseEmptyInventoryFixtures(), false);
  process.env.YIKE_EMPTY_INVENTORY_FIXTURES = "1";
  assert.equal(canUseEmptyInventoryFixtures(), true);
});

test("seller gate rejects banned and incomplete sellers", () => {
  assert.equal(assertCanCreateListing(eligibleSeller({ is_banned: true })).ok, false);
  assert.equal(assertCanCreateListing(eligibleSeller({ phone_verified: false })).ok, false);
  assert.equal(
    assertCanCreateListing(eligibleSeller({ seller_profile_completed_at: null })).ok,
    false,
  );
});

test("seller gate allows an eligible verified seller", () => {
  assert.equal(assertCanCreateListing(eligibleSeller()).ok, true);
});
