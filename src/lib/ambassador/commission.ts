import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_HOLD_DAYS,
  lagosYearMonth,
  type RevenueSourceType,
} from "./constants";
import { detectSelfReferral, flagAmbassadorFraud } from "./fraud";

export type RecordCommissionInput = {
  sourceUserId: string;
  revenueSourceType: RevenueSourceType;
  paymentReference: string;
  grossAmount: number;
  netAmount: number;
  hiddenFromAmbassador?: boolean;
  hiddenReason?: string | null;
};

export async function getProgramConfig(client: SupabaseClient): Promise<{
  commission_hold_days: number;
  default_commission_rate: number;
  inactivity_days: number;
}> {
  const { data } = await client
    .from("ambassador_program_config")
    .select("commission_hold_days, default_commission_rate, inactivity_days")
    .eq("id", true)
    .maybeSingle();

  return {
    commission_hold_days: data?.commission_hold_days ?? DEFAULT_HOLD_DAYS,
    default_commission_rate: Number(data?.default_commission_rate ?? DEFAULT_COMMISSION_RATE),
    inactivity_days: data?.inactivity_days ?? 90,
  };
}

export async function recordAmbassadorCommission(
  client: SupabaseClient,
  input: RecordCommissionInput
): Promise<{ ok: true; commissionId: string } | { ok: false; reason: string }> {
  if (input.netAmount <= 0) {
    return { ok: false, reason: "no_revenue" };
  }

  const { data: profile } = await client
    .from("profiles")
    .select(
      "id, referred_by_ambassador_id, attribution_locked, email, phone, whatsapp"
    )
    .eq("id", input.sourceUserId)
    .single();

  if (!profile?.referred_by_ambassador_id) {
    return { ok: false, reason: "not_attributed" };
  }

  const ambassadorId = profile.referred_by_ambassador_id as string;

  const { data: ambassador } = await client
    .from("city_ambassadors")
    .select("id, profile_id, status, commission_percentage")
    .eq("id", ambassadorId)
    .single();

  if (!ambassador || ambassador.status !== "approved") {
    return { ok: false, reason: "ambassador_inactive" };
  }

  const { data: existing } = await client
    .from("ambassador_commissions")
    .select("id")
    .eq("payment_reference", input.paymentReference)
    .maybeSingle();

  if (existing) {
    return { ok: true, commissionId: existing.id as string };
  }

  const config = await getProgramConfig(client);
  const rate = Number(ambassador.commission_percentage ?? config.default_commission_rate);
  const commissionAmount = Math.round(input.netAmount * rate * 100) / 100;
  const payableAt = new Date(
    Date.now() + config.commission_hold_days * 86_400_000
  ).toISOString();

  let fraudReview = false;
  if (ambassador.profile_id) {
    const { data: ambProfile } = await client
      .from("profiles")
      .select("email, phone, whatsapp")
      .eq("id", ambassador.profile_id)
      .maybeSingle();

    if (
      detectSelfReferral({
        ambassadorProfileId: ambassador.profile_id,
        ambassadorEmail: ambProfile?.email,
        ambassadorWhatsapp: ambProfile?.whatsapp ?? ambProfile?.phone,
        referredUserId: input.sourceUserId,
        referredEmail: profile.email,
        referredPhone: profile.phone ?? profile.whatsapp,
      })
    ) {
      fraudReview = true;
      await flagAmbassadorFraud(client, ambassadorId, "commission_self_referral");
    }
  }

  const hidden = input.hiddenFromAmbassador ?? false;
  const status = fraudReview ? "fraud_review" : "pending";

  const { data: row, error } = await client
    .from("ambassador_commissions")
    .insert({
      ambassador_id: ambassadorId,
      source_user_id: input.sourceUserId,
      payment_reference: input.paymentReference,
      revenue_source_type: input.revenueSourceType,
      gross_amount: input.grossAmount,
      net_amount: input.netAmount,
      commission_percentage: rate,
      commission_amount: commissionAmount,
      status,
      hidden_from_ambassador: hidden,
      hidden_reason: input.hiddenReason ?? null,
      fraud_review: fraudReview,
      payable_at: fraudReview ? null : payableAt,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[ambassador/commission] insert failed:", error?.message);
    return { ok: false, reason: "insert_failed" };
  }

  if (!hidden && !fraudReview) {
    await refreshAmbassadorEarnings(client, ambassadorId);
  }

  const { data: ambStats } = await client
    .from("city_ambassadors")
    .select("lifetime_generated_revenue")
    .eq("id", ambassadorId)
    .single();

  await client
    .from("city_ambassadors")
    .update({
      lifetime_generated_revenue:
        Number(ambStats?.lifetime_generated_revenue ?? 0) + input.netAmount,
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);

  return { ok: true, commissionId: row.id as string };
}

export async function refreshAmbassadorEarnings(
  client: SupabaseClient,
  ambassadorId: string
): Promise<void> {
  const period = lagosYearMonth();

  const { data: commissions } = await client
    .from("ambassador_commissions")
    .select("commission_amount, status, hidden_from_ambassador, created_at")
    .eq("ambassador_id", ambassadorId)
    .eq("hidden_from_ambassador", false)
    .not("status", "in", '("reversed")');

  let totalVisible = 0;
  let currentMonth = 0;
  let totalPaid = 0;

  for (const c of commissions ?? []) {
    const amt = Number(c.commission_amount) || 0;
    if (c.status === "paid") totalPaid += amt;
    if (["pending", "approved", "payable", "paid", "held"].includes(c.status as string)) {
      totalVisible += amt;
    }
    const created = String(c.created_at ?? "");
    if (created.startsWith(period)) {
      currentMonth += amt;
    }
  }

  const { count: payingCount } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_ambassador_id", ambassadorId)
    .in("plan", ["pro", "agency"]);

  await client
    .from("city_ambassadors")
    .update({
      total_visible_earnings: Math.round(totalVisible * 100) / 100,
      current_month_earnings: Math.round(currentMonth * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      active_revenue_accounts: payingCount ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ambassadorId);
}

export async function releaseDueCommissions(client: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  const { data: due } = await client
    .from("ambassador_commissions")
    .select("id, ambassador_id")
    .eq("status", "pending")
    .eq("hidden_from_ambassador", false)
    .eq("fraud_review", false)
    .lte("payable_at", now);

  if (!due?.length) return 0;

  const ids = due.map((d) => d.id);
  await client
    .from("ambassador_commissions")
    .update({ status: "payable", updated_at: now })
    .in("id", ids);

  const ambassadorIds = [...new Set(due.map((d) => d.ambassador_id as string))];
  for (const id of ambassadorIds) {
    await refreshAmbassadorEarnings(client, id);
  }

  return due.length;
}

export async function runMonthlyAmbassadorReset(client: SupabaseClient): Promise<void> {
  const period = lagosYearMonth();
  const prev = lagosYearMonth(new Date(Date.now() - 3 * 86_400_000));

  const { data: ambassadors } = await client
    .from("city_ambassadors")
    .select("id, current_month_earnings, onboarding_count, active_revenue_accounts");

  for (const amb of ambassadors ?? []) {
    await client.from("ambassador_monthly_snapshots").upsert(
      {
        ambassador_id: amb.id,
        period_year_month: prev,
        visible_earnings: amb.current_month_earnings ?? 0,
        onboarded_count: amb.onboarding_count ?? 0,
        paying_accounts: amb.active_revenue_accounts ?? 0,
      },
      { onConflict: "ambassador_id,period_year_month" }
    );

    await client
      .from("city_ambassadors")
      .update({
        current_month_earnings: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", amb.id);
  }

  console.info("[ambassador/ops] monthly reset", { period, prev, count: ambassadors?.length ?? 0 });
}

export async function markInactiveAmbassadors(client: SupabaseClient): Promise<number> {
  const config = await getProgramConfig(client);
  const cutoff = new Date(
    Date.now() - config.inactivity_days * 86_400_000
  ).toISOString();

  const { data: stale } = await client
    .from("city_ambassadors")
    .select("id, assigned_city, assigned_state")
    .eq("status", "approved")
    .or(`last_activity_at.is.null,last_activity_at.lt.${cutoff}`);

  if (!stale?.length) return 0;

  const ids = stale.map((s) => s.id);
  await client
    .from("city_ambassadors")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .in("id", ids);

  return stale.length;
}
