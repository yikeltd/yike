import test from "node:test";
import assert from "node:assert/strict";
import {
  messageForAuthFailureKind,
  shouldApplyAsyncResult,
} from "@/lib/auth/auth-fetch";

test("shouldApplyAsyncResult rejects stale generations", () => {
  assert.equal(shouldApplyAsyncResult(1, 1), true);
  assert.equal(shouldApplyAsyncResult(1, 2), false);
});

test("messageForAuthFailureKind maps timeout and network", () => {
  assert.match(messageForAuthFailureKind("timeout", "x"), /too long/i);
  assert.match(messageForAuthFailureKind("network", "x"), /could not reach/i);
  assert.equal(messageForAuthFailureKind("auth", "Bad PIN"), "Bad PIN");
});
