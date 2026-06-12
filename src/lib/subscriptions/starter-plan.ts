import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscriptions/constants";

export const STARTER_PLAN_CODE = "free" as const;

/** Listing slots by starter month (1-indexed). Month 3+ uses last value. */
export const STARTER_MONTHLY_LIMITS = [5, 3, 1] as const;

export type StarterPlanInfo = {
  isStarter: boolean;
  month: number;
  listingLimit: number;
  startedAt: string | null;
};

export function isOnStarterPlan(
  profile: Pick<Profile, "subscription_plan_code"> | null | undefined
): boolean {
  const code = profile?.subscription_plan_code;
  return !code || code === STARTER_PLAN_CODE;
}

export function getStarterPlanMonth(
  startedAt: string | Date,
  now: Date = new Date()
): number {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  if (Number.isNaN(start.getTime())) return 1;
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  if (days < 0) return 1;
  return Math.floor(days / SUBSCRIPTION_DURATION_DAYS) + 1;
}

export function getStarterListingLimit(month: number): number {
  if (month <= 1) return STARTER_MONTHLY_LIMITS[0];
  if (month === 2) return STARTER_MONTHLY_LIMITS[1];
  return STARTER_MONTHLY_LIMITS[2];
}

export type StarterPlanProfile = Partial<
  Pick<Profile, "subscription_plan_code" | "starter_plan_started_at" | "created_at">
>;

export function resolveStarterPlanInfo(profile: StarterPlanProfile | null): StarterPlanInfo {
  if (!profile || !isOnStarterPlan(profile)) {
    return { isStarter: false, month: 0, listingLimit: 0, startedAt: null };
  }

  const startedAt = profile.starter_plan_started_at ?? profile.created_at ?? null;
  const month = startedAt ? getStarterPlanMonth(startedAt) : 1;

  return {
    isStarter: true,
    month,
    listingLimit: getStarterListingLimit(month),
    startedAt,
  };
}

export function getStarterListingLimitForProfile(profile: StarterPlanProfile | null): number {
  return resolveStarterPlanInfo(profile).listingLimit;
}

export async function getStarterPlanAdminMetrics(admin: SupabaseClient): Promise<{
  starterAccounts: number;
  starterAtCap: number;
  starterMonth2OrLater: number;
  paidUpgrades30d: number;
}> {
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { data: paidPlans } = await admin
    .from("subscription_plans")
    .select("id")
    .neq("plan_code", "free");

  const paidPlanIds = (paidPlans ?? []).map((row) => row.id as string);

  const [{ data: starters }, paidUpgradesResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, starter_plan_started_at, created_at, subscription_plan_code")
      .or("subscription_plan_code.is.null,subscription_plan_code.eq.free")
      .in("role", ["agent", "agent_unverified", "agent_verified"]),
    paidPlanIds.length > 0
      ? admin
          .from("user_subscriptions")
          .select("id", { count: "exact", head: true })
          .in("plan_id", paidPlanIds)
          .gte("created_at", d30)
      : Promise.resolve({ count: 0 }),
  ]);

  const paidUpgrades30d = paidUpgradesResult.count ?? 0;

  const starterRows = starters ?? [];
  let starterAtCap = 0;
  let starterMonth2OrLater = 0;

  const starterIds = starterRows.map((row) => row.id as string);
  const activeCounts = new Map<string, number>();

  if (starterIds.length > 0) {
    const { data: listings } = await admin
      .from("properties")
      .select("agent_id")
      .in("agent_id", starterIds)
      .in("status", ["pending", "approved", "flagged"]);

    for (const row of listings ?? []) {
      const id = row.agent_id as string;
      activeCounts.set(id, (activeCounts.get(id) ?? 0) + 1);
    }
  }

  for (const row of starterRows) {
    const info = resolveStarterPlanInfo(row as Profile);
    if (info.month >= 2) starterMonth2OrLater += 1;
    const active = activeCounts.get(row.id as string) ?? 0;
    if (active >= info.listingLimit) starterAtCap += 1;
  }

  return {
    starterAccounts: starterRows.length,
    starterAtCap,
    starterMonth2OrLater,
    paidUpgrades30d,
  };
}
