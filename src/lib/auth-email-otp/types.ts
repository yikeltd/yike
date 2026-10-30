export const AUTH_EMAIL_OTP_PURPOSES = [
  "signup",
  "login",
  "email_verify",
  "password_reset",
] as const;

export type AuthEmailOtpPurpose = (typeof AUTH_EMAIL_OTP_PURPOSES)[number];

/** How the OTP left the server — not the same as inbox delivery. */
export type EmailOtpDispatchStatus = "provider_accepted" | "dev_console";

export function isAuthEmailOtpPurpose(value: string): value is AuthEmailOtpPurpose {
  return (AUTH_EMAIL_OTP_PURPOSES as readonly string[]).includes(value);
}
