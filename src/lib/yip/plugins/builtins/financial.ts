/**
 * Builtin plugin — Financial Platform (one capability, many modules).
 */
import { createFinancialPlatform } from "../../capabilities/financial";
import { CAPABILITIES } from "../../registry/capabilities";
import { definePlugin } from "../define-plugin";
import type { YipPlugin } from "../types";
import {
  isPaymentsEnabled,
  isWalletEnabled,
} from "../../capabilities/financial/flags";

export function createFinancialPlugin(): YipPlugin {
  return definePlugin({
    id: "yip.financial",
    name: "Financial Platform",
    version: "1.0.0",
    description:
      "Payments, wallet, ledger, settlement, promotions, subscriptions, commissions, refunds — single financial domain.",
    capabilityType: "financial",
    provides: [CAPABILITIES.FINANCIAL_PLATFORM],
    enabledByDefault: true,
    permissions: ["finance.read", "finance.write"],
    hooks: {
      healthCheck: async () => {
        const platform = createFinancialPlatform();
        const health = platform.health();
        const status =
          health.overall === "critical"
            ? ("unhealthy" as const)
            : health.overall === "warning"
              ? ("degraded" as const)
              : ("healthy" as const);
        return {
          status,
          message: `Financial overall=${health.overall}; payments=${isPaymentsEnabled()}; wallet=${isWalletEnabled()}`,
          checkedAt: health.checkedAt,
        };
      },
    },
    registerCapabilities: (ctx) => {
      ctx.registry.register({
        id: CAPABILITIES.FINANCIAL_PLATFORM,
        version: "1.0.0",
        enabled: true,
        description: "Yike Financial Platform — permanent financial backbone",
        factory: () => createFinancialPlatform(),
      });
    },
  });
}
