import { PHONE_VERIFY_COPY } from "./copy";

export type SmsProviderFailureCategory =
  | "authentication"
  | "invalid_number"
  | "provider_rejection"
  | "network"
  | "not_configured"
  | "unknown";

export function classifySendchampSendFailure(input: {
  error: string;
  status?: number;
  code?: string;
}): SmsProviderFailureCategory {
  if (input.code === "not_configured") return "not_configured";
  if (input.code === "provider_auth_failed") return "authentication";

  const status = input.status ?? 0;
  if (status === 401 || status === 407) return "authentication";
  if (status === 503 && /not configured/i.test(input.error)) return "not_configured";

  const lower = input.error.toLowerCase();
  if (
    /network error|timed out|timeout|fetch failed|econnrefused|enotfound|socket/i.test(
      lower
    )
  ) {
    return "network";
  }
  if (/invalid access key|unauthorized|authentication|api key|forbidden/i.test(lower)) {
    return "authentication";
  }
  if (/invalid.*(phone|mobile|number)|phone number|customer_mobile/i.test(lower)) {
    return "invalid_number";
  }
  if (
    /balance|insufficient|wallet|fund|recharge|credit|billing|payment required/i.test(
      lower
    )
  ) {
    return "provider_rejection";
  }
  if (/rejected|failed|declined|blocked|dnd|blacklist/i.test(lower)) {
    return "provider_rejection";
  }

  return "unknown";
}

export function userMessageForSmsFailureCategory(
  category: SmsProviderFailureCategory
): string {
  switch (category) {
    case "authentication":
      return PHONE_VERIFY_COPY.smsFailureAuth;
    case "invalid_number":
      return PHONE_VERIFY_COPY.smsFailureInvalidNumber;
    case "provider_rejection":
      return PHONE_VERIFY_COPY.smsFailureProviderRejected;
    case "network":
      return PHONE_VERIFY_COPY.smsFailureNetwork;
    case "not_configured":
      return PHONE_VERIFY_COPY.smsFailureNotConfigured;
    default:
      return PHONE_VERIFY_COPY.providerUnavailable;
  }
}

export function mapSendchampFailureToUserError(input: {
  error: string;
  status?: number;
  code?: string;
}): { userMessage: string; category: SmsProviderFailureCategory } {
  const category = classifySendchampSendFailure(input);
  return {
    category,
    userMessage: userMessageForSmsFailureCategory(category),
  };
}
