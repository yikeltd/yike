import type { PhoneVerificationChannel } from "./types";

/**
 * Single production SMS OTP body — exact plain text, one line.
 * `{OTP}` is replaced for `/sms/send`. Sendchamp Verification uses `{{code}}`.
 * No line breaks, HTML, emojis, or markdown.
 */
export const SMS_OTP_MESSAGE_TEMPLATE =
  "Your verification code is: {OTP}. Code is valid for 30 minutes. Never share this code. Welcome to Yike. Happy Listing.";

/** Sendchamp Verification API template — `{{code}}` is substituted by Sendchamp. */
export const SENDCHAMP_OTP_META_MESSAGE =
  "Your verification code is: {{code}}. Code is valid for 30 minutes. Never share this code. Welcome to Yike. Happy Listing.";

export function buildSmsOtpMessage(otp: string): string {
  return SMS_OTP_MESSAGE_TEMPLATE.replace("{OTP}", otp.trim());
}

export const PHONE_VERIFY_COPY = {
  screenTitle: "Verify Your Phone Number",
  screenBody: "Verify your phone to start selling.",
  browseHint: "Browsing, saving, and contacting sellers stay free without phone verification.",
  validityHint: "Code is valid for 30 minutes.",
  sendButton: "Send code",
  verifyButton: "Verify",
  resendButton: "Resend code",
  resendCooldown: (seconds: number) => `Resend in ${seconds}s`,
  sending: "Sending…",
  verifying: "Verifying…",
  sentSms: "We sent a 6-digit code by SMS.",
  updateNumber: "Not your number?",
  updateHere: "Update here",
  phoneLabel: "Phone number",
  codeLabel: "Verification code",
  codePlaceholder: "6-digit code",
  invalidPhone: "Enter a valid Nigerian number (e.g. 08035143299).",
  invalidCode: "Enter the 6-digit code from your SMS.",
  verified: "Phone verified. You can continue listing.",
  providerUnavailable:
    "We could not send an SMS right now. Please try again shortly.",
  cooldown: "Please wait a moment before requesting another code.",
  rateLimited: "Too many codes sent. Try again in an hour.",
  expired: "This code expired. Request a new one.",
  maxAttempts: "Too many attempts. Request a new code.",
  requiredToList: "Required to list",
  cardTitle: "Phone verification",
} as const;

export function otpChannelLabel(channel: PhoneVerificationChannel): string {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "email") return "email";
  return "SMS";
}
