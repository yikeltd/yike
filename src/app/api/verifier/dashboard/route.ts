import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkVerifierProfileByEmail } from "@/lib/verifier/profile-link";

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

  await linkVerifierProfileByEmail(admin, user.id, user.email);

  const { data: verifier } = await admin
    .from("field_verifiers")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!verifier) {
    return NextResponse.json({ error: "Not a field verifier" }, { status: 403 });
  }

  const { data: requests } = await admin
    .from("property_verification_requests")
    .select(
      "id, status, verifier_fee, requester_notes, assignment_notes, requested_at, property_id, properties(id, title, city, area, address_hint)"
    )
    .eq("assigned_verifier_id", verifier.id)
    .order("requested_at", { ascending: false })
    .limit(30);

  const { data: earnings } = await admin
    .from("field_verifier_earnings")
    .select("amount, status")
    .eq("verifier_id", verifier.id);

  const { data: payouts } = await admin
    .from("field_verifier_payouts")
    .select("id, period_year_month, payable_amount, status, paid_at")
    .eq("verifier_id", verifier.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: bank } = await admin
    .from("field_verifier_bank_details")
    .select("bank_name, bank_code, account_name, bank_change_pending_review")
    .eq("verifier_id", verifier.id)
    .maybeSingle();

  let pendingEarnings = 0;
  let payableEarnings = 0;
  let heldEarnings = 0;
  for (const e of earnings ?? []) {
    const amt = Number(e.amount);
    if (e.status === "pending") pendingEarnings += amt;
    if (e.status === "payable") payableEarnings += amt;
    if (e.status === "held" || e.status === "fraud_review") heldEarnings += amt;
  }

  return NextResponse.json({
    verifier: {
      id: verifier.id,
      code: verifier.verifier_code,
      city: verifier.assigned_city,
      state: verifier.assigned_state,
      status: verifier.status,
      trustLevel: verifier.trust_level,
      completedInspections: verifier.completed_inspections,
      totalEarnings: Number(verifier.total_earnings),
      totalPaid: Number(verifier.total_paid),
      payoutEnabled: verifier.payout_enabled,
      payoutHoldReason: verifier.payout_hold_reason,
      bankChangePendingReview: verifier.bank_change_pending_review,
      fullName: verifier.full_name,
      email: verifier.email,
      whatsappNumber: verifier.whatsapp_number,
    },
    bank: bank
      ? {
          bankName: bank.bank_name,
          bankCode: bank.bank_code,
          accountName: bank.account_name,
          pendingReview: bank.bank_change_pending_review,
        }
      : null,
    pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    payableEarnings: Math.round(payableEarnings * 100) / 100,
    heldEarnings: Math.round(heldEarnings * 100) / 100,
    assignments: (requests ?? []).map((r) => {
      const raw = r.properties as
        | {
            id: string;
            title: string;
            city: string;
            area: string;
            address_hint: string | null;
          }
        | {
            id: string;
            title: string;
            city: string;
            area: string;
            address_hint: string | null;
          }[]
        | null;
      const prop = Array.isArray(raw) ? raw[0] ?? null : raw;
      return {
        id: r.id,
        status: r.status,
        verifierFee: Number(r.verifier_fee),
        requesterNotes: r.requester_notes,
        assignmentNotes: r.assignment_notes,
        requestedAt: r.requested_at,
        property: prop
          ? {
              id: prop.id,
              title: prop.title,
              city: prop.city,
              area: prop.area,
              addressHint: prop.address_hint,
            }
          : null,
      };
    }),
    payouts: payouts ?? [],
  });
}
