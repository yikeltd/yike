/**
 * Wallet module — financial identity (balances, credits, reserves).
 * Billing adapters load lazily so YIP unit tests can boot without Next `server-only`.
 */
import { isWalletEnabled } from "../flags";
import type { ModuleHealth } from "../types";

export type WalletBalances = {
  available: number;
  pending: number;
  currency: string;
};

export type WalletModule = {
  isEnabled: () => boolean;
  getBalances: (accountId: string) => Promise<WalletBalances>;
  credit: (input: {
    accountId: string;
    amount: number;
    reason: string;
    actorId: string;
    reference?: string;
  }) => Promise<{ ok: boolean; error?: string; balance?: number }>;
  debit: (input: {
    accountId: string;
    amount: number;
    reason: string;
    actorId: string;
    reference?: string;
  }) => Promise<{ ok: boolean; error?: string; balance?: number }>;
  health: () => ModuleHealth;
};

async function billing() {
  return import("@/lib/leads/billing");
}

async function recordWalletLedger(input: {
  accountId: string;
  amount: number;
  type: "wallet_credit" | "wallet_debit";
  actorId: string;
  reference: string;
  reason: string;
}): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { recordFinancialEvent } = await import("@/lib/financial/record-events");
    const admin = createAdminClient();
    if (!admin) return;
    await recordFinancialEvent({
      admin,
      type: input.type,
      accountId: `wallet:${input.accountId}`,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      capability: "financial.wallet",
      provider: "wallet",
      actorId: input.actorId,
      status: "completed",
      metadata: { reason: input.reason },
    });
  } catch {
    // Fail-soft
  }
}

export function createWalletModule(): WalletModule {
  return {
    isEnabled: () => isWalletEnabled(),
    getBalances: async (accountId) => {
      const { getAgentWalletBalance } = await billing();
      const available = await getAgentWalletBalance(accountId);
      return { available, pending: 0, currency: "NGN" };
    },
    credit: async (input) => {
      if (!isWalletEnabled()) return { ok: false, error: "Wallet disabled" };
      const { adjustAgentWallet } = await billing();
      const result = await adjustAgentWallet({
        agentId: input.accountId,
        amount: Math.abs(input.amount),
        reason: input.reason,
        actorId: input.actorId,
        reference: input.reference,
        ledgerType: "topup",
      });
      if (result.ok) {
        await recordWalletLedger({
          accountId: input.accountId,
          amount: Math.abs(input.amount),
          type: "wallet_credit",
          actorId: input.actorId,
          reference: input.reference ?? `wallet-credit-${Date.now()}`,
          reason: input.reason,
        });
      }
      return result;
    },
    debit: async (input) => {
      if (!isWalletEnabled()) return { ok: false, error: "Wallet disabled" };
      const { adjustAgentWallet } = await billing();
      const result = await adjustAgentWallet({
        agentId: input.accountId,
        amount: -Math.abs(input.amount),
        reason: input.reason,
        actorId: input.actorId,
        reference: input.reference,
        ledgerType: "adjustment",
      });
      if (result.ok) {
        await recordWalletLedger({
          accountId: input.accountId,
          amount: Math.abs(input.amount),
          type: "wallet_debit",
          actorId: input.actorId,
          reference: input.reference ?? `wallet-debit-${Date.now()}`,
          reason: input.reason,
        });
      }
      return result;
    },
    health: () => ({
      id: "wallet",
      label: "Wallet",
      status: isWalletEnabled() ? "healthy" : "disabled",
      detail: isWalletEnabled()
        ? "Wallet ledger operational (agent_wallets)"
        : "ENABLE_WALLET off",
      enabled: isWalletEnabled(),
    }),
  };
}
