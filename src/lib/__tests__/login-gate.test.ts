import test from "node:test";
import assert from "node:assert/strict";
import { resolvePasswordLoginSteps } from "@/lib/auth/login-gate";

test("verified email on trusted device skips OTP steps", () => {
  const steps = resolvePasswordLoginSteps({
    emailVerified: true,
    deviceTrusted: true,
    isReviewer: false,
  });
  assert.equal(steps.needsEmailVerify, false);
  assert.equal(steps.needsLoginOtp, false);
  assert.equal(steps.requiresPinSetupEligible, true);
});

test("verified email on untrusted device requires login OTP only", () => {
  const steps = resolvePasswordLoginSteps({
    emailVerified: true,
    deviceTrusted: false,
    isReviewer: false,
  });
  assert.equal(steps.needsEmailVerify, false);
  assert.equal(steps.needsLoginOtp, true);
});

test("unverified email requires verify before device OTP", () => {
  const steps = resolvePasswordLoginSteps({
    emailVerified: false,
    deviceTrusted: false,
    isReviewer: false,
  });
  assert.equal(steps.needsEmailVerify, true);
  assert.equal(steps.needsLoginOtp, false);
});
