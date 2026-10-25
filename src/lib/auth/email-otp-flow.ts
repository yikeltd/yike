import type { AuthClientFailureKind } from "@/lib/auth/auth-fetch";
import type { EmailOtpDispatchStatus } from "@/lib/auth-email-otp/types";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { OTP_EXPIRY_MS, OTP_RESEND_COOLDOWN_MS } from "@/lib/otp/constants";

export const EMAIL_OTP_RESEND_COOLDOWN_SEC = Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000);
export const EMAIL_OTP_EXPIRY_MINUTES = Math.round(OTP_EXPIRY_MS / 60_000);

export type { EmailOtpDispatchStatus };

/** UI copy for successful OTP generation — separate inbox delivery from dev console. */
export function resolveEmailOtpDispatchPresentation(
  dispatchStatus: EmailOtpDispatchStatus | undefined
): {
  dispatchStatus: EmailOtpDispatchStatus;
  showInboxInstructions: boolean;
  infoMessage: string;
} {
  if (dispatchStatus === "dev_console") {
    return {
      dispatchStatus: "dev_console",
      showInboxInstructions: false,
      infoMessage: EMAIL_OTP_USER_MESSAGES.devConsole,
    };
  }
  return {
    dispatchStatus: "provider_accepted",
    showInboxInstructions: true,
    infoMessage: EMAIL_OTP_USER_MESSAGES.sent,
  };
}

export type EmailOtpSendFailureResolution = {
  userMessage: string;
  resendCooldownSec: number;
  /** Keep "code sent" UX when a prior send likely still applies (rate limit / expiry recovery). */
  treatAsCodeSent: boolean;
  isHourlyCap: boolean;
};

type SendErrorBody = {
  error?: string;
  retryAfterSec?: number;
  limitReason?: string;
};

/** Map send-email-otp failure into modal state — no extra network calls. */
export function resolveEmailOtpSendFailure(input: {
  kind: AuthClientFailureKind;
  status?: number;
  message: string;
  data?: SendErrorBody;
}): EmailOtpSendFailureResolution {
  const retryAfterSec =
    typeof input.data?.retryAfterSec === "number" && input.data.retryAfterSec > 0
      ? Math.ceil(input.data.retryAfterSec)
      : EMAIL_OTP_RESEND_COOLDOWN_SEC;

  const limitReason = input.data?.limitReason;
  const isHourlyCap =
    limitReason === "hourly_email" ||
    limitReason === "hourly_ip" ||
    (input.kind === "rate_limit" &&
      input.message.includes("several codes"));

  if (input.kind === "rate_limit" || input.status === 429) {
    if (isHourlyCap) {
      return {
        userMessage: input.message || EMAIL_OTP_USER_MESSAGES.hourlySendLimit,
        resendCooldownSec: 0,
        treatAsCodeSent: true,
        isHourlyCap: true,
      };
    }
    return {
      userMessage: `Please wait ${retryAfterSec}s before requesting another code. If you already have a code, you can still enter it below.`,
      resendCooldownSec: retryAfterSec,
      treatAsCodeSent: true,
      isHourlyCap: false,
    };
  }

  return {
    userMessage: input.message || EMAIL_OTP_USER_MESSAGES.sendFailed,
    resendCooldownSec: 0,
    treatAsCodeSent: false,
    isHourlyCap: false,
  };
}

export function resolveEmailOtpVerifyFailure(message: string): {
  userMessage: string;
  suggestResend: boolean;
} {
  const lower = message.toLowerCase();
  if (lower.includes("expired")) {
    return {
      userMessage: EMAIL_OTP_USER_MESSAGES.expired,
      suggestResend: true,
    };
  }
  if (lower.includes("too many attempts") || lower.includes("request a new code")) {
    return {
      userMessage: EMAIL_OTP_USER_MESSAGES.maxAttempts,
      suggestResend: true,
    };
  }
  if (lower.includes("no code")) {
    return {
      userMessage: EMAIL_OTP_USER_MESSAGES.noCode,
      suggestResend: true,
    };
  }
  return { userMessage: message, suggestResend: false };
}

export function emailOtpResendLabel(input: {
  sending: boolean;
  cooldownSec: number;
  hourlyCap: boolean;
}): string {
  if (input.sending) return "Sending…";
  if (input.hourlyCap) return "Resend unavailable — try again in about an hour";
  if (input.cooldownSec > 0) return `Resend code in ${input.cooldownSec}s`;
  return "Resend code";
}

/** When the OTP modal opens, auto-send at most once per open cycle. */
export function shouldAutoSendEmailOtpOnOpen(input: {
  autoSend: boolean;
  initialCodeSent: boolean;
  openSessionId: number;
  lastSentOpenSessionId: number;
}): boolean {
  if (!input.autoSend || input.initialCodeSent) return false;
  return input.openSessionId !== input.lastSentOpenSessionId;
}

export function mapSignupDuplicateResponse(result: {
  emailExists?: boolean;
  phoneExists?: boolean;
} | null): { emailError: string; phoneError: string; unavailable: boolean } {
  if (!result) {
    return {
      emailError: "",
      phoneError: "",
      unavailable: true,
    };
  }
  return {
    emailError: result.emailExists ? "Email already in use" : "",
    phoneError: result.phoneExists ? "Number already in use" : "",
    unavailable: false,
  };
}
