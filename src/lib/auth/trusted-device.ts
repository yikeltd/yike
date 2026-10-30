import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrictDeviceBindingEnabled } from "@/lib/feature-flags";
import { hashIpSubnet } from "./ip-subnet";
import { hashIp, hashUserAgent, logAuthSecurityEvent } from "./security-events";
import {
  DEVICE_TRUST_MAX_AGE_DAYS,
  isDeviceTrustExpired,
} from "./trusted-device-policy";

export { hashIpSubnet };
export {
  DEVICE_TRUST_MAX_AGE_DAYS,
  DEVICE_TRUST_MAX_AGE_MS,
  isDeviceTrustExpired,
} from "./trusted-device-policy";

export const DEVICE_COOKIE = "yike_device_token";
const DEVICE_MAX_AGE_DAYS = DEVICE_TRUST_MAX_AGE_DAYS;

export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getDeviceTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DEVICE_COOKIE)?.value ?? null;
}

export async function setDeviceCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

type TrustedDeviceRow = {
  id: string;
  trusted_at: string;
  user_agent_hash: string | null;
  ip_subnet_hash: string | null;
};

async function loadTrustedDeviceRow(
  userId: string,
  deviceToken: string
): Promise<TrustedDeviceRow | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("trusted_devices")
    .select("id, trusted_at, user_agent_hash, ip_subnet_hash")
    .eq("user_id", userId)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .is("revoked_at", null)
    .maybeSingle();

  if (!data) return null;

  if (isDeviceTrustExpired(data.trusted_at)) {
    await admin
      .from("trusted_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    await logAuthSecurityEvent({
      userId,
      eventType: "device.revoked",
      metadata: { reason: "trust_expired" },
    });
    return null;
  }

  return data;
}

export async function isDeviceTrusted(
  userId: string,
  deviceToken: string | null,
  context?: { userAgent?: string | null; ip?: string | null }
): Promise<boolean> {
  if (!deviceToken) return false;

  const row = await loadTrustedDeviceRow(userId, deviceToken);
  if (!row) return false;

  if (!isStrictDeviceBindingEnabled()) return true;

  const currentUaHash = hashUserAgent(context?.userAgent ?? null);
  if (
    row.user_agent_hash &&
    currentUaHash &&
    row.user_agent_hash !== currentUaHash
  ) {
    await logAuthSecurityEvent({
      userId,
      eventType: "device.suspicious",
      metadata: { reason: "user_agent_changed" },
      ip: context?.ip,
      userAgent: context?.userAgent,
    });
    return false;
  }

  return true;
}

export async function registerTrustedDevice(params: {
  userId: string;
  deviceToken: string;
  userAgent?: string | null;
  ip?: string | null;
  isNewDevice?: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const tokenHash = hashDeviceToken(params.deviceToken);
  const now = new Date().toISOString();
  const uaHash = hashUserAgent(params.userAgent ?? null);
  const ipSubnetHash = hashIpSubnet(params.ip ?? null);

  const existing = await loadTrustedDeviceRow(params.userId, params.deviceToken);

  if (existing && !params.isNewDevice) {
    await touchTrustedDevice(params.userId, params.deviceToken, {
      userAgent: params.userAgent,
      ip: params.ip,
    });
    await setDeviceCookie(params.deviceToken);
    await logAuthSecurityEvent({
      userId: params.userId,
      eventType: "device.trusted",
      ip: params.ip,
      userAgent: params.userAgent,
    });
    return;
  }

  await admin.from("trusted_devices").upsert(
    {
      user_id: params.userId,
      device_token_hash: tokenHash,
      user_agent_hint: params.userAgent?.slice(0, 200) ?? null,
      user_agent_hash: uaHash,
      ip_subnet_hash: ipSubnetHash,
      last_seen_at: now,
      trusted_at: now,
      revoked_at: null,
    },
    { onConflict: "user_id,device_token_hash" }
  );

  await setDeviceCookie(params.deviceToken);

  await logAuthSecurityEvent({
    userId: params.userId,
    eventType: params.isNewDevice ? "device.new" : "device.trusted",
    ip: params.ip,
    userAgent: params.userAgent,
  });
}

export async function touchTrustedDevice(
  userId: string,
  deviceToken: string,
  context?: { userAgent?: string | null; ip?: string | null }
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const updates: Record<string, string> = {
    last_seen_at: new Date().toISOString(),
  };

  const uaHash = hashUserAgent(context?.userAgent ?? null);
  const ipSubnetHash = hashIpSubnet(context?.ip ?? null);
  if (uaHash) updates.user_agent_hash = uaHash;
  if (ipSubnetHash) updates.ip_subnet_hash = ipSubnetHash;

  await admin
    .from("trusted_devices")
    .update(updates)
    .eq("user_id", userId)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .is("revoked_at", null);
}

export async function ensureDeviceToken(): Promise<string> {
  const existing = await getDeviceTokenFromCookies();
  if (existing) return existing;
  const token = generateDeviceToken();
  await setDeviceCookie(token);
  return token;
}

export async function getDeviceIdForSession(): Promise<string | null> {
  const token = await getDeviceTokenFromCookies();
  return token ? hashDeviceToken(token) : null;
}

/** Full sign-out with revokeDevice — invalidates server-side trust for this device token. */
export async function revokeTrustedDeviceForToken(
  userId: string,
  deviceToken: string
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const now = new Date().toISOString();
  await admin
    .from("trusted_devices")
    .update({ revoked_at: now })
    .eq("user_id", userId)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .is("revoked_at", null);

  await logAuthSecurityEvent({
    userId,
    eventType: "device.revoked",
    metadata: { reason: "user_logout_revoke" },
  });
}
