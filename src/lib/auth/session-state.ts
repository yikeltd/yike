import { cookies } from "next/headers";
import { getSessionPolicy } from "@/lib/auth/session-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccountType, Profile, UserRole } from "@/types/database";
import { isDeviceTrusted } from "./trusted-device";
import { logAuthSecurityEvent } from "./security-events";

export const APP_UNLOCK_COOKIE = "yike_app_unlock";

export type SessionStatus = {
  authenticated: boolean;
  locked: boolean;
  requiresFullLogin: boolean;
  requiresPinSetup: boolean;
  hasPinSet: boolean;
  deviceTrusted: boolean;
  policy: ReturnType<typeof getSessionPolicy>;
  profile: Pick<
    Profile,
    "id" | "full_name" | "username" | "avatar_url" | "email" | "account_type" | "role"
  > | null;
};

function parseMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function getRequestMeta(request?: Request): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  if (!request) return { ip: null, userAgent: null };
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  return {
    ip: ip ?? null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function loadSessionProfile(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, email, account_type, role, pin_hash, has_pin_set, last_active_at, last_unlocked_at, session_started_at, session_locked_at, is_banned"
    )
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function evaluateSessionStatus(params: {
  userId: string;
  deviceToken?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<SessionStatus> {
  const profile = await loadSessionProfile(params.userId);
  if (!profile || profile.is_banned) {
    return {
      authenticated: false,
      locked: false,
      requiresFullLogin: true,
      requiresPinSetup: false,
      hasPinSet: false,
      deviceTrusted: false,
      policy: getSessionPolicy("individual", "user"),
      profile: null,
    };
  }

  const role = profile.role as UserRole;
  const accountType = (profile.account_type ?? "individual") as AccountType;
  const policy = getSessionPolicy(accountType, role);
  const hasPinSet = Boolean(profile.has_pin_set || profile.pin_hash);

  const now = Date.now();
  const lastActive = parseMs(profile.last_active_at) ?? parseMs(profile.last_unlocked_at);
  const lastUnlocked = parseMs(profile.last_unlocked_at);

  const deviceTrusted = await isDeviceTrusted(params.userId, params.deviceToken ?? null, {
    userAgent: params.userAgent,
    ip: params.ip,
  });

  if (
    lastActive &&
    now - lastActive > policy.fullLoginExpiryMs
  ) {
    return {
      authenticated: true,
      locked: false,
      requiresFullLogin: true,
      requiresPinSetup: false,
      hasPinSet,
      deviceTrusted,
      policy,
      profile,
    };
  }

  let locked = Boolean(profile.session_locked_at);

  if (policy.idleLockMs && lastUnlocked) {
    if (now - lastUnlocked > policy.idleLockMs) {
      locked = true;
    }
  } else if (policy.idleLockMs && lastActive) {
    if (now - lastActive > policy.idleLockMs) {
      locked = true;
    }
  }

  if (policy.accountClass === "staff" && policy.idleLockMs) {
    const idleRef = lastUnlocked ?? lastActive;
    if (idleRef && now - idleRef > policy.idleLockMs) {
      return {
        authenticated: true,
        locked: false,
        requiresFullLogin: true,
        requiresPinSetup: false,
        hasPinSet,
        deviceTrusted,
        policy,
        profile,
      };
    }
  }

  if (!deviceTrusted && policy.accountClass !== "staff") {
    locked = false;
  }

  return {
    authenticated: true,
    locked: locked && policy.pinUnlockEnabled && hasPinSet,
    requiresFullLogin: false,
    requiresPinSetup: !hasPinSet && policy.pinUnlockEnabled,
    hasPinSet,
    deviceTrusted,
    policy,
    profile,
  };
}

export async function markSessionUnlocked(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({
      last_unlocked_at: now,
      last_active_at: now,
      session_locked_at: null,
    })
    .eq("id", userId);

  const cookieStore = await cookies();
  cookieStore.set(APP_UNLOCK_COOKIE, now, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function markSessionLocked(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("profiles")
    .update({ session_locked_at: new Date().toISOString() })
    .eq("id", userId);

  await logAuthSecurityEvent({
    userId,
    eventType: "session.timeout",
  });
}

export async function touchSessionActivity(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function beginUserSession(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({
      session_started_at: now,
      last_login_at: now,
      last_active_at: now,
      last_unlocked_at: now,
      session_locked_at: null,
    })
    .eq("id", userId);
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
