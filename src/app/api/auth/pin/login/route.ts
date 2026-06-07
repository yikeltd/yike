import { NextResponse } from "next/server";
import { lookupPinLoginUser } from "@/lib/auth/pin-login-rpc";
import {
  isPinLocked,
  recordPinFailure,
  resetPinFailures,
} from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { beginUserSession, getRequestMeta, markSessionUnlocked } from "@/lib/auth/session-state";
import { getDeviceTokenFromCookies, registerTrustedDevice, touchTrustedDevice } from "@/lib/auth/trusted-device";
import { verifyPin } from "@/lib/pin";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body.identifier ?? body.email ?? "").trim();
  const pin = String(body.pin ?? "");
  const { ip, userAgent } = await getRequestMeta(request);

  if (!identifier || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "Enter your 6-digit PIN" }, { status: 400 });
  }

  const row = await lookupPinLoginUser(identifier);
  if (!row || !verifyPin(pin, row.pin_hash)) {
    if (row?.user_id) {
      const failure = await recordPinFailure(row.user_id);
      await logAuthSecurityEvent({
        userId: row.user_id,
        eventType: failure.locked ? "pin.locked" : "pin.failed",
        ip,
        userAgent,
      });
    }
    return NextResponse.json(
      { error: "Incorrect PIN. Try again or use your password." },
      { status: 401 }
    );
  }

  if (await isPinLocked(row.user_id)) {
    return NextResponse.json(
      { error: "Too many PIN attempts. Use your password instead.", pinLocked: true },
      { status: 429 }
    );
  }

  const admin = await createVerifiedAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Quick sign-in is temporarily unavailable. Use your password instead." },
      { status: 503 }
    );
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: row.email,
  });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    return NextResponse.json(
      { error: "Could not sign in. Use your password instead." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  }

  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (otpError) {
    return NextResponse.json(
      { error: "Could not sign in. Use your password instead." },
      { status: 500 }
    );
  }

  await resetPinFailures(row.user_id);
  await beginUserSession(row.user_id);
  await markSessionUnlocked(row.user_id);

  const deviceToken = await getDeviceTokenFromCookies();
  if (deviceToken) {
    await registerTrustedDevice({
      userId: row.user_id,
      deviceToken,
      userAgent,
      ip,
    });
    await touchTrustedDevice(row.user_id, deviceToken);
  }

  await logAuthSecurityEvent({
    userId: row.user_id,
    eventType: "pin.success",
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    profile: {
      id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      username: row.username,
      avatar_url: row.avatar_url,
    },
  });
}
