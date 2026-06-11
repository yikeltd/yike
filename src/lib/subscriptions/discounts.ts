import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveUserSubscription } from "@/lib/subscriptions/service";

export type DiscountProduct = "featured" | "boost";

export async function getSubscriptionDiscountRate(
  admin: SupabaseClient,
  userId: string,
  product: DiscountProduct
): Promise<number> {
  const sub = await getActiveUserSubscription(admin, userId);
  const features = sub?.plan?.features;
  if (!features) return 0;

  const rate = product === "featured" ? features.featured_discount : features.boost_discount;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.min(rate, 0.5);
}

export function applyDiscount(amount: number, rate: number): number {
  if (rate <= 0) return amount;
  return Math.max(0, Math.round(amount * (1 - rate)));
}
