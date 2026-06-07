export const AUTH_EMAIL_OTP_PURPOSES = [
  "signup",
  "login",
  "email_verify",
  "password_reset",
] as const;

export type AuthEmailOtpPurpose = (typeof AUTH_EMAIL_OTP_PURPOSES)[number];

export function isAuthEmailOtpPurpose(value: string): value is AuthEmailOtpPurpose {
  return (AUTH_EMAIL_OTP_PURPOSES as readonly string[]).includes(value);
}
