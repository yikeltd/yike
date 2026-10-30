import test from "node:test";
import assert from "node:assert/strict";
import {
  DEVICE_TRUST_MAX_AGE_MS,
  isDeviceTrustExpired,
} from "@/lib/auth/trusted-device-policy";

test("isDeviceTrustExpired respects 90-day window", () => {
  const fresh = new Date(Date.now() - DEVICE_TRUST_MAX_AGE_MS + 60_000).toISOString();
  const stale = new Date(Date.now() - DEVICE_TRUST_MAX_AGE_MS - 1_000).toISOString();
  assert.equal(isDeviceTrustExpired(fresh), false);
  assert.equal(isDeviceTrustExpired(stale), true);
});
