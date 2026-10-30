import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import type { PinLoginGateResult } from "@/lib/auth/pin-login-gate.types";

/** Pure gate from server-known facts — safe for unit tests without server imports. */
export function computePinLoginGate(input: {
  hasPinUser: boolean;
  deviceTrusted: boolean;
  pinLocked: boolean;
}): PinLoginGateResult {
  if (!input.hasPinUser) {
    return {
      step: "password",
      canUsePin: false,
      reason: "not_eligible",
      message: AUTH_USER_MESSAGES.newDevicePinBlocked,
    };
  }

  if (!input.deviceTrusted) {
    return {
      step: "password",
      canUsePin: false,
      reason: "new_device",
      message: AUTH_USER_MESSAGES.newDevicePinBlocked,
    };
  }

  if (input.pinLocked) {
    return {
      step: "password",
      canUsePin: false,
      reason: "pin_locked",
      pinLocked: true,
      message: AUTH_USER_MESSAGES.pinLocked,
    };
  }

  return {
    step: "pin",
    canUsePin: true,
    message: AUTH_USER_MESSAGES.pinPrompt,
  };
}

export function pinLoginGateToJson(gate: PinLoginGateResult) {
  return {
    canUsePin: gate.canUsePin,
    step: gate.step,
    reason: gate.reason,
    pinLocked: gate.pinLocked,
    message: gate.message,
  };
}
