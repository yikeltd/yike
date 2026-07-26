/**
 * Temporary SMS verification gate for Founder Acceptance Testing.
 *
 * AUTH_SMS_VERIFICATION_ENABLED=true  → production flow (default)
 * AUTH_SMS_VERIFICATION_ENABLED=false → FAT bypass (no SMS)
 *
 * Re-enable SMS before public launch with a single env change — no code deploy required.
 * @see docs/launch/FINAL_PRE_LAUNCH_REPORT.md
 */

import { isProductionEnv } from "@/lib/env";

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  const v = raw?.trim().toLowerCase();
  if (!v) return defaultValue;
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true;
  if (v === "false" || v === "0" || v === "no" || v === "off") return false;
  return defaultValue;
}

/**
 * When true (default), seller phone verification requires SMS OTP.
 * Unset → true (secure default). Never defaults to bypass.
 */
export function isAuthSmsVerificationEnabled(): boolean {
  return parseBool(process.env.AUTH_SMS_VERIFICATION_ENABLED, true);
}

/**
 * True only when operators explicitly set AUTH_SMS_VERIFICATION_ENABLED=false.
 * Safe to leave unset in production (bypass stays off).
 */
export function isAuthSmsVerificationBypassActive(): boolean {
  return !isAuthSmsVerificationEnabled();
}

/** Operator-facing status for Lex / docs. */
export function getAuthSmsVerificationStatus(): {
  smsRequired: boolean;
  bypassActive: boolean;
  productionEnv: boolean;
  warning: string | null;
} {
  const bypassActive = isAuthSmsVerificationBypassActive();
  const productionEnv = isProductionEnv();
  return {
    smsRequired: !bypassActive,
    bypassActive,
    productionEnv,
    warning:
      bypassActive && productionEnv
        ? "AUTH_SMS_VERIFICATION_ENABLED=false on a production APP_ENV — re-enable before public launch"
        : bypassActive
          ? "Testing Mode — SMS verification bypass active"
          : null,
  };
}
