import { isStepUpPayoutsEnabled } from "@/lib/feature-flags";
import {
  parseSensitiveConfirmationToken,
  requireSensitiveConfirmation,
} from "@/lib/auth/require-sensitive-confirmation";
import { getDeviceIdForSession } from "@/lib/auth/trusted-device";

export async function requireSensitiveGate(
  body: Record<string, unknown>,
  userId: string,
  action: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (action === "change_payout_bank" && !isStepUpPayoutsEnabled()) {
    return { ok: true };
  }

  const deviceId = await getDeviceIdForSession();
  return requireSensitiveConfirmation(
    parseSensitiveConfirmationToken(body),
    userId,
    action,
    deviceId
  );
}
