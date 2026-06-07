import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashIp, hashUserAgent, logAuthSecurityEvent } from "./security-events";

export const DEVICE_COOKIE = "yike_device_token";
const DEVICE_MAX_AGE_DAYS = 90;

export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

function hashDeviceToken(token: string): string {
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

export async function isDeviceTrusted(
  userId: string,
  deviceToken: string | null
): Promise<boolean> {
  if (!deviceToken) return false;
  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("trusted_devices")
    .select("id")
    .eq("user_id", userId)
    .eq("device_token_hash", hashDeviceToken(deviceToken))
    .is("revoked_at", null)
    .maybeSingle();

  return Boolean(data);
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

  await admin.from("trusted_devices").upsert(
    {
      user_id: params.userId,
      device_token_hash: tokenHash,
      user_agent_hint: params.userAgent?.slice(0, 200) ?? null,
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
  deviceToken: string
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("trusted_devices")
    .update({ last_seen_at: new Date().toISOString() })
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
