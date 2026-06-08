import { NextResponse } from "next/server";
import { AUTH_USER_MESSAGES } from "@/constants/auth-messages";
import { resolveLoginEmail } from "@/lib/auth/credential-lookup";
import {
  isPasswordRateLimited,
  recordLoginAttempt,
} from "@/lib/auth/pin-lockout";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import { beginUserSession, getRequestMeta } from "@/lib/auth/session-state";
import {
  ensureDeviceToken,
  getDeviceTokenFromCookies,
  isDeviceTrusted,
  registerTrustedDevice,
} from "@/lib/auth/trusted-device";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/copy/user-messages";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body.identifier ?? body.email ?? "").trim();
  const password = String(body.password ?? "");
  const { ip, userAgent } = await getRequestMeta(request);

  if (!identifier || password.length < 8) {
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.invalidLogin },
      { status: 400 }
    );
  }

  if (await isPasswordRateLimited(identifier, ip)) {
    return NextResponse.json(
      { error: "Too many tries. Wait a moment and try again." },
      { status: 429 }
    );
  }

  const email = await resolveLoginEmail(identifier);
  if (!email) {
    await recordLoginAttempt({ identifier, attemptType: "password", success: false, ip });
    await logAuthSecurityEvent({
      eventType: "login.failed",
      metadata: { reason: "unknown_identifier" },
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.invalidLogin },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await recordLoginAttempt({ identifier, attemptType: "password", success: false, ip });
    await logAuthSecurityEvent({
      userId: data?.user?.id,
      eventType: "login.failed",
      metadata: { reason: "bad_password" },
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: AUTH_USER_MESSAGES.invalidLogin },
      { status: 401 }
    );
  }

  await recordLoginAttempt({ identifier, attemptType: "password", success: true, ip });

  const reviewer = isReviewerAccountEmail(email);
  const needsEmailVerify = !data.user.email_confirmed_at && !reviewer;

  const deviceToken = (await getDeviceTokenFromCookies()) ?? (await ensureDeviceToken());
  const trusted = await isDeviceTrusted(data.user.id, deviceToken);

  if (!trusted) {
    await registerTrustedDevice({
      userId: data.user.id,
      deviceToken,
      userAgent,
      ip,
      isNewDevice: true,
    });
  } else {
    await registerTrustedDevice({
      userId: data.user.id,
      deviceToken,
      userAgent,
      ip,
      isNewDevice: false,
    });
  }

  await beginUserSession(data.user.id);

  await logAuthSecurityEvent({
    userId: data.user.id,
    eventType: "login.success",
    metadata: { method: "password", new_device: !trusted },
    ip,
    userAgent,
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, email, role, account_type, has_pin_set, pin_hash")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    needsEmailVerify,
    requiresPinSetup: Boolean(profile && !profile.has_pin_set && !profile.pin_hash),
    profile,
  });
}
