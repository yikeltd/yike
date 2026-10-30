import test from "node:test";
import assert from "node:assert/strict";
import {
  emailOtpResendLabel,
  mapSignupDuplicateResponse,
  resolveEmailOtpDispatchPresentation,
  resolveEmailOtpSendFailure,
  resolveEmailOtpVerifyFailure,
  shouldAutoSendEmailOtpOnOpen,
} from "@/lib/auth/email-otp-flow";

test("resolveEmailOtpDispatchPresentation does not claim inbox for dev_console", () => {
  const dev = resolveEmailOtpDispatchPresentation("dev_console");
  assert.equal(dev.showInboxInstructions, false);
  assert.match(dev.infoMessage, /npm run dev/i);

  const prod = resolveEmailOtpDispatchPresentation("provider_accepted");
  assert.equal(prod.showInboxInstructions, true);
  assert.match(prod.infoMessage, /sent/i);
});

test("shouldAutoSendEmailOtpOnOpen sends once per open session", () => {
  assert.equal(
    shouldAutoSendEmailOtpOnOpen({
      autoSend: true,
      initialCodeSent: false,
      openSessionId: 2,
      lastSentOpenSessionId: 1,
    }),
    true
  );
  assert.equal(
    shouldAutoSendEmailOtpOnOpen({
      autoSend: true,
      initialCodeSent: false,
      openSessionId: 2,
      lastSentOpenSessionId: 2,
    }),
    false
  );
  assert.equal(
    shouldAutoSendEmailOtpOnOpen({
      autoSend: false,
      initialCodeSent: false,
      openSessionId: 2,
      lastSentOpenSessionId: 1,
    }),
    false
  );
  assert.equal(
    shouldAutoSendEmailOtpOnOpen({
      autoSend: true,
      initialCodeSent: true,
      openSessionId: 2,
      lastSentOpenSessionId: 1,
    }),
    false
  );
});

test("resolveEmailOtpSendFailure applies server retryAfterSec on resend cooldown", () => {
  const resolved = resolveEmailOtpSendFailure({
    kind: "rate_limit",
    status: 429,
    message: "Please wait",
    data: { retryAfterSec: 42, limitReason: "resend_cooldown" },
  });
  assert.equal(resolved.resendCooldownSec, 42);
  assert.equal(resolved.treatAsCodeSent, true);
  assert.equal(resolved.isHourlyCap, false);
  assert.match(resolved.userMessage, /42s/);
});

test("resolveEmailOtpSendFailure treats hourly cap without countdown trap", () => {
  const resolved = resolveEmailOtpSendFailure({
    kind: "rate_limit",
    status: 429,
    message: "You've requested several codes",
    data: { limitReason: "hourly_email" },
  });
  assert.equal(resolved.isHourlyCap, true);
  assert.equal(resolved.resendCooldownSec, 0);
  assert.equal(resolved.treatAsCodeSent, true);
});

test("resolveEmailOtpVerifyFailure suggests resend on expired code", () => {
  const resolved = resolveEmailOtpVerifyFailure("This code has expired. Please request a new one.");
  assert.equal(resolved.suggestResend, true);
});

test("emailOtpResendLabel shows countdown", () => {
  assert.match(
    emailOtpResendLabel({ sending: false, cooldownSec: 12, hourlyCap: false }),
    /12s/
  );
});

test("mapSignupDuplicateResponse maps exists flags and null", () => {
  assert.deepEqual(mapSignupDuplicateResponse(null), {
    emailError: "",
    phoneError: "",
    unavailable: true,
  });
  assert.deepEqual(
    mapSignupDuplicateResponse({ emailExists: true, phoneExists: false }),
    {
      emailError: "Email already in use",
      phoneError: "",
      unavailable: false,
    }
  );
});
