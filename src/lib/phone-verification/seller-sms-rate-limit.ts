/**
 * Seller SMS hourly limit applies only after Sendchamp accepts `/verification/create`
 * (real provider_reference). Failed/network/auth attempts must not consume the budget.
 */

export const SELLER_SMS_MAX_SENDS_PER_PHONE_HOUR = 3;

export function providerReferenceAcceptedBySendchamp(
  providerReference: string | null | undefined
): boolean {
  const ref = providerReference?.trim() ?? "";
  if (!ref) return false;
  return !ref.startsWith("pending:");
}

/** Whether a session row counts toward per-phone / per-IP SMS send hourly limits. */
export function sellerSmsSendCountsTowardHourlyLimit(row: {
  status: string;
  provider_reference: string | null | undefined;
}): boolean {
  if (row.status === "expired") return false;
  if (!providerReferenceAcceptedBySendchamp(row.provider_reference)) return false;
  return row.status === "sent" || row.status === "verified";
}
