import {
  confirmSendchampVerification,
  createSendchampVerificationOtp,
  isSendchampVerificationConfigured,
} from "@/lib/notifications/providers/sendchamp-verification";
import { sendBrandedSmsOtp } from "@/lib/notifications/providers/sendchamp";
import { PHONE_VERIFY_COPY } from "./copy";
import {
  confirmLocalOtp,
  createLocalSmsOtp,
  fingerprintPhone,
  isLocalOtpReference,
} from "./local-otp";
import type {
  PhoneOtpConfirmResult,
  PhoneOtpSendResult,
  PhoneVerificationChannel,
  PhoneVerificationProvider,
} from "./types";

/**
 * Sendchamp provider — SMS via branded `/sms/send` only (local OTP hash).
 * Never call `/verification/create` for SMS (that delivers Sendchamp’s “Hi There” template).
 * WhatsApp still uses Verification API delivery.
 */
export const sendchampPhoneVerificationProvider: PhoneVerificationProvider = {
  id: "sendchamp",
  supportedChannels: ["sms", "whatsapp"] as const,

  isConfigured() {
    return isSendchampVerificationConfigured();
  },

  async sendOtp(params: {
    phoneIntl: string;
    channel: PhoneVerificationChannel;
    email?: string;
    purpose: string;
  }): Promise<PhoneOtpSendResult> {
    if (params.channel === "email") {
      return {
        ok: false,
        error: "Email OTP channel is not enabled yet.",
        status: 501,
        code: "not_configured",
      };
    }

    if (!isSendchampVerificationConfigured()) {
      return {
        ok: false,
        error: PHONE_VERIFY_COPY.providerUnavailable,
        status: 503,
        code: "not_configured",
      };
    }

    if (params.channel === "sms") {
      const { code, reference, expiresMinutes } = createLocalSmsOtp();

      // Single delivery path: Sendchamp SMS API only.
      const delivered = await sendBrandedSmsOtp(params.phoneIntl, code);
      if (!delivered.ok) {
        console.error("[phone-verification] branded SMS failed", {
          phoneFp: fingerprintPhone(params.phoneIntl),
          error: delivered.error,
        });
        return {
          ok: false,
          error: PHONE_VERIFY_COPY.providerUnavailable,
          status: 502,
        };
      }

      console.info("[phone-verification] sms sent", {
        phoneFp: fingerprintPhone(params.phoneIntl),
        channel: "sms",
        referencePrefix: "local",
      });

      return {
        ok: true,
        channel: "sms",
        reference,
        expiresMinutes,
        message: PHONE_VERIFY_COPY.sentSms,
      };
    }

    // WhatsApp Business — Verification API delivers (no custom SMS body).
    const created = await createSendchampVerificationOtp({
      phoneIntl: params.phoneIntl,
      channel: "whatsapp",
      purpose: params.purpose,
      email: params.email,
      inAppToken: false,
    });

    if (!created.ok) {
      return {
        ok: false,
        error: PHONE_VERIFY_COPY.providerUnavailable,
        status: created.status,
        code: created.code,
      };
    }

    return {
      ok: true,
      channel: "whatsapp",
      reference: created.reference,
      expiresMinutes: created.expiresMinutes,
      message: "Verification code sent to WhatsApp.",
    };
  },

  async confirmOtp(params: {
    reference: string;
    code: string;
  }): Promise<PhoneOtpConfirmResult> {
    const code = params.code.trim();

    if (isLocalOtpReference(params.reference)) {
      if (!confirmLocalOtp(params.reference, code)) {
        return { ok: false, error: PHONE_VERIFY_COPY.invalidCode, status: 400 };
      }
      return { ok: true };
    }

    const confirmed = await confirmSendchampVerification({
      reference: params.reference,
      code,
    });
    if (!confirmed.ok) {
      return { ok: false, error: confirmed.error, status: confirmed.status };
    }
    return { ok: true };
  },
};

export function getPhoneVerificationProvider(): PhoneVerificationProvider {
  return sendchampPhoneVerificationProvider;
}
