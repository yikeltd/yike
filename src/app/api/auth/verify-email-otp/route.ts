import { NextResponse } from "next/server";
import { createAuthEmailOtpDbClient } from "@/lib/auth-email-otp/rpc";
import { parseAmbassadorRefFromCookieHeader } from "@/lib/ambassador/cookie";
import { verifyAuthEmailOtp } from "@/lib/auth-email-otp/service";
import { getRequestMeta, beginUserSession, markSessionUnlocked } from "@/lib/auth/session-state";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  ensureDeviceToken,
  isDeviceTrusted,
  registerTrustedDevice,
} from "@/lib/auth/trusted-device";
import {
  isAuthEmailOtpPurpose,
  type AuthEmailOtpPurpose,
} from "@/lib/auth-email-otp/types";
import { isEmailOtpEnabled } from "@/lib/feature-flags";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LoginProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
  account_type: string | null;
  has_pin_set: boolean;
};

type StoredLoginProfile = LoginProfile & {
  pin_hash: string | null;
};

function publicLoginProfile(profile: StoredLoginProfile | null): LoginProfile | null {
  if (!profile) return null;
  return {
    id: profile.id,
    full_name: profile.full_name,
    username: profile.username,
    avatar_url: profile.avatar_url,
    email: profile.email,
    role: profile.role,
    account_type: profile.account_type,
    has_pin_set: Boolean(profile.has_pin_set || profile.pin_hash),
  };
}

async function loadLoginProfile(userId: string): Promise<StoredLoginProfile | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url, email, role, account_type, has_pin_set, pin_hash"
      )
      .eq("id", userId)
      .maybeSingle();
    return (data as StoredLoginProfile | null) ?? null;
  } catch (error) {
    console.error("[auth/verify-email-otp] profile load failed", (error as Error).message);
    return null;
  }
}

async function resolveVerifiedUserId(
  request: Request,
  email: string,
  purpose: AuthEmailOtpPurpose,
  otpUserId?: string
): Promise<string | null> {
  if (purpose === "signup" && otpUserId) return otpUserId;
  if (purpose !== "login" && purpose !== "email_verify") return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) return null;
  if (user.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    await logAuthSecurityEvent({
      userId: user.id,
      eventType: "login.failed",
      metadata: { reason: "otp_email_mismatch", purpose },
      ...(await getRequestMeta(request)),
    });
    return null;
  }

  return user.id;
}

async function trustVerifiedDevice(
  request: Request,
  userId: string,
  purpose: AuthEmailOtpPurpose
) {
  const { ip, userAgent } = await getRequestMeta(request);
  const deviceToken = await ensureDeviceToken();
  const trusted = await isDeviceTrusted(userId, deviceToken, { userAgent, ip });

  await registerTrustedDevice({
    userId,
    deviceToken,
    userAgent,
    ip,
    isNewDevice: !trusted,
  });
  await beginUserSession(userId);
  await markSessionUnlocked(userId);
  await logAuthSecurityEvent({
    userId,
    eventType: purpose === "signup" ? "signup.device_trusted" : "login.otp_verified",
    metadata: { purpose, new_device: !trusted },
    ip,
    userAgent,
  });

  const profile = await loadLoginProfile(userId);
  const publicProfile = publicLoginProfile(profile);
  return {
    profile: publicProfile,
    deviceTrusted: true,
    requiresPinSetup: Boolean(publicProfile && !publicProfile.has_pin_set),
  };
}

export async function POST(request: Request) {
  if (!isEmailOtpEnabled()) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const db = createAuthEmailOtpDbClient();
  if (!db) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.unavailable },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    otp?: string;
    code?: string;
    purpose?: string;
    password?: string;
  };

  const email = String(body.email ?? "").trim();
  const code = String(body.otp ?? body.code ?? "").trim();
  const purposeRaw = String(body.purpose ?? "signup").trim();
  const purpose: AuthEmailOtpPurpose = isAuthEmailOtpPurpose(purposeRaw)
    ? purposeRaw
    : "email_verify";

  if (!email || code.length !== 6) {
    return NextResponse.json(
      { error: EMAIL_OTP_USER_MESSAGES.incorrect },
      { status: 400 }
    );
  }

  const referralCode = parseAmbassadorRefFromCookieHeader(request.headers.get("cookie"));

  const result = await verifyAuthEmailOtp(db, {
    email,
    code,
    purpose,
    password: body.password,
    referralCode,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let deviceResult:
    | Awaited<ReturnType<typeof trustVerifiedDevice>>
    | { profile: null; deviceTrusted: false; requiresPinSetup: false } = {
    profile: null,
    deviceTrusted: false,
    requiresPinSetup: false,
  };

  const verifiedUserId = await resolveVerifiedUserId(
    request,
    email,
    purpose,
    result.userId
  );
  if (verifiedUserId) {
    deviceResult = await trustVerifiedDevice(request, verifiedUserId, purpose);
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    userId: result.userId,
    ...deviceResult,
  });
}
