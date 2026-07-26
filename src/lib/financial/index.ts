/**
 * App-facing Financial Platform entry — never import Paystack from routes.
 * Resolves the YIP financial capability when the platform is booted; otherwise
 * constructs a process-local instance (API routes without createYip()).
 */
import {
  createFinancialPlatform,
  type FinancialPlatform,
} from "@/lib/yip/capabilities/financial";

let singleton: FinancialPlatform | null = null;

export function getFinancialPlatform(): FinancialPlatform {
  if (!singleton) {
    singleton = createFinancialPlatform();
  }
  return singleton;
}

/** Test helper */
export function __resetFinancialPlatformForTests(): void {
  singleton = null;
}

export type { FinancialPlatform };
export { recordFinancialEvent } from "./record-events";
export {
  isPaymentsEnabled,
  isWalletEnabled,
  isSettlementEnabled,
  getFinancialFlagSnapshot,
} from "@/lib/yip/capabilities/financial/flags";
