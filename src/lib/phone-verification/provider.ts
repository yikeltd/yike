import {
  confirmSendchampVerification,
  createSendchampVerificationOtp,
  isSendchampVerificationConfigured,
  otpExpiryMinutes,
} from "@/lib/notifications/providers/sendchamp-verification";
import { sendBrandedSmsOtp } from "@/lib/notifications/providers/sendchamp";
import { generateOtp } from "@/lib/otp/crypto";
import { PHONE_VERIFY_COPY } from "./copy";
import {
  buildLocalOtpReference,
  confirmLocalOtp,
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
 * Sendchamp provider — production SMS via Verification API (BamSignal path):
 * `/verification/create` + sender YIKE + branded meta message.
 * Branded `/sms/send` is a delivery fallback only when Verification fails.
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
      const created = await createSendchampVerificationOtp({
        phoneIntl: params.phoneIntl,
        channel: "sms",
        purpose: params.purpose,
        email: params.email,
        inAppToken: false,
      });

      if (created.ok) {
        console.info("[phone-verification] sms sent via verification API", {
          phoneFp: fingerprintPhone(params.phoneIntl),
          channel: "sms",
        });
        return {
          ok: true,
          channel: "sms",
          reference: created.reference,
          expiresMinutes: created.expiresMinutes,
          message: PHONE_VERIFY_COPY.sentSms,
        };
      }

      console.warn("[phone-verification] verification SMS failed — trying branded /sms/send", {
        phoneFp: fingerprintPhone(params.phoneIntl),
        error: created.error,
      });

      // Fallback: local OTP + branded SMS API (DND-first routes).
      const code = generateOtp();
      const delivered = await sendBrandedSmsOtp(params.phoneIntl, code);
      if (!delivered.ok) {
        console.error("[phone-verification] branded SMS fallback failed", {
          phoneFp: fingerprintPhone(params.phoneIntl),
          verificationError: created.error,
          smsError: delivered.error,
        });
        return {
          ok: false,
          error: PHONE_VERIFY_COPY.providerUnavailable,
          status: 502,
        };
      }

      console.info("[phone-verification] sms sent via branded fallback", {
        phoneFp: fingerprintPhone(params.phoneIntl),
        channel: "sms",
        referencePrefix: "local",
      });

      return {
        ok: true,
        channel: "sms",
        reference: buildLocalOtpReference(code),
        expiresMinutes: otpExpiryMinutes(),
        message: PHONE_VERIFY_COPY.sentSms,
      };
    }

    // WhatsApp Business — Verification API delivers.
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
