import { createHash } from "crypto";

/** Pure device fingerprint for PIN lockout — safe to import from scripts without server-only deps. */
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
