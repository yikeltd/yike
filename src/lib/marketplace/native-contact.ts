/** Client-safe flag for Yike-native buyer contact (message / call / gated phone). */
export function isNativeMarketplaceContactEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE_NATIVE_CONTACT?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}
