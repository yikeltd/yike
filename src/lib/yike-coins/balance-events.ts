export const YIKE_COINS_BALANCE_CHANGED_EVENT = "yike-coins-balance-changed";

export function dispatchYikeCoinsBalanceChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(YIKE_COINS_BALANCE_CHANGED_EVENT));
}
