import {
  getSendchampVerificationAuthDiagnostic,
  probeSendchampVerificationAuth,
} from "@/lib/notifications/providers/sendchamp-auth-probe";
import {
  confirmSendchampVerification,
  createSendchampVerificationOtp,
  isSendchampVerificationConfigured,
} from "@/lib/notifications/providers/sendchamp-verification";
import { logOtpAudit } from "@/lib/otp/delivery-audit";
import { PHONE_VERIFY_COPY } from "./copy";
import {
  confirmLocalOtp,
  createLocalSmsOtp,
  fingerprintPhone,
  isLocalOtpReference,
} from "./local-otp";
import {
  isRealSmsTestEnabled,
  shouldUseSellerSmsDevConsoleFallback,
} from "./real-sms-test";
import { mapSendchampFailureToUserError } from "./sendchamp-errors";
import type {
  PhoneOtpConfirmResult,
  PhoneOtpSendResult,
  PhoneVerificationChannel,
  PhoneVerificationProvider,
} from "./types";

export const sendchampPhoneVerificationProvider: PhoneVerificationProvider = {
  id: "sendchamp",
  supportedChannels: ["sms"] as const,

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

    if (isRealSmsTestEnabled()) {
      console.info(
        "[phone-verification] YIKE_REAL_SMS_TEST enabled — using Sendchamp only (no dev-console fallback)",
        { phoneFp: fingerprintPhone(params.phoneIntl), requestId }
      );
    }

    if (!isSendchampVerificationConfigured()) {
      if (shouldUseSellerSmsDevConsoleFallback()) {
        return deliverLocalDevSmsOtp(params.phoneIntl, requestId);
      }
      const mapped = mapSendchampFailureToUserError({
        error: "Sendchamp not configured",
        status: 503,
        code: "not_configured",
      });
      return {
        ok: false,
        error: mapped.userMessage,
        status: 503,
        code: "not_configured",
        failureCategory: mapped.category,
      };
    }

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
      const mapped = mapSendchampFailureToUserError({
        error: created.error,
        status: created.status,
        code: created.code,
      });

      logOtpAudit({
        event: "provider_sms_failed",
        requestId,
        phone: params.phoneIntl,
        error: mapped.category,
      });
      console.error("[phone-verification] verification SMS failed", {
        phoneFp: fingerprintPhone(params.phoneIntl),
        category: mapped.category,
        httpStatus: created.status,
        requestId,
      });

      if (isRealSmsTestEnabled() && mapped.category === "authentication") {
        const authDiag = getSendchampVerificationAuthDiagnostic();
        console.error("[phone-verification] sendchamp auth diagnostic (config)", authDiag);
        void probeSendchampVerificationAuth().then((probe) => {
          console.error("[phone-verification] sendchamp auth diagnostic (probe)", probe);
        });
      }

      if (shouldUseSellerSmsDevConsoleFallback()) {
        return deliverLocalDevSmsOtp(params.phoneIntl, requestId, mapped.category);
      }

      return {
        ok: false,
        error: mapped.userMessage,
        status: created.status === 401 || created.status === 407 ? 503 : created.status,
        code: created.code,
        failureCategory: mapped.category,
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
      deliveryMode: "provider",
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

function deliverLocalDevSmsOtp(
  phoneIntl: string,
  requestId: string,
  reason?: string
): PhoneOtpSendResult {
  const local = createLocalSmsOtp();
  console.info(
    `[Yike seller SMS dev] fp:${fingerprintPhone(phoneIntl)}${reason ? ` (${reason})` : ""}: ${local.code}`
  );
  logOtpAudit({
    event: "provider_sms_dev_console",
    requestId,
    phone: phoneIntl,
    reference: local.reference,
  });
  return {
    ok: true,
    channel: "sms",
    reference: local.reference,
    expiresMinutes: local.expiresMinutes,
    message: PHONE_VERIFY_COPY.devConsoleSms,
    deliveryMode: "dev_console",
  };
}
