import {
  confirmSendchampVerification,
  createSendchampVerificationOtp,
  isSendchampVerificationConfigured,
} from "@/lib/notifications/providers/sendchamp-verification";
import { logOtpAudit } from "@/lib/otp/delivery-audit";
import { PHONE_VERIFY_COPY } from "./copy";
import {
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
 * Sendchamp provider — production SMS = ONE Verification API create (BamSignal path).
 * Never call `/sms/send` in the same user action (double-charge risk).
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
    requestId?: string;
  }): Promise<PhoneOtpSendResult> {
    const requestId = params.requestId ?? "unknown";

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
      logOtpAudit({
        event: "provider_sms_start",
        requestId,
        phone: params.phoneIntl,
      });

      const created = await createSendchampVerificationOtp({
        phoneIntl: params.phoneIntl,
        channel: "sms",
        purpose: params.purpose,
        email: params.email,
        inAppToken: false,
        requestId,
      });

      if (!created.ok) {
        logOtpAudit({
          event: "provider_sms_failed",
          requestId,
          phone: params.phoneIntl,
          error: created.error,
        });
        console.error("[phone-verification] verification SMS failed", {
          phoneFp: fingerprintPhone(params.phoneIntl),
          error: created.error,
          requestId,
        });
        return {
          ok: false,
          error: PHONE_VERIFY_COPY.providerUnavailable,
          status: created.status,
          code: created.code,
        };
      }

      logOtpAudit({
        event: "provider_sms_ok",
        requestId,
        phone: params.phoneIntl,
        reference: created.reference,
        deliveryReference: created.reference,
      });

      return {
        ok: true,
        channel: "sms",
        reference: created.reference,
        expiresMinutes: created.expiresMinutes,
        message: PHONE_VERIFY_COPY.sentSms,
      };
    }

    const created = await createSendchampVerificationOtp({
      phoneIntl: params.phoneIntl,
      channel: "whatsapp",
      purpose: params.purpose,
      email: params.email,
      inAppToken: false,
      requestId,
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
    requestId?: string;
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
      requestId: params.requestId,
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
