import {
  isCommissionsEnabled,
  isPromotionsEnabled,
  isRefundsEnabled,
  isSettlementEnabled,
  isSubscriptionsEnabled,
} from "../flags";
import type { ModuleHealth } from "../types";

function frameworkHealth(
  id: string,
  label: string,
  enabled: boolean,
  detailOn: string
): ModuleHealth {
  return {
    id,
    label,
    status: enabled ? "healthy" : "disabled",
    detail: enabled ? detailOn : `Flag off — framework ready`,
    enabled,
  };
}

export type SettlementModule = {
  isEnabled: () => boolean;
  health: () => ModuleHealth;
};

export type PromotionModule = {
  isEnabled: () => boolean;
  health: () => ModuleHealth;
};

export type SubscriptionModule = {
  isEnabled: () => boolean;
  health: () => ModuleHealth;
};

export type CommissionModule = {
  isEnabled: () => boolean;
  health: () => ModuleHealth;
};

export type RefundModule = {
  isEnabled: () => boolean;
  health: () => ModuleHealth;
};

export type ProviderModule = {
  list: () => string[];
  health: () => ModuleHealth;
};

export function createSettlementModule(): SettlementModule {
  return {
    isEnabled: () => isSettlementEnabled(),
    health: () =>
      frameworkHealth(
        "settlement",
        "Settlement",
        isSettlementEnabled(),
        "Settlement / escrow framework active"
      ),
  };
}

export function createPromotionModule(): PromotionModule {
  return {
    isEnabled: () => isPromotionsEnabled(),
    health: () =>
      frameworkHealth(
        "promotion",
        "Promotion",
        isPromotionsEnabled(),
        "Featured / boost / ads via Payment module"
      ),
  };
}

export function createSubscriptionModule(): SubscriptionModule {
  return {
    isEnabled: () => isSubscriptionsEnabled(),
    health: () =>
      frameworkHealth(
        "subscription",
        "Subscription",
        isSubscriptionsEnabled(),
        "Dealer / pro plans via Payment module"
      ),
  };
}

export function createCommissionModule(): CommissionModule {
  return {
    isEnabled: () => isCommissionsEnabled(),
    health: () =>
      frameworkHealth(
        "commission",
        "Commission",
        isCommissionsEnabled(),
        "Marketplace fee engine ready"
      ),
  };
}

export function createRefundModule(): RefundModule {
  return {
    isEnabled: () => isRefundsEnabled(),
    health: () =>
      frameworkHealth(
        "refund",
        "Refund",
        isRefundsEnabled(),
        "Refund workflow via Payment module"
      ),
  };
}

export function createProviderModule(): ProviderModule {
  return {
    list: () => ["paystack", "flutterwave", "monnify", "stripe", "wallet"],
    health: () => ({
      id: "provider",
      label: "Providers",
      status: "healthy",
      detail: "Paystack live adapter · others stubbed",
      enabled: true,
    }),
  };
}
