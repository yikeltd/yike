export type SafeHavenProviderErrorCode =
  | "provider_not_configured"
  | "provider_auth_failed"
  | "provider_unavailable"
  | "webhook_signature_invalid"
  | "webhook_duplicate"
  | "transaction_already_processed"
  | "transfer_disabled"
  | "virtual_account_disabled";

export type SafeHavenConfigStatus =
  | "disabled"
  | "awaiting_credentials"
  | "configured";

export type SafeHavenConfig = {
  env: string;
  baseUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  privateKeyPem: string | null;
  webhookSecret: string | null;
  businessId: string | null;
  settlementAccount: string | null;
  oauthTokenPath: string;
  status: SafeHavenConfigStatus;
  enabled: boolean;
  vaEnabled: boolean;
  transfersEnabled: boolean;
  webhooksEnabled: boolean;
};

export type SafeHavenAccessToken = {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
};

export type SafeHavenProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: SafeHavenProviderErrorCode; error: string };

export type SafeHavenWebhookEvent = {
  eventId: string | null;
  eventType: string | null;
  providerReference: string | null;
  transactionReference: string | null;
  amount: number | null;
  status: string | null;
  raw: Record<string, unknown>;
};

export type SafeHavenVirtualAccountPayload = {
  userId: string;
  accountName: string;
  email?: string | null;
  phone?: string | null;
  idempotencyKey?: string;
};

export type SafeHavenTransferPayload = {
  amount: number;
  narration: string;
  destinationAccount: string;
  destinationBankCode: string;
  idempotencyKey: string;
  userId?: string | null;
};
