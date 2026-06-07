import { createAdminClient } from "@/lib/supabase/admin";
import { hashIdentifier, hashIp } from "./security-events";

const MAX_PIN_FAILURES = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;
const MAX_PASSWORD_ATTEMPTS = 10;
const PASSWORD_WINDOW_MS = 15 * 60 * 1000;

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

export async function recordPinFailure(userId: string): Promise<{
  locked: boolean;
  attempts: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { locked: false, attempts: 0 };

  const { data } = await admin
    .from("profiles")
    .select("pin_failed_attempts")
    .eq("id", userId)
    .maybeSingle();

  const attempts = (data?.pin_failed_attempts ?? 0) + 1;
  const locked = attempts >= MAX_PIN_FAILURES;
  const pinLockedUntil = locked
    ? new Date(Date.now() + PIN_LOCK_MS).toISOString()
    : null;

  await admin
    .from("profiles")
    .update({
      pin_failed_attempts: attempts,
      pin_locked_until: pinLockedUntil,
    })
    .eq("id", userId);

  return { locked, attempts };
}

export async function resetPinFailures(userId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from("profiles")
    .update({
      pin_failed_attempts: 0,
      pin_locked_until: null,
    })
    .eq("id", userId);
}
