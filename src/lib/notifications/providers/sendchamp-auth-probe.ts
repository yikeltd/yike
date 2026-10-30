import {
  classifySendchampSendFailure,
  mapSendchampFailureToUserError,
  type SmsProviderFailureCategory,
} from "@/lib/phone-verification/sendchamp-errors";
import {
  getSendchampVerificationAuthDiagnostic,
  getSendchampVerificationBaseUrl,
  resolveSendchampAccessKey,
  VERIFICATION_CREATE_PATH,
} from "./sendchamp-access-key";
import { sendchampJsonPost } from "./sendchamp-http.client";

export type SendchampAuthProbeResult = {
  httpStatus: number | null;
  failureCategory: SmsProviderFailureCategory | "ok";
  sanitizedMessage: string;
  note: string;
};

/** Auth-only probe — in_app_token=true, no SMS dispatch. */
export async function probeSendchampVerificationAuth(): Promise<SendchampAuthProbeResult> {
  const resolved = resolveSendchampAccessKey();
  if (!resolved) {
    return {
      httpStatus: null,
      failureCategory: "not_configured",
      sanitizedMessage: "No Sendchamp Access key configured",
      note: "Set SENDCHAMP_API_KEY from Sendchamp dashboard",
    };
  }

  const baseUrl = getSendchampVerificationBaseUrl();
  try {
    const res = await sendchampJsonPost(
      `${baseUrl}${VERIFICATION_CREATE_PATH}`,
      {
        channel: "sms",
        token_type: "numeric",
        token_length: 6,
        expiration_time: 30,
        customer_mobile_number: "2348010000000",
        customer_email_address: "auth-probe@yike.ng",
        in_app_token: true,
        token: "000000",
        meta_data: { app: "Yike", purpose: "auth_probe" },
        sender: "YIKE",
      },
      resolved.key,
      25_000
    );

    const message = String(res.data.message ?? res.data.status ?? "").slice(0, 120);
    if (res.status >= 200 && res.status < 300) {
      return {
        httpStatus: res.status,
        failureCategory: "ok",
        sanitizedMessage: message || "Success",
        note: "in_app_token=true — no SMS sent",
      };
    }

    const mapped = mapSendchampFailureToUserError({
      error: message,
      status: res.status,
      code: res.status === 401 || res.status === 407 ? "provider_auth_failed" : undefined,
    });

    return {
      httpStatus: res.status,
      failureCategory: classifySendchampSendFailure({
        error: message,
        status: res.status,
        code: res.status === 401 || res.status === 407 ? "provider_auth_failed" : undefined,
      }),
      sanitizedMessage: message || mapped.userMessage,
      note: "in_app_token=true — no SMS sent",
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Sendchamp request timed out"
        : "Sendchamp network error";
    return {
      httpStatus: null,
      failureCategory: "network",
      sanitizedMessage: message,
      note: "Probe did not reach a JSON auth response",
    };
  }
}

export { getSendchampVerificationAuthDiagnostic };
