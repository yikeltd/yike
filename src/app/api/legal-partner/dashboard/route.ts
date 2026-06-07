import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkLegalPartnerProfileByEmail } from "@/lib/legal-partner/profile-link";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  await linkLegalPartnerProfileByEmail(admin, user.id, user.email);

  const { data: partner } = await admin
    .from("legal_partners")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: "Not a legal partner" }, { status: 403 });

  const { data: requests } = await admin
    .from("legal_verification_requests")
    .select("id, request_reference, status, review_type, partner_fee, property_title, property_location_text, buyer_notes, requested_at")
    .eq("assigned_legal_partner_id", partner.id)
    .order("requested_at", { ascending: false })
    .limit(30);

  const { data: earnings } = await admin
    .from("legal_partner_earnings")
    .select("amount, status")
    .eq("partner_id", partner.id);

  const { data: payouts } = await admin
    .from("legal_partner_payouts")
    .select("id, period_year_month, payable_amount, status, paid_at")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: bank } = await admin
    .from("legal_partner_bank_details")
    .select("bank_name, bank_code, account_name, bank_change_pending_review")
    .eq("partner_id", partner.id)
    .maybeSingle();

  let pending = 0;
  let payable = 0;
  let held = 0;
  for (const e of earnings ?? []) {
    const amt = Number(e.amount);
    if (e.status === "pending") pending += amt;
    if (e.status === "payable") payable += amt;
    if (e.status === "held" || e.status === "fraud_review") held += amt;
  }

  return NextResponse.json({
    partner: {
      code: partner.partner_code,
      firmName: partner.firm_name,
      city: partner.assigned_city,
      state: partner.assigned_state,
      status: partner.status,
      trustLevel: partner.trust_level,
      completedReviews: partner.completed_reviews,
      totalPaid: Number(partner.total_paid),
      payoutEnabled: partner.payout_enabled,
      payoutHoldReason: partner.payout_hold_reason,
      fullName: partner.full_name,
      email: partner.email,
    },
    bank: bank
      ? {
          bankName: bank.bank_name,
          bankCode: bank.bank_code,
          accountName: bank.account_name,
          pendingReview: bank.bank_change_pending_review,
        }
      : null,
    pendingEarnings: Math.round(pending * 100) / 100,
    payableEarnings: Math.round(payable * 100) / 100,
    heldEarnings: Math.round(held * 100) / 100,
    assignments: (requests ?? []).map((r) => ({
      id: r.id,
      reference: r.request_reference,
      status: r.status,
      reviewType: r.review_type,
      fee: Number(r.partner_fee),
      propertyTitle: r.property_title,
      location: r.property_location_text,
      notes: r.buyer_notes,
      requestedAt: r.requested_at,
    })),
    payouts: payouts ?? [],
  });
}
