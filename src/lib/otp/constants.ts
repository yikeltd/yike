export const OTP_LENGTH = 6;
/** Align with SENDCHAMP_OTP_EXPIRY_MINUTES (production: 30). */
export const OTP_EXPIRY_MS = 30 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_PROVIDER = "sendchamp";
