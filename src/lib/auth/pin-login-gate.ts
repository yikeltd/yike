import { hashDeviceLockKey } from "@/lib/auth/device-lock-key";
import { lookupPinLoginUser } from "@/lib/auth/pin-login-rpc";
import { isPinLockedForDevice } from "@/lib/auth/pin-lockout";
import { isDeviceTrusted } from "@/lib/auth/trusted-device";
import type { PinLoginGateResult } from "@/lib/auth/pin-login-gate.types";
import { computePinLoginGate } from "@/lib/auth/pin-login-gate.logic";

export type { PinLoginGateReason, PinLoginGateResult, PinLoginGateStep } from "@/lib/auth/pin-login-gate.types";
export { computePinLoginGate, pinLoginGateToJson } from "@/lib/auth/pin-login-gate.logic";

export async function evaluatePinLoginGate(params: {
  identifier: string;
  deviceToken: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<
  PinLoginGateResult & {
    userId: string | null;
  }
> {
  const row = await lookupPinLoginUser(params.identifier);
  if (!row) {
    return {
      ...computePinLoginGate({
        hasPinUser: false,
        deviceTrusted: false,
        pinLocked: false,
      }),
      userId: null,
    };
  }

  const deviceKey = hashDeviceLockKey({
    deviceToken: params.deviceToken,
    ip: params.ip,
    userAgent: params.userAgent,
  });

  const trustContext = {
    userAgent: params.userAgent,
    ip: params.ip,
  };

  const [trustedRow, pinLocked] = await Promise.all([
    params.deviceToken
      ? isDeviceTrusted(row.user_id, params.deviceToken, trustContext)
      : Promise.resolve(false),
    isPinLockedForDevice(row.user_id, deviceKey),
  ]);

  const deviceTrusted = Boolean(trustedRow);

  return {
    ...computePinLoginGate({
      hasPinUser: true,
      deviceTrusted,
      pinLocked,
    }),
    userId: row.user_id,
  };
}
