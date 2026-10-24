import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformServiceCode =
  | "video_call_connected"
  | "listing_boost"
  | "wallet_topup";

export type ResolvedServicePrice =
  | { ok: true; serviceCode: PlatformServiceCode; priceCoins: number; label: string }
  | { ok: false; error: string; code: "not_configured" | "inactive" | "not_found" };

export async function resolveActiveServicePrice(
  admin: SupabaseClient,
  serviceCode: PlatformServiceCode
): Promise<ResolvedServicePrice> {
  const { data } = await admin
    .from("platform_service_pricing")
    .select("service_code, price_coins, label, active")
    .eq("service_code", serviceCode)
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "Service not found", code: "not_found" };
  }
  if (!data.active) {
    return { ok: false, error: "Paid feature is not available yet", code: "inactive" };
  }
  const price = data.price_coins;
  if (price == null || !Number.isInteger(price) || price <= 0) {
    return { ok: false, error: "Price awaiting approval", code: "not_configured" };
  }

  return {
    ok: true,
    serviceCode,
    priceCoins: price,
    label: data.label ?? serviceCode,
  };
}

/** Master switch for coin-based listing boosts (per-plan NGN comes from boost catalog). */
export async function isListingBoostCoinPurchaseEnabled(
  admin: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string; code: "inactive" | "not_found" }> {
  const { data } = await admin
    .from("platform_service_pricing")
    .select("active")
    .eq("service_code", "listing_boost")
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "Service not found", code: "not_found" };
  }
  if (!data.active) {
    return { ok: false, error: "Coin-based boosts are not enabled", code: "inactive" };
  }
  return { ok: true };
}
