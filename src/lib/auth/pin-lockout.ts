import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashIdentifier, hashIp } from "./security-events";

const MAX_PIN_FAILURES = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const MAX_PASSWORD_ATTEMPTS = 10;
const PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export function hashDeviceLockKey(params: {
  deviceToken?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): string {
  if (params.deviceToken) {
    return createHash("sha256").update(params.deviceToken).digest("hex");
  }
  const fallback = `${params.ip ?? ""}:${params.userAgent ?? ""}`;
  return createHash("sha256").update(fallback).digest("hex");
}

export async function recordLoginAttempt(params: {
  identifier: string;
  attemptType: "password" | "pin";
  success: boolean;
  ip?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("auth_login_attempts").insert({
    identifier_hash: hashIdentifier(params.identifier),
    attempt_type: params.attemptType,
    success: params.success,
    ip_hash: hashIp(params.ip ?? null),
  });
}

export async function isPasswordRateLimited(
  identifier: string,
  ip?: string | null
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const since = new Date(Date.now() - PASSWORD_WINDOW_MS).toISOString();
  const idHash = hashIdentifier(identifier);

  const { count } = await admin
    .from("auth_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("identifier_hash", idHash)
    .eq("attempt_type", "password")
    .eq("success", false)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_PASSWORD_ATTEMPTS) return true;

  if (ip) {
    const ipHash = hashIp(ip);
    const { count: ipCount } = await admin
      .from("auth_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("attempt_type", "password")
      .eq("success", false)
      .gte("created_at", since);

    if ((ipCount ?? 0) >= MAX_PASSWORD_ATTEMPTS * 2) return true;
  }

  return false;
}

/** Per-device PIN lock — does not lock other devices for the same user. */
export async function isPinLockedForDevice(
  userId: string,
  deviceKeyHash: string
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("pin_device_lockouts")
    .select("locked_until")
    .eq("user_id", userId)
    .eq("device_key_hash", deviceKeyHash)
    .maybeSingle();

  if (!data?.locked_until) return false;
  return new Date(data.locked_until) > new Date();
}

export async function recordPinFailureForDevice(
  userId: string,
  deviceKeyHash: string
): Promise<{ locked: boolean; attempts: number }> {
  const admin = createAdminClient();
  if (!admin) return { locked: false, attempts: 0 };

  const { data } = await admin
    .from("pin_device_lockouts")
    .select("failed_attempts")
    .eq("user_id", userId)
    .eq("device_key_hash", deviceKeyHash)
    .maybeSingle();

  const attempts = (data?.failed_attempts ?? 0) + 1;
  const locked = attempts >= MAX_PIN_FAILURES;
  const lockedUntil = locked
    ? new Date(Date.now() + PIN_LOCK_MS).toISOString()
    : null;
  const now = new Date().toISOString();

  await admin.from("pin_device_lockouts").upsert(
    {
      user_id: userId,
      device_key_hash: deviceKeyHash,
      failed_attempts: attempts,
      locked_until: lockedUntil,
      updated_at: now,
    },
    { onConflict: "user_id,device_key_hash" }
  );

  return { locked, attempts };
}

export async function resetPinFailuresForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("pin_device_lockouts").delete().eq("user_id", userId);

  await admin
    .from("profiles")
    .update({
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq("id", userId);
}

/** @deprecated use isPinLockedForDevice */
export async function isPinLocked(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { data } = await admin
    .from("profiles")
    .select("pin_locked_until")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.pin_locked_until) return false;
  return new Date(data.pin_locked_until) > new Date();
}

/** @deprecated use recordPinFailureForDevice */
export async function recordPinFailure(userId: string): Promise<{
  locked: boolean;
  attempts: number;
}> {
  return recordPinFailureForDevice(userId, hashDeviceLockKey({}));
}

/** @deprecated use resetPinFailuresForUser */
export async function resetPinFailures(userId: string): Promise<void> {
  return resetPinFailuresForUser(userId);
}
