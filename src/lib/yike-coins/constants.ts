/** Official platform credit branding */
export const YIKE_COINS_PRODUCT_NAME = "Yike Coins";

/** Nominal spending value: 1 coin = ₦1 on approved Yike services (not cash). */
export const YIKE_COIN_NGN_NOMINAL = 1;

/** Connected video calls included per Nigeria calendar day (Africa/Lagos). */
export const FREE_CONNECTED_VIDEO_CALLS_PER_DAY = 3;

export const YIKE_COINS_TIMEZONE = "Africa/Lagos";

/** Approved top-up packs (NGN paid via Paystack → same number of coins). */
export const YIKE_COIN_TOPUP_DENOMINATIONS_NGN = [500, 1000, 2000, 5000, 10000] as const;

export type YikeCoinTopupDenomination =
  (typeof YIKE_COIN_TOPUP_DENOMINATIONS_NGN)[number];

export function ngnToCoins(ngnAmount: number): number {
  if (!Number.isFinite(ngnAmount) || ngnAmount <= 0) return 0;
  return Math.round(ngnAmount / YIKE_COIN_NGN_NOMINAL);
}

export function formatYikeCoins(amount: number): string {
  return formatYc(amount);
}

/** User-facing wallet abbreviation (plain text, never HTML entities). */
export const YIKE_COIN_ABBR = "YC";

/** Normalize legacy/double-encoded YC labels from ledger or copy. */
export function normalizeYcText(text: string): string {
  return text
    .replace(/Y&#x43;/gi, YIKE_COIN_ABBR)
    .replace(/Y&#67;/gi, YIKE_COIN_ABBR)
    .replace(/Y&(?:#x3[Cc]|#60);?/gi, YIKE_COIN_ABBR);
}

/** User-facing wallet abbreviation */
export function formatYc(amount: number): string {
  return `${amount.toLocaleString("en-NG")} ${YIKE_COIN_ABBR}`;
}

/** Full product label where explanation helps */
export function formatYikeCoinsLong(amount: number): string {
  return `${amount.toLocaleString("en-NG")} ${amount === 1 ? "Yike Coin" : "Yike Coins"}`;
}

export function formatCoinNairaEquivalent(coins: number): string {
  const naira = coins * YIKE_COIN_NGN_NOMINAL;
  return `₦${naira.toLocaleString("en-NG")} nominal value on eligible services`;
}
