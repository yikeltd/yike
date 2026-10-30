import {
  YIKE_COIN_TOPUP_DENOMINATIONS_NGN,
  ngnToCoins,
} from "@/lib/yike-coins/constants";
import { isProductionEnv } from "@/lib/env";

export type YikeCoinTopupPackage = {
  id: string;
  amountNgn: number;
  coins: number;
  currency: "NGN";
  /** When true, pack is for dev/staging only until business publishes production catalog. */
  devOnly?: boolean;
};

function parseEnvPackList(): number[] | null {
  const raw = process.env.YIKE_COIN_TOPUP_PACKS_NGN?.trim();
  if (!raw) return null;
  const packs = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return packs.length > 0 ? packs : null;
}

/**
 * Server-authoritative top-up catalog.
 * Production: fixed denominations until admin catalog ships (see platform pricing board for services).
 * Override for staging: YIKE_COIN_TOPUP_PACKS_NGN=500,1000,2000
 */
export function getYikeCoinTopupPackages(): YikeCoinTopupPackage[] {
  const envPacks = parseEnvPackList();
  const amounts = envPacks ?? [...YIKE_COIN_TOPUP_DENOMINATIONS_NGN];
  const devOverride = Boolean(envPacks) && !isProductionEnv();

  return amounts.map((amountNgn) => ({
    id: String(amountNgn),
    amountNgn,
    coins: ngnToCoins(amountNgn),
    currency: "NGN",
    ...(devOverride ? { devOnly: true } : {}),
  }));
}
