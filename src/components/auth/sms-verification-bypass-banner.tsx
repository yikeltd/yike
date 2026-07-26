import { isAuthSmsVerificationBypassActive } from "@/lib/auth/sms-verification-flag";

/**
 * Visible only while AUTH_SMS_VERIFICATION_ENABLED=false.
 * Disappears automatically when SMS is re-enabled — no code change.
 */
export function SmsVerificationBypassBanner() {
  if (!isAuthSmsVerificationBypassActive()) return null;

  return (
    <div
      role="status"
      className="relative z-[60] border-b border-amber-500/40 bg-amber-500 px-3 py-2 text-center text-[11px] font-bold tracking-wide text-navy sm:text-xs"
    >
      Testing Mode — SMS Verification Temporarily Disabled
    </div>
  );
}
