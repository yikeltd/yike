import type { SafeHavenConfig, SafeHavenConfigStatus } from "./types";

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

export function isSafeHavenEnabled(): boolean {
  return envFlag("ENABLE_SAFEHAVEN", false);
}

export function isSafeHavenVaEnabled(): boolean {
  return isSafeHavenEnabled() && envFlag("ENABLE_SAFEHAVEN_VA", false);
}

export function isSafeHavenTransfersEnabled(): boolean {
  return isSafeHavenEnabled() && envFlag("ENABLE_SAFEHAVEN_TRANSFERS", false);
}

export function isSafeHavenWebhooksEnabled(): boolean {
  return envFlag("ENABLE_SAFEHAVEN_WEBHOOKS", true);
}

function decodePrivateKeyPem(base64: string): string | null {
  const trimmed = base64.trim();
  if (!trimmed) return null;

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.includes("BEGIN")) return decoded;
  } catch {
    // fall through to PEM wrap
  }

  const wrapped = trimmed.replace(/\s+/g, "");
  if (!wrapped) return null;
  const lines = wrapped.match(/.{1,64}/g)?.join("\n") ?? wrapped;
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

function present(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

export function getSafeHavenRequiredFieldsPresent(): {
  baseUrl: boolean;
  clientId: boolean;
  clientSecret: boolean;
  privateKey: boolean;
} {
  return {
    baseUrl: present(process.env.SAFEHAVEN_BASE_URL),
    clientId: present(process.env.SAFEHAVEN_CLIENT_ID),
    clientSecret: present(process.env.SAFEHAVEN_CLIENT_SECRET),
    privateKey: present(process.env.SAFEHAVEN_PRIVATE_KEY_BASE64),
  };
}

export function isSafeHavenConfigured(): boolean {
  if (!isSafeHavenEnabled()) return false;
  const fields = getSafeHavenRequiredFieldsPresent();
  return (
    fields.baseUrl &&
    fields.clientId &&
    fields.clientSecret &&
    fields.privateKey
  );
}

export function getSafeHavenConfigStatus(): SafeHavenConfigStatus {
  const fields = getSafeHavenRequiredFieldsPresent();
  const anyCredentialPresent =
    fields.baseUrl ||
    fields.clientId ||
    fields.clientSecret ||
    fields.privateKey ||
    present(process.env.SAFEHAVEN_SETTLEMENT_ACCOUNT) ||
    present(process.env.SAFEHAVEN_WEBHOOK_SECRET) ||
    present(process.env.SAFEHAVEN_BUSINESS_ID);

  if (!isSafeHavenEnabled()) {
    if (anyCredentialPresent && !isSafeHavenConfigured()) {
      return "awaiting_credentials";
    }
    return "disabled";
  }
  if (isSafeHavenConfigured()) return "configured";
  return "awaiting_credentials";
}

export function getSafeHavenConfig(): SafeHavenConfig {
  const fields = getSafeHavenRequiredFieldsPresent();
  const privateKeyRaw = process.env.SAFEHAVEN_PRIVATE_KEY_BASE64?.trim() ?? "";
  const status = getSafeHavenConfigStatus();

  return {
    env: process.env.SAFEHAVEN_ENV?.trim() || "sandbox",
    baseUrl: process.env.SAFEHAVEN_BASE_URL?.trim() || null,
    clientId: process.env.SAFEHAVEN_CLIENT_ID?.trim() || null,
    clientSecret: process.env.SAFEHAVEN_CLIENT_SECRET?.trim() || null,
    privateKeyPem: privateKeyRaw ? decodePrivateKeyPem(privateKeyRaw) : null,
    webhookSecret: process.env.SAFEHAVEN_WEBHOOK_SECRET?.trim() || null,
    businessId: process.env.SAFEHAVEN_BUSINESS_ID?.trim() || null,
    settlementAccount: process.env.SAFEHAVEN_SETTLEMENT_ACCOUNT?.trim() || null,
    oauthTokenPath:
      process.env.SAFEHAVEN_OAUTH_TOKEN_PATH?.trim() || "/oauth2/token",
    status,
    enabled: isSafeHavenEnabled(),
    vaEnabled: isSafeHavenVaEnabled(),
    transfersEnabled: isSafeHavenTransfersEnabled(),
    webhooksEnabled: isSafeHavenWebhooksEnabled(),
  };
}

export function getSafeHavenConfigSummary() {
  const config = getSafeHavenConfig();
  const fields = getSafeHavenRequiredFieldsPresent();

  return {
    status: config.status,
    environment: config.env,
    enabled: config.enabled,
    vaEnabled: config.vaEnabled,
    transfersEnabled: config.transfersEnabled,
    webhooksEnabled: config.webhooksEnabled,
    clientIdPresent: fields.clientId,
    clientSecretPresent: fields.clientSecret,
    privateKeyPresent: fields.privateKey,
    baseUrlPresent: fields.baseUrl,
    webhookSecretPresent: Boolean(config.webhookSecret),
    businessIdPresent: Boolean(config.businessId),
    settlementAccountConfigured: Boolean(config.settlementAccount),
    webhookUrl: "https://yike.ng/api/webhooks/safehaven",
  };
}

/** When ENABLE_SAFEHAVEN=true, missing required keys should surface in admin — never crash build. */
export function validateSafeHavenEnvForRuntime(): string[] {
  if (!isSafeHavenEnabled()) return [];
  const missing: string[] = [];
  const fields = getSafeHavenRequiredFieldsPresent();
  if (!fields.baseUrl) missing.push("SAFEHAVEN_BASE_URL");
  if (!fields.clientId) missing.push("SAFEHAVEN_CLIENT_ID");
  if (!fields.clientSecret) missing.push("SAFEHAVEN_CLIENT_SECRET");
  if (!fields.privateKey) missing.push("SAFEHAVEN_PRIVATE_KEY_BASE64");
  return missing;
}
