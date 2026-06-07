/**
 * Auth security unit checks — run: npx tsx scripts/test-auth-security.ts
 */
import assert from "node:assert/strict";
import {
  createSensitiveConfirmationToken,
  verifySensitiveConfirmationToken,
} from "../src/lib/auth/sensitive-token";
import { hashDeviceLockKey } from "../src/lib/auth/pin-lockout";
import { hashIpSubnet } from "../src/lib/auth/trusted-device";
import { hashPin, verifyPin } from "../src/lib/pin";

process.env.YIKE_PIN_PEPPER = "test-pepper-for-ci-only";
process.env.CRON_SECRET = "test-cron-secret-for-ci";

assert.equal(verifyPin("123456", hashPin("123456")), true);
assert.equal(verifyPin("000000", hashPin("123456")), false);

const deviceA = hashDeviceLockKey({ deviceToken: "token-a", ip: "1.2.3.4" });
const deviceB = hashDeviceLockKey({ deviceToken: "token-b", ip: "1.2.3.4" });
assert.notEqual(deviceA, deviceB, "different devices should have different lock keys");

const subnet1 = hashIpSubnet("102.89.12.45");
const subnet2 = hashIpSubnet("102.89.12.99");
assert.equal(subnet1, subnet2, "same /24 subnet should match");
const subnet3 = hashIpSubnet("102.89.13.45");
assert.notEqual(subnet1, subnet3, "different /24 subnets should differ");

const token = createSensitiveConfirmationToken("user-1", "change_payout_bank", "device-abc");
assert.ok(token);
assert.equal(
  verifySensitiveConfirmationToken(token!, "user-1", "change_payout_bank", "device-abc"),
  true
);
assert.equal(
  verifySensitiveConfirmationToken(token!, "user-1", "change_payout_bank", "other-device"),
  false
);

console.log("auth-security unit checks passed");
