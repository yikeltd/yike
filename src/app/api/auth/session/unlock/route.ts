import { NextResponse } from "next/server";
import {
  hashDeviceLockKey,
  isPinLockedForDevice,
  recordPinFailureForDevice,
  resetPinFailuresForUser,
} from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  getAuthenticatedUserId,
  getRequestMeta,
  markSessionUnlocked,
} from "@/lib/auth/session-state";
import { getDeviceTokenFromCookies, touchTrustedDevice } from "@/lib/auth/trusted-device";
import { verifyPin } from "@/lib/pin";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/copy/user-messages";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Unlock an existing session with PIN after soft idle lock. */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "");
  const { ip, userAgent } = await getRequestMeta(request);
  const deviceToken = await getDeviceTokenFromCookies();
  const deviceKey = hashDeviceLockKey({ deviceToken, ip, userAgent });

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in again.", requiresFullLogin: true },
      { status: 401, headers: { "X-Reauth": "full" } }
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 6-digit PIN" }, { status: 400 });
  }

  if (await isPinLockedForDevice(userId, deviceKey)) {
    return NextResponse.json(
      {
        error: "Too many PIN attempts on this device. Use your password instead.",
        pinLocked: true,
      },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.pin_hash || !verifyPin(pin, profile.pin_hash)) {
    const failure = await recordPinFailureForDevice(userId, deviceKey);
    await logAuthSecurityEvent({
      userId,
      eventType: failure.locked ? "pin.locked" : "pin.failed",
      metadata: { scope: "session_unlock", deviceScoped: true },
      ip,
      userAgent,
    });
    return NextResponse.json(
      {
        error: failure.locked
          ? "Too many PIN attempts on this device. Use your password instead."
          : "Incorrect PIN. Try again or use your password.",
        pinLocked: failure.locked,
      },
      { status: failure.locked ? 429 : 401 }
    );
  }

  await resetPinFailuresForUser(userId);
  await markSessionUnlocked(userId);

  if (deviceToken) {
    await touchTrustedDevice(userId, deviceToken, { userAgent, ip });
  }

  await logAuthSecurityEvent({
    userId,
    eventType: "session.unlock",
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
