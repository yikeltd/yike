import test from "node:test";
import assert from "node:assert/strict";
import { computePinLoginGate } from "@/lib/auth/pin-login-gate.logic";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";

test("computePinLoginGate allows PIN only on trusted device without lockout", () => {
  const gate = computePinLoginGate({
    hasPinUser: true,
    deviceTrusted: true,
    pinLocked: false,
  });
  assert.equal(gate.canUsePin, true);
  assert.equal(gate.step, "pin");
});

test("computePinLoginGate blocks PIN on new device before entry", () => {
  const gate = computePinLoginGate({
    hasPinUser: true,
    deviceTrusted: false,
    pinLocked: false,
  });
  assert.equal(gate.canUsePin, false);
  assert.equal(gate.step, "password");
  assert.equal(gate.reason, "new_device");
  assert.equal(gate.message, AUTH_USER_MESSAGES.newDevicePinBlocked);
});

test("computePinLoginGate routes pin lockout to password step", () => {
  const gate = computePinLoginGate({
    hasPinUser: true,
    deviceTrusted: true,
    pinLocked: true,
  });
  assert.equal(gate.canUsePin, false);
  assert.equal(gate.reason, "pin_locked");
  assert.equal(gate.pinLocked, true);
});

test("computePinLoginGate treats missing pin user as password step", () => {
  const gate = computePinLoginGate({
    hasPinUser: false,
    deviceTrusted: false,
    pinLocked: false,
  });
  assert.equal(gate.step, "password");
  assert.equal(gate.canUsePin, false);
});
