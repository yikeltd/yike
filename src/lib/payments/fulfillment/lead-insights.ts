import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentOrder } from "@/types/database";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscriptions/constants";

export type LeadInsightsFulfillmentResult =
  | { ok: true; alreadyFulfilled: boolean }
  | { ok: false; error: string };

export async function fulfillLeadInsightsOrder(
  admin: SupabaseClient,
  order: PaymentOrder
): Promise<LeadInsightsFulfillmentResult> {
  const { data: profile } = await admin
    .from("profiles")
    .select("lead_insights_until")
    .eq("id", order.user_id)
    .single();

  const now = new Date();
  const base =
    profile?.lead_insights_until && new Date(profile.lead_insights_until as string) > now
      ? new Date(profile.lead_insights_until as string)
      : now;

  const expires = new Date(base);
  expires.setDate(expires.getDate() + SUBSCRIPTION_DURATION_DAYS);

  const { error } = await admin
    .from("profiles")
    .update({
      lead_insights_until: expires.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", order.user_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, alreadyFulfilled: false };
}
