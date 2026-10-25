import test from "node:test";
import assert from "node:assert/strict";
import { shouldApplyPinAsyncResult } from "@/lib/auth/pin-login-client";

test("stale PIN submit responses are ignored", () => {
  assert.equal(shouldApplyPinAsyncResult(1, 2), false);
  assert.equal(shouldApplyPinAsyncResult(2, 2), true);
});
