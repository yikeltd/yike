import { COMPANY_EMAIL, SITE_NAME } from "@/lib/constants";

/** Canonical Resend from header — always hello@yike.ng unless env explicitly matches. */
export const TRANSACTIONAL_FROM = `${SITE_NAME} <${COMPANY_EMAIL}>`;

function normalizeFrom(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return TRANSACTIONAL_FROM;
  if (trimmed.includes("<") && trimmed.includes(">")) return trimmed;
  return `${SITE_NAME} <${trimmed}>`;
}

/** From address for all outbound transactional email (auth OTP, notifications, alerts). */
export function transactionalFromAddress(): string {
  const override =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!override) return TRANSACTIONAL_FROM;

  const normalized = normalizeFrom(override);
  if (normalized.toLowerCase().includes(COMPANY_EMAIL)) {
    return normalized;
  }

  return TRANSACTIONAL_FROM;
}

export function isTransactionalFromConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function transactionalFromDomain(): string {
  const from = transactionalFromAddress();
  const match = from.match(/@([^>\s]+)/);
  return match?.[1]?.replace(/>.*$/, "") ?? "yike.ng";
}
