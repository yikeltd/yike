import type { OtpChannel } from "./types";

export const OTP_USER_MESSAGES = {
  sentWhatsApp: "Verification code sent to WhatsApp.",
  sentSms: "Verification code sent by SMS.",
  sendFailed: "We could not send the code right now.",
  invalidPhone: "Invalid phone number",
  cooldown: "Please wait a moment before requesting another code.",
  expired: "Code expired — request a new one.",
  incorrect: "Incorrect code",
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
