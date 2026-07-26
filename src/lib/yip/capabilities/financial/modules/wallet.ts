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
      return adjustAgentWallet({
        agentId: input.accountId,
        amount: Math.abs(input.amount),
        reason: input.reason,
        actorId: input.actorId,
        reference: input.reference,
        ledgerType: "topup",
      });
    },
    debit: async (input) => {
      if (!isWalletEnabled()) return { ok: false, error: "Wallet disabled" };
      const { adjustAgentWallet } = await billing();
      return adjustAgentWallet({
        agentId: input.accountId,
        amount: -Math.abs(input.amount),
        reason: input.reason,
        actorId: input.actorId,
        reference: input.reference,
        ledgerType: "adjustment",
      });
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
