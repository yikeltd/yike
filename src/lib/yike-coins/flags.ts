import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { isWalletEnabled } from "@/lib/yip/capabilities/financial/flags";

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

/** User-facing Yike Coins wallet + ledger (distinct from agent lead-billing wallets). */
export function isYikeCoinsEnabled(): boolean {
  if (envFlag("ENABLE_YIKE_COINS", false)) return true;
  return isWalletEnabled() || isLaunchFeatureVisible("wallet");
}

export function isMarketplaceNativeContactEnabled(): boolean {
  return envFlag("ENABLE_MARKETPLACE_NATIVE_CONTACT", true);
}
