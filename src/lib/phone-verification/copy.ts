import type { PhoneVerificationChannel } from "./types";

/**
 * Single production SMS OTP body — exact plain text, one line.
 * `{OTP}` is replaced for `/sms/send`. Sendchamp Verification uses `{{code}}`.
 * No line breaks, HTML, emojis, or markdown.
 */
export const SMS_OTP_MESSAGE_TEMPLATE =
  "Hi There, Your Yike OTP is {OTP}. Expires in 30 minutes.";

/** Sendchamp Verification API template — `{{code}}` is substituted by Sendchamp. */
export const SENDCHAMP_OTP_META_MESSAGE =
  "Hi There, Your Yike OTP is {{code}}. Expires in 30 minutes.";

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
  providerMisconfigured:
    "SMS verification is unavailable due to a provider configuration issue.",
  devConsoleSms:
    "Local development: SMS is not sent. Check the terminal running npm run dev for your 6-digit code.",
  smsFailureAuth:
    "SMS could not be sent: provider authentication failed. Check Sendchamp API keys in your environment.",
  smsFailureInvalidNumber:
    "SMS could not be sent: this phone number was rejected by the provider.",
  smsFailureProviderRejected:
    "SMS could not be sent: the provider rejected the request (balance, routing, or account limits).",
  smsFailureNetwork:
    "SMS could not be sent: network error reaching the SMS provider. Try again shortly.",
  smsFailureNotConfigured:
    "SMS could not be sent: Sendchamp is not configured (missing SENDCHAMP_PUBLIC_KEY).",
  cooldown: "Please wait a moment before requesting another code.",
  rateLimited: "Too many codes sent. Try again in an hour.",
  expired: "This code expired. Request a new one.",
  maxAttempts: "Too many attempts. Request a new code.",
  phoneAlreadyLinked:
    "This number is already linked to another Yike account. Use a different number or sign in to that account.",
  requiredToList: "Required to list",
  cardTitle: "Phone verification",
  listingGate: "Verify your phone number to publish this listing.",
  profileTitle: "Verify your phone to start selling.",
  verifiedStatus: "Phone verified",
  adminRequired: "Phone verification is required before you can list.",
  modalTitle: "Verify your phone",
  modalBody: "We will send a 6-digit code by SMS.",
  modalHelper: "Use the number on your seller profile.",
  sendCodeButton: "Send code",
  notYourNumber: "Not your number?",
  resendCode: "Resend code",
  agentBadgeTitle: "Phone verification",
  agentBadgeVerified: "Verified",
  agentBadgeUnderReview: "Under review",
  agentBadgeOptional: "Optional",
  agentBadgeDescription: "Buyers trust sellers with a verified phone number.",
  listingPrompt: "Verify your phone to start selling.",
} as const;

export function otpChannelLabel(_channel: PhoneVerificationChannel): string {
  return "SMS";
}
