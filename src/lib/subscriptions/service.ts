import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { logPaymentAudit } from "@/lib/payments/audit";
import { getRevenueOffers } from "@/lib/revenue-pricing/service";
import {
  isPaidPlan,
  isSubscriptionPlanCode,
  SUBSCRIPTION_DURATION_DAYS,
  SUBSCRIPTION_ELIGIBLE_ACCOUNT_TYPES,
  type PlanFeatures,
  type SubscriptionPlanCode,
  type SubscriptionStatus,
} from "@/lib/subscriptions/constants";

export type SubscriptionPlan = {
  id: string;
  name: string;
  plan_code: SubscriptionPlanCode;
  monthly_price: number;
  active_listing_limit: number | null;
  features: PlanFeatures;
  status: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string | null;
  expires_at: string | null;
  payment_reference: string | null;
  payment_order_id: string | null;
  founding_price_locked: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
};

export type SubscriptionServiceResult =
  | { ok: true; subscription: UserSubscription }
  | { ok: false; error: string; code?: string };

export const SUBSCRIPTION_STATUS_TABS: SubscriptionStatus[] = [
  "active",
  "expired",
  "cancelled",
  "pending",
];

function parseFeatures(raw: unknown): PlanFeatures {
  const f = (raw ?? {}) as Partial<PlanFeatures>;
  return {
    analytics: f.analytics === "advanced" ? "advanced" : "basic",
    verification: f.verification === "business_included" ? "business_included" : "basic",
    featured_discount: Number(f.featured_discount ?? 0),
    boost_discount: Number(f.boost_discount ?? 0),
    priority_review: Boolean(f.priority_review),
    agency_profile: Boolean(f.agency_profile),
    developer_profile: Boolean(f.developer_profile),
    project_showcase: Boolean(f.project_showcase),
    homepage_eligible: Boolean(f.homepage_eligible),
    team_support: Boolean(f.team_support),
    priority_support: Boolean(f.priority_support),
    lead_insights: Boolean(f.lead_insights),
    lead_export: Boolean(f.lead_export),
  };
}

export function mapPlanRow(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: row.id as string,
    name: row.name as string,
    plan_code: row.plan_code as SubscriptionPlanCode,
    monthly_price: Number(row.monthly_price ?? 0),
    active_listing_limit:
      row.active_listing_limit === null || row.active_listing_limit === undefined
        ? null
        : Number(row.active_listing_limit),
    features: parseFeatures(row.features),
    status: row.status as string,
  };
}

export async function getPlanByCode(
  admin: SupabaseClient,
  planCode: SubscriptionPlanCode
): Promise<SubscriptionPlan | null> {
  const { data } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("plan_code", planCode)
    .eq("status", "active")
    .maybeSingle();

  return data ? mapPlanRow(data as Record<string, unknown>) : null;
}

export async function listActivePlans(admin: SupabaseClient): Promise<SubscriptionPlan[]> {
  const { data } = await admin
    .from("subscription_plans")
    .select("*")
    .eq("status", "active")
    .order("monthly_price", { ascending: true });

  return (data ?? []).map((row) => mapPlanRow(row as Record<string, unknown>));
}

export async function getActiveUserSubscription(
  admin: SupabaseClient,
  userId: string
): Promise<UserSubscription | null> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("user_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown> & { plan?: Record<string, unknown> };
  const sub: UserSubscription = {
    id: row.id as string,
    user_id: row.user_id as string,
    plan_id: row.plan_id as string,
    status: row.status as SubscriptionStatus,
    starts_at: (row.starts_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    payment_reference: (row.payment_reference as string | null) ?? null,
    payment_order_id: (row.payment_order_id as string | null) ?? null,
    founding_price_locked: Boolean(row.founding_price_locked),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    plan: row.plan ? mapPlanRow(row.plan) : undefined,
  };

  return sub;
}

export function resolveListingLimitFromPlan(plan: SubscriptionPlan): number | null {
  return plan.active_listing_limit;
}

async function grantBusinessVerificationIncluded(
  admin: SupabaseClient,
  userId: string,
  paymentOrderId: string
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("seller_verification_level")
    .eq("id", userId)
    .single();

  if (profile?.seller_verification_level === "business") return;

  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("seller_verifications")
    .select("id, status")
    .eq("user_id", userId)
    .eq("verification_level", "business")
    .in("status", ["pending", "under_review", "approved"])
    .maybeSingle();

  if (!existing) {
    await admin.from("seller_verifications").insert({
      user_id: userId,
      verification_level: "business",
      status: "approved",
      documents: { source: "subscription_included" },
      payment_order_id: paymentOrderId || null,
      review_notes: "Included with subscription",
      submitted_at: now,
      reviewed_at: now,
      created_at: now,
      updated_at: now,
    });
  } else if (existing.status !== "approved") {
    await admin
      .from("seller_verifications")
      .update({ status: "approved", reviewed_at: now, updated_at: now })
      .eq("id", existing.id as string);
  }

  await admin
    .from("profiles")
    .update({ seller_verification_level: "business", updated_at: now })
    .eq("id", userId);
}

async function syncProfileForPlan(
  admin: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan,
  options?: { foundingMember?: boolean; paymentOrderId?: string }
): Promise<void> {
  const now = new Date().toISOString();
  const listingLimit = resolveListingLimitFromPlan(plan);
  const updates: Record<string, unknown> = {
    subscription_plan_code: plan.plan_code,
    listing_limit: listingLimit,
    listing_limit_reason: `subscription:${plan.plan_code}`,
    listing_limit_updated_at: now,
    updated_at: now,
  };

  if (options?.foundingMember) {
    updates.founding_member = true;
  }

  if (plan.features.verification === "business_included") {
    await grantBusinessVerificationIncluded(admin, userId, options?.paymentOrderId ?? "");
  }

  await admin.from("profiles").update(updates).eq("id", userId);
}

async function revertProfileToFree(admin: SupabaseClient, userId: string): Promise<void> {
  const freePlan = await getPlanByCode(admin, "free");
  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({
      subscription_plan_code: "free",
      listing_limit: freePlan?.active_listing_limit ?? 5,
      listing_limit_reason: "subscription:free",
      listing_limit_updated_at: now,
      updated_at: now,
    })
    .eq("id", userId);
}

export async function activateSubscriptionFromPayment(
  admin: SupabaseClient,
  input: {
    userId: string;
    planCode: string;
    paymentOrderId: string;
    paymentReference: string;
    durationDays?: number;
  }
): Promise<SubscriptionServiceResult> {
  if (!isSubscriptionPlanCode(input.planCode) || !isPaidPlan(input.planCode)) {
    return { ok: false, error: "Invalid subscription plan", code: "invalid_plan" };
  }

  const plan = await getPlanByCode(admin, input.planCode);
  if (!plan) {
    return { ok: false, error: "Plan not found", code: "not_found" };
  }

  const { data: existingActive } = await admin
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .maybeSingle();

  if (existingActive?.id) {
    await admin
      .from("user_subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", existingActive.id as string);
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + (input.durationDays ?? SUBSCRIPTION_DURATION_DAYS));

  const offers = await getRevenueOffers(admin);
  const foundingLocked = offers.founding_subscription_offer;

  const { data: sub, error } = await admin
    .from("user_subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: plan.id,
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_reference: input.paymentReference,
      payment_order_id: input.paymentOrderId,
      founding_price_locked: foundingLocked,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select("*")
    .single();

  if (error || !sub) {
    return { ok: false, error: error?.message ?? "Could not activate subscription" };
  }

  await syncProfileForPlan(admin, input.userId, plan, {
    foundingMember: foundingLocked,
    paymentOrderId: input.paymentOrderId,
  });

  logPaymentAudit({
    action: "subscription_activated",
    actorId: input.userId,
    targetId: input.paymentOrderId,
    targetUserId: input.userId,
    metadata: {
      plan_code: input.planCode,
      reference: input.paymentReference,
      expires_at: expires.toISOString(),
    },
  });

  return {
    ok: true,
    subscription: {
      ...(sub as UserSubscription),
      plan,
    },
  };
}

export async function renewSubscriptionCheckout(
  admin: SupabaseClient,
  userId: string
): Promise<{ plan: SubscriptionPlan; amount: number } | null> {
  const active = await getActiveUserSubscription(admin, userId);
  const planCode =
    active?.plan?.plan_code ??
    ((await admin.from("profiles").select("subscription_plan_code").eq("id", userId).single())
      .data?.subscription_plan_code as SubscriptionPlanCode | undefined);

  if (!planCode || !isPaidPlan(planCode)) return null;

  const plan = await getPlanByCode(admin, planCode);
  if (!plan) return null;

  return { plan, amount: plan.monthly_price };
}

export async function expireDueSubscriptions(admin: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("user_subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lt("expires_at", now);

  if (!data?.length) return 0;

  await admin
    .from("user_subscriptions")
    .update({ status: "expired", updated_at: now })
    .in(
      "id",
      data.map((r) => r.id as string)
    );

  const userIds = [...new Set(data.map((r) => r.user_id as string))];
  for (const userId of userIds) {
    const stillActive = await getActiveUserSubscription(admin, userId);
    if (!stillActive) {
      await revertProfileToFree(admin, userId);
    }
  }

  return data.length;
}

export function canSubscribe(profile: Pick<Profile, "account_type"> | null): boolean {
  if (!profile?.account_type) return true;
  return SUBSCRIPTION_ELIGIBLE_ACCOUNT_TYPES.has(profile.account_type);
}

export async function getSubscriptionDashboardMetrics(admin: SupabaseClient): Promise<{
  activeSubscribers: number;
  mrr: number;
  expiringSoon: number;
  subscriptionRevenue30d: number;
}> {
  const d30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  const [{ count: activeSubscribers }, { data: activeSubs }, { data: revenueRows }, { count: expiringSoon }] =
    await Promise.all([
      admin
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      admin
        .from("user_subscriptions")
        .select("plan:subscription_plans(monthly_price)")
        .eq("status", "active"),
      admin
        .from("payment_orders")
        .select("amount")
        .eq("order_type", "subscription")
        .eq("status", "successful")
        .gte("paid_at", d30),
      admin
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .not("expires_at", "is", null)
        .lte("expires_at", soon.toISOString())
        .gt("expires_at", new Date().toISOString()),
    ]);

  const mrr = (activeSubs ?? []).reduce((sum, row) => {
    const plan = (row as { plan?: { monthly_price?: number } }).plan;
    return sum + Number(plan?.monthly_price ?? 0);
  }, 0);

  const subscriptionRevenue30d = (revenueRows ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0
  );

  return {
    activeSubscribers: activeSubscribers ?? 0,
    mrr,
    expiringSoon: expiringSoon ?? 0,
    subscriptionRevenue30d,
  };
}
