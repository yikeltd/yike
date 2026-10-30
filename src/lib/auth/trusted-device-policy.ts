/** Pure trusted-device lifetime rules (no server imports). */

export const DEVICE_TRUST_MAX_AGE_DAYS = 90;
export const DEVICE_TRUST_MAX_AGE_MS =
  DEVICE_TRUST_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export function isDeviceTrustExpired(
  trustedAt: string | Date | null | undefined
): boolean {
  if (!trustedAt) return true;
  const ms =
    typeof trustedAt === "string" ? Date.parse(trustedAt) : trustedAt.getTime();
  if (!Number.isFinite(ms)) return true;
  return Date.now() - ms > DEVICE_TRUST_MAX_AGE_MS;
}
