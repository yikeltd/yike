/**
 * Financial Platform flags — configuration-only activation.
 * Prefer these over direct Paystack / wallet env sprawl.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return defaultValue;
}

/** Unified payments master switch (also honors legacy ENABLE_FEATURED_PAYMENTS). */
export function isPaymentsEnabled(): boolean {
  if (envFlag("ENABLE_PAYMENTS", false)) return true;
  return envFlag("ENABLE_FEATURED_PAYMENTS", false);
}

export function isWalletEnabled(): boolean {
  return envFlag("ENABLE_WALLET", false);
}

export function isSettlementEnabled(): boolean {
  return envFlag("ENABLE_SETTLEMENT", false) || envFlag("ENABLE_ESCROW", false);
}

export function isPromotionsEnabled(): boolean {
  return envFlag("ENABLE_PROMOTIONS", false) || isPaymentsEnabled();
}

export function isSubscriptionsEnabled(): boolean {
  return envFlag("ENABLE_SUBSCRIPTIONS", false) || isPaymentsEnabled();
}

export function isCommissionsEnabled(): boolean {
  return envFlag("ENABLE_COMMISSIONS", false);
}

export function isRefundsEnabled(): boolean {
  return envFlag("ENABLE_REFUNDS", true);
}

export type FinancialFlagSnapshot = {
  payments: boolean;
  wallet: boolean;
  settlement: boolean;
  promotions: boolean;
  subscriptions: boolean;
  commissions: boolean;
  refunds: boolean;
};

export function getFinancialFlagSnapshot(): FinancialFlagSnapshot {
  return {
    payments: isPaymentsEnabled(),
    wallet: isWalletEnabled(),
    settlement: isSettlementEnabled(),
    promotions: isPromotionsEnabled(),
    subscriptions: isSubscriptionsEnabled(),
    commissions: isCommissionsEnabled(),
    refunds: isRefundsEnabled(),
  };
}
