import { NextResponse } from "next/server";
import { getSessionPolicy } from "@/lib/auth/session-policy";
import {
  evaluateSessionStatus,
  getAuthenticatedUserId,
  getRequestMeta,
} from "@/lib/auth/session-state";
import {
  getDeviceTokenFromCookies,
  hashDeviceToken,
} from "@/lib/auth/trusted-device";
import type { AccountType, UserRole } from "@/types/database";

export type SessionEnforcementResult =
  | { ok: true; userId: string; deviceId: string | null }
  | { ok: false; response: NextResponse };

function reauthResponse(
  status: 401 | 423,
  reauth: "PIN" | "full",
  message: string
): NextResponse {
  return NextResponse.json(
    { error: message, requiresReauth: reauth },
    {
      status,
      headers: { "X-Reauth": reauth },
    }
  );
}

/**
 * Server-side idle / lock enforcement for trust-role and staff API routes.
 * Consumers are not idle-locked unless explicitly required.
 */
export async function enforceActiveSession(
  request: Request,
  options?: { requireTrustOrStaff?: boolean }
): Promise<SessionEnforcementResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return {
      ok: false,
      response: reauthResponse(401, "full", "Please sign in again."),
    };
  }

  const deviceToken = await getDeviceTokenFromCookies();
  const { ip, userAgent } = await getRequestMeta(request);
  const status = await evaluateSessionStatus({
    userId,
    deviceToken,
    userAgent,
    ip,
  });

  if (!status.authenticated || !status.profile) {
    return {
      ok: false,
      response: reauthResponse(401, "full", "Please sign in again."),
    };
  }

  const policy = status.policy;

  if (options?.requireTrustOrStaff && policy.accountClass === "consumer") {
    return { ok: true, userId, deviceId: deviceToken ? hashDeviceToken(deviceToken) : null };
  }

  if (status.requiresFullLogin) {
    return {
      ok: false,
      response: reauthResponse(
        401,
        "full",
        "Session expired. Sign in with your password."
      ),
    };
  }

  if (status.locked) {
    return {
      ok: false,
      response: reauthResponse(
        423,
        "PIN",
        "Unlock with your PIN to continue."
      ),
    };
  }

  if (
    policy.accountClass === "staff" &&
    policy.idleLockMs &&
    !policy.pinUnlockEnabled
  ) {
    const role = status.profile.role as UserRole;
    const accountType = (status.profile.account_type ?? "individual") as AccountType;
    const staffPolicy = getSessionPolicy(accountType, role);
    if (staffPolicy.idleLockMs) {
      /* staff idle handled via requiresFullLogin path in evaluateSessionStatus when extended */
    }
  }

  return {
    ok: true,
    userId,
    deviceId: deviceToken ? hashDeviceToken(deviceToken) : null,
  };
}
