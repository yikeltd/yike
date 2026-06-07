import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStrictDeviceBindingEnabled } from "@/lib/feature-flags";
import { hashIp, hashUserAgent, logAuthSecurityEvent } from "./security-events";

export const DEVICE_COOKIE = "yike_device_token";
const DEVICE_MAX_AGE_DAYS = 90;

export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Coarse subnet — mobile IP changes within subnet should not revoke trust. */
export function hashIpSubnet(ip: string | null): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    return createHash("sha256")
      .update(parts.slice(0, 4).join(":"))
      .digest("hex")
      .slice(0, 32);
  }
  const octets = trimmed.split(".");
  if (octets.length < 3) return hashIp(trimmed);
  return createHash("sha256")
    .update(octets.slice(0, 3).join("."))
    .digest("hex")
    .slice(0, 32);
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
    .select("id, user_agent_hash, ip_subnet_hash")
    .eq("user_id", userId)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .is("revoked_at", null)
    .maybeSingle();

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
