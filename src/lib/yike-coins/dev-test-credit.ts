import { isProductionEnv } from "@/lib/env";

/** Dev-only self-serve test credits — never enabled on production. */
export function isDevYikeCoinTestCreditEnabled(): boolean {
  if (isProductionEnv()) return false;
  const raw = process.env.YIKE_DEV_COIN_TEST_CREDIT?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function devYikeCoinTestCreditMaxPerRequest(): number {
  const raw = Number(process.env.YIKE_DEV_COIN_TEST_CREDIT_MAX ?? 5000);
  if (!Number.isFinite(raw) || raw <= 0) return 5000;
  return Math.min(Math.floor(raw), 50_000);
}
