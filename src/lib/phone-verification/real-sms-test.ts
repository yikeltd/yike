import { isProductionEnv } from "@/lib/env";

/** Opt-in local testing against live Sendchamp (no dev-console OTP fallback). */
export function isRealSmsTestEnabled(): boolean {
  const raw = process.env.YIKE_REAL_SMS_TEST?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Terminal OTP fallback for seller SMS in local dev only. */
export function shouldUseSellerSmsDevConsoleFallback(): boolean {
  if (isProductionEnv()) return false;
  return !isRealSmsTestEnabled();
}
