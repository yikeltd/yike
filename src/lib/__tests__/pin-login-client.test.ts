import test from "node:test";
import assert from "node:assert/strict";
import {
  messageForPinFailureKind,
  shouldApplyPinAsyncResult,
} from "@/lib/auth/pin-login-client";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";

test("shouldApplyPinAsyncResult rejects stale generations", () => {
  assert.equal(shouldApplyPinAsyncResult(1, 2), false);
  assert.equal(shouldApplyPinAsyncResult(3, 3), true);
});

test("messageForPinFailureKind ignores aborted kind for user copy", () => {
  assert.equal(messageForPinFailureKind("aborted" as never), AUTH_USER_MESSAGES.pinDeviceCheckFailed);
});

test("messageForPinFailureKind maps timeout and network distinctly", () => {
  assert.match(messageForPinFailureKind("timeout"), /too long/i);
  assert.match(messageForPinFailureKind("network"), /could not reach/i);
  assert.notEqual(messageForPinFailureKind("timeout"), messageForPinFailureKind("network"));
  assert.equal(messageForPinFailureKind("rate_limit"), AUTH_USER_MESSAGES.pinLocked);
});
