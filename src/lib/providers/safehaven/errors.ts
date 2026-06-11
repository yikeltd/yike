import type { SafeHavenProviderErrorCode } from "./types";

const PUBLIC_MESSAGES: Record<SafeHavenProviderErrorCode, string> = {
  provider_not_configured: "Payment provider is not configured yet.",
  provider_auth_failed: "Payment provider authentication failed.",
  provider_unavailable: "Payment provider is temporarily unavailable.",
  webhook_signature_invalid: "Webhook signature invalid.",
  webhook_duplicate: "Webhook already processed.",
  transaction_already_processed: "Transaction already processed.",
  transfer_disabled: "Transfers are not enabled.",
  virtual_account_disabled: "Virtual accounts are not enabled.",
};

export function safeHavenPublicMessage(code: SafeHavenProviderErrorCode): string {
  return PUBLIC_MESSAGES[code];
}

export function mapSafeHavenHttpError(status: number): SafeHavenProviderErrorCode {
  if (status === 401 || status === 403) return "provider_auth_failed";
  if (status === 503 || status === 502 || status === 504) return "provider_unavailable";
  return "provider_unavailable";
}
