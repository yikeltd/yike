import test from "node:test";
import assert from "node:assert/strict";

/** Mirrors PinLoginPanel preflight skip when PIN was already allowed this mount. */
export function shouldSkipPinPreflight(input: {
  pinAllowedCached: boolean;
  force?: boolean;
}): boolean {
  return input.pinAllowedCached && !input.force;
}

test("preflight skip avoids duplicate device checks until forced retry", () => {
  assert.equal(shouldSkipPinPreflight({ pinAllowedCached: true }), true);
  assert.equal(shouldSkipPinPreflight({ pinAllowedCached: true, force: true }), false);
  assert.equal(shouldSkipPinPreflight({ pinAllowedCached: false }), false);
});
