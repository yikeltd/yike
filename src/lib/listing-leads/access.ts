import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { FREE_PLAN_LEAD_LIMIT } from "@/lib/listing-leads/constants";
import { getActiveUserSubscription } from "@/lib/subscriptions/service";

export type LeadInsightsAccess = {
  hasFullHistory: boolean;
  hasAnalytics: boolean;
  hasExport: boolean;
  hasFiltering: boolean;
  historyLimit: number | null;
  planLabel: string;
};

const PAID_PLANS_WITH_INSIGHTS = new Set(["pro_agent", "agency", "developer"]);

export async function getLeadInsightsAccess(
  admin: SupabaseClient,
  profile: Pick<Profile, "id" | "subscription_plan_code" | "lead_insights_until">
): Promise<LeadInsightsAccess> {
  const sub = await getActiveUserSubscription(admin, profile.id);
  const planCode = sub?.plan?.plan_code ?? profile.subscription_plan_code ?? "free";

  const standaloneUntil = profile.lead_insights_until
    ? new Date(profile.lead_insights_until).getTime() > Date.now()
    : false;

  const planIncludes =
    PAID_PLANS_WITH_INSIGHTS.has(planCode) || Boolean(sub?.plan?.features.lead_insights);

  const hasInsights = planIncludes || standaloneUntil || planCode === "lead_insights";

  if (hasInsights) {
    return {
      hasFullHistory: true,
      hasAnalytics: true,
      hasExport: true,
      hasFiltering: true,
      historyLimit: null,
      planLabel: planIncludes ? planCode : "lead_insights",
    };
  }

  return {
    hasFullHistory: false,
    hasAnalytics: false,
    hasExport: false,
    hasFiltering: false,
    historyLimit: FREE_PLAN_LEAD_LIMIT,
    planLabel: "free",
  };
}
