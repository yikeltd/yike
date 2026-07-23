import { generateOtp } from "@/lib/otp/crypto";
import {
  confirmSendchampVerification,
  createSendchampVerificationOtp,
  isSendchampVerificationConfigured,
} from "@/lib/notifications/providers/sendchamp-verification";
import { sendBrandedSmsOtp } from "@/lib/notifications/providers/sendchamp";
import { PHONE_VERIFY_COPY } from "./copy";
import type {
  PhoneOtpConfirmResult,
  PhoneOtpSendResult,
  PhoneVerificationChannel,
  PhoneVerificationProvider,
} from "./types";

/**
 * Sendchamp provider — SMS delivery with branded copy + Verification API confirm.
 * WhatsApp / email stubs keep the interface stable for future channels.
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

    // Server-generated OTP — never from the client.
    const code = generateOtp();

    if (params.channel === "sms") {
      const registered = await createSendchampVerificationOtp({
        phoneIntl: params.phoneIntl,
        channel: "sms",
        purpose: params.purpose,
        email: params.email,
        token: code,
        /** App delivers branded SMS; Sendchamp holds the OTP for confirm. */
        inAppToken: true,
      });

      if (!registered.ok) {
        return {
          ok: false,
          error: PHONE_VERIFY_COPY.providerUnavailable,
          status: registered.status,
          code: registered.code,
        };
      }

      const delivered = await sendBrandedSmsOtp(params.phoneIntl, code);
      if (!delivered.ok) {
        console.error("[phone-verification] branded SMS failed", delivered.error);
        return {
          ok: false,
          error: PHONE_VERIFY_COPY.providerUnavailable,
          status: 502,
        };
      }

      return {
        ok: true,
        channel: "sms",
        reference: registered.reference,
        expiresMinutes: registered.expiresMinutes,
        message: PHONE_VERIFY_COPY.sentSms,
      };
    }

    // Future WhatsApp Business channel — Verification API delivery (no custom SMS body).
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
    const confirmed = await confirmSendchampVerification({
      reference: params.reference,
      code: params.code,
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
