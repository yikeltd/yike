/**
 * Financial Platform — single YIP capability with internal modules.
 * Application code depends on this façade, never on Paystack or ad-hoc wallet DB.
 */
import { createAuditModule, type AuditModule } from "./modules/audit";
import { createLedgerModule, type LedgerModule } from "./modules/ledger";
import { createPaymentModule, type PaymentModule } from "./modules/payment";
import {
  createCommissionModule,
  createPromotionModule,
  createProviderModule,
  createRefundModule,
  createSettlementModule,
  createSubscriptionModule,
  type CommissionModule,
  type PromotionModule,
  type ProviderModule,
  type RefundModule,
  type SettlementModule,
  type SubscriptionModule,
} from "./modules/frameworks";
import {
  createTransactionModule,
  type TransactionModule,
} from "./modules/transaction";
import { createWalletModule, type WalletModule } from "./modules/wallet";
import { getFinancialFlagSnapshot } from "./flags";
import type { FinancialHealth, ModuleHealth } from "./types";

export type FinancialPlatform = {
  /** Domain version */
  version: string;
  payment: PaymentModule;
  wallet: WalletModule;
  ledger: LedgerModule;
  transaction: TransactionModule;
  settlement: SettlementModule;
  promotion: PromotionModule;
  subscription: SubscriptionModule;
  commission: CommissionModule;
  refund: RefundModule;
  provider: ProviderModule;
  audit: AuditModule;
  health: () => FinancialHealth;
};

function worst(
  statuses: ModuleHealth["status"][]
): FinancialHealth["overall"] {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  const active = statuses.filter((s) => s !== "disabled");
  if (active.length === 0) return "disabled";
  return "healthy";
}

export function createFinancialPlatform(): FinancialPlatform {
  const payment = createPaymentModule();
  const wallet = createWalletModule();
  const ledger = createLedgerModule();
  const transaction = createTransactionModule();
  const settlement = createSettlementModule();
  const promotion = createPromotionModule();
  const subscription = createSubscriptionModule();
  const commission = createCommissionModule();
  const refund = createRefundModule();
  const provider = createProviderModule();
  const audit = createAuditModule();

  return {
    version: "1.0.0",
    payment,
    wallet,
    ledger,
    transaction,
    settlement,
    promotion,
    subscription,
    commission,
    refund,
    provider,
    audit,
    health: () => {
      const modules = [
        payment.health(),
        wallet.health(),
        ledger.health(),
        transaction.health(),
        settlement.health(),
        promotion.health(),
        subscription.health(),
        commission.health(),
        refund.health(),
        provider.health(),
        audit.health(),
      ];
      return {
        overall: worst(modules.map((m) => m.status)),
        modules,
        flags: getFinancialFlagSnapshot() as unknown as Record<string, boolean>,
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
