import { NextResponse } from "next/server";
import {
  isPinLocked,
  recordPinFailure,
  resetPinFailures,
} from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  getAuthenticatedUserId,
  getRequestMeta,
  markSessionUnlocked,
} from "@/lib/auth/session-state";
import { getDeviceTokenFromCookies, touchTrustedDevice } from "@/lib/auth/trusted-device";
import { verifyPin } from "@/lib/pin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Unlock an existing session with PIN after soft idle lock. */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "");
  const { ip, userAgent } = await getRequestMeta(request);

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in again.", requiresFullLogin: true },
      { status: 401 }
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 6-digit PIN" }, { status: 400 });
  }

  if (await isPinLocked(userId)) {
    return NextResponse.json(
      { error: "Too many PIN attempts. Use your password instead.", pinLocked: true },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_hash")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.pin_hash || !verifyPin(pin, profile.pin_hash)) {
    const failure = await recordPinFailure(userId);
    await logAuthSecurityEvent({
      userId,
      eventType: failure.locked ? "pin.locked" : "pin.failed",
      ip,
      userAgent,
    });
    return NextResponse.json(
      {
        error: failure.locked
          ? "Too many PIN attempts. Use your password instead."
          : "Incorrect PIN. Try again or use your password.",
        pinLocked: failure.locked,
      },
      { status: 401 }
    );
  }

  await resetPinFailures(userId);
  await markSessionUnlocked(userId);

  const deviceToken = await getDeviceTokenFromCookies();
  if (deviceToken) {
    await touchTrustedDevice(userId, deviceToken);
  }

  await logAuthSecurityEvent({
    userId,
    eventType: "session.unlock",
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
