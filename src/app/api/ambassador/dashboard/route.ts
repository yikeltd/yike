import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkAmbassadorProfileByEmail } from "@/lib/ambassador/attribution";
import { ambassadorReferralUrl } from "@/lib/ambassador/code";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  await linkAmbassadorProfileByEmail(admin, user.id, user.email);

  const { data: ambassador } = await admin
    .from("city_ambassadors")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!ambassador) {
    return NextResponse.json({ error: "Not an ambassador" }, { status: 403 });
  }

  const { data: commissions } = await admin
    .from("ambassador_commissions")
    .select(
      "id, commission_amount, status, revenue_source_type, created_at, paid_at"
    )
    .eq("ambassador_id", ambassador.id)
    .eq("hidden_from_ambassador", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: onboarded } = await admin
    .from("profiles")
    .select("id, full_name, username, role, plan, attributed_at, account_type")
    .eq("referred_by_ambassador_id", ambassador.id)
    .order("attributed_at", { ascending: false })
    .limit(50);

  const { data: payouts } = await admin
    .from("ambassador_payouts")
    .select("id, period_year_month, payable_amount, status, paid_at, created_at")
    .eq("ambassador_id", ambassador.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: bank } = await admin
    .from("ambassador_bank_details")
    .select("bank_name, bank_code, account_name, bank_change_pending_review, updated_at")
    .eq("ambassador_id", ambassador.id)
    .maybeSingle();

  const visible = commissions ?? [];
  const pendingEarnings = visible
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const payableEarnings = visible
    .filter((c) => c.status === "payable")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const heldEarnings = visible
    .filter((c) => c.status === "held" || c.status === "fraud_review")
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  return NextResponse.json({
    ambassador: {
      id: ambassador.id,
      code: ambassador.ambassador_code,
      referralLink:
        ambassador.referral_link ?? ambassadorReferralUrl(ambassador.ambassador_code),
      city: ambassador.assigned_city,
      state: ambassador.assigned_state,
      status: ambassador.status,
      commissionRate: Number(ambassador.commission_percentage),
      onboardingCount: ambassador.onboarding_count,
      activeRevenueAccounts: ambassador.active_revenue_accounts,
      totalVisibleEarnings: Number(ambassador.total_visible_earnings),
      currentMonthEarnings: Number(ambassador.current_month_earnings),
      totalPaid: Number(ambassador.total_paid),
      lifetimeGeneratedRevenue: Number(ambassador.lifetime_generated_revenue),
      lastActivityAt: ambassador.last_activity_at,
      payoutEnabled: ambassador.payout_enabled,
      payoutHoldReason: ambassador.payout_hold_reason,
      bankChangePendingReview: ambassador.bank_change_pending_review,
      verificationLevel: ambassador.identity_verification_level,
      verificationStatus: ambassador.verification_status,
      residentialAddress: ambassador.residential_address,
      residentialCity: ambassador.residential_city,
      residentialState: ambassador.residential_state,
      nearestLandmark: ambassador.nearest_landmark,
      whatsappNumber: ambassador.whatsapp_number,
      phoneNumber: ambassador.phone_number,
      fullName: ambassador.full_name,
      email: ambassador.email,
    },
    bank: bank
      ? {
          bankName: bank.bank_name,
          bankCode: bank.bank_code,
          accountName: bank.account_name,
          pendingReview: bank.bank_change_pending_review,
          updatedAt: bank.updated_at,
        }
      : null,
    pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    payableEarnings: Math.round(payableEarnings * 100) / 100,
    heldEarnings: Math.round(heldEarnings * 100) / 100,
    commissions: commissions ?? [],
    onboarded: (onboarded ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? p.username ?? "Account",
      role: p.role,
      plan: p.plan,
      attributedAt: p.attributed_at,
      isPaying: p.plan === "pro" || p.plan === "agency",
    })),
    payouts: payouts ?? [],
  });
}
