import type { OtpChannel } from "./types";

export const OTP_USER_MESSAGES = {
  sentWhatsApp: "Verification code sent to WhatsApp.",
  sentSms: "Verification code sent by SMS.",
  sendFailed:
    "We could not send the code right now. Please try SMS or try again shortly.",
  whatsappFailed: "WhatsApp code could not be sent. Try SMS.",
  invalidPhone: "Invalid phone number",
  cooldown: "Please wait a moment before requesting another code.",
  expired: "Code expired — request a new one.",
  incorrect: "We could not verify the code. Please check and try again.",
  maxAttempts: "Too many attempts — request a new code.",
  noCode: "No code sent for this number",
  alreadyUsed: "Code already used",
  unavailable: "Auth service unavailable",
} as const;

export function otpSentMessage(channel: OtpChannel): string {
  return channel === "whatsapp"
    ? OTP_USER_MESSAGES.sentWhatsApp
    : OTP_USER_MESSAGES.sentSms;
}

export const EMAIL_USER_MESSAGES = {
  verificationSent: "Check your email to verify your account.",
  verificationResent: "Check your email to verify your account.",
  sendFailed: "We could not send the email right now.",
  notSignedIn: "Not signed in",
} as const;

export const EMAIL_OTP_USER_MESSAGES = {
  sent: "We sent a 6-digit code to your email.",
  verified: "Email verified. Welcome to Yike.",
  incorrect: "That code looks incorrect. Please check your email and try again.",
  expired: "This code has expired. Please request a new one.",
  cooldown: "Please wait a moment before requesting another code.",
  maxAttempts: "Too many attempts. Please request a new code.",
  noCode: "No code found for this email. Request a new one.",
  sendFailed: "We could not send the code right now. Please try again.",
  verifyFailed: "Could not verify your email. Please try again.",
  unavailable: "Email verification is temporarily unavailable.",
  invalidEmail: "Enter a valid email address.",
  network: "Connection issue. Please try again.",
} as const;
