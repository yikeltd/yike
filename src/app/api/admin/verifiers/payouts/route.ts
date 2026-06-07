import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { lagosYearMonth } from "@/lib/verifier/constants";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: verifiers } = await admin
    .from("field_verifiers")
    .select(
      "id, verifier_code, full_name, email, assigned_city, assigned_state, status, fraud_flags_count, payout_enabled, payout_hold_reason, bank_change_pending_review, total_paid"
    )
    .in("status", ["approved", "paused", "fraud_review"])
    .order("full_name");

  const queue = [];
  for (const v of verifiers ?? []) {
    const { data: earnings } = await admin
      .from("field_verifier_earnings")
      .select("amount, status, fraud_review")
      .eq("verifier_id", v.id);

    let payable = 0;
    let pending = 0;
    let held = 0;
    for (const e of earnings ?? []) {
      const amt = Number(e.amount);
      if (e.status === "payable" && !e.fraud_review) payable += amt;
      if (e.status === "pending") pending += amt;
      if (e.status === "held" || e.status === "fraud_review" || e.fraud_review) held += amt;
    }

    const { data: bank } = await admin
      .from("field_verifier_bank_details")
      .select("bank_name, bank_code, account_number, account_name, bank_change_pending_review")
      .eq("verifier_id", v.id)
      .maybeSingle();

    queue.push({
      ...v,
      amounts: {
        payable: Math.round(payable * 100) / 100,
        pending: Math.round(pending * 100) / 100,
        held: Math.round(held * 100) / 100,
      },
      bank,
    });
  }

  const { data: payouts } = await admin
    .from("field_verifier_payouts")
    .select("*, field_verifiers(verifier_code, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(40);

  const bankReviews = queue.filter(
    (q) => q.bank_change_pending_review || (q.bank && q.bank.bank_change_pending_review)
  );

  return NextResponse.json({ queue, payouts: payouts ?? [], bankReviews });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "").trim();
  const verifierId = String(body.verifierId ?? "").trim();
  const payoutId = String(body.payoutId ?? "").trim();
  const notes = String(body.notes ?? "").trim() || null;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (action === "create_queue" && verifierId) {
    const { data: payable } = await admin
      .from("field_verifier_earnings")
      .select("amount")
      .eq("verifier_id", verifierId)
      .eq("status", "payable")
      .eq("fraud_review", false);

    const amount = (payable ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
    if (amount <= 0) {
      return NextResponse.json({ error: "No payable earnings" }, { status: 400 });
    }

    const { data: payout, error } = await admin
      .from("field_verifier_payouts")
      .insert({
        verifier_id: verifierId,
        period_year_month: lagosYearMonth(),
        payable_amount: Math.round(amount * 100) / 100,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !payout) {
      return NextResponse.json({ error: "Could not create payout" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payoutId: payout.id });
  }

  if ((action === "approve" || action === "mark_paid") && payoutId) {
    const { data: payout } = await admin
      .from("field_verifier_payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const { data: vRow } = await admin
      .from("field_verifiers")
      .select("payout_enabled, total_paid")
      .eq("id", payout.verifier_id)
      .single();

    if (action === "mark_paid" && !vRow?.payout_enabled) {
      return NextResponse.json(
        { error: "Verifier payouts frozen — approve bank details first" },
        { status: 409 }
      );
    }

    if (action === "approve") {
      await admin
        .from("field_verifier_payouts")
        .update({
          status: "approved",
          approved_by: auth.user.id,
          approved_at: now,
          admin_notes: notes,
          updated_at: now,
        })
        .eq("id", payoutId);

      await writeAuditLog({
        actor_id: auth.user.id,
        actor_role: auth.profile.role,
        action: "verifier.payout.approve",
        target_type: "field_verifier_payout",
        target_id: payoutId,
        metadata: { verifierId: payout.verifier_id, amount: payout.payable_amount },
        ip,
      });

      return NextResponse.json({ ok: true });
    }

    await admin
      .from("field_verifier_earnings")
      .update({ status: "paid", paid_at: now, updated_at: now })
      .eq("verifier_id", payout.verifier_id)
      .eq("status", "payable")
      .eq("fraud_review", false);

    await admin
      .from("field_verifier_payouts")
      .update({ status: "paid", paid_at: now, admin_notes: notes, updated_at: now })
      .eq("id", payoutId);

    await admin
      .from("field_verifiers")
      .update({
        total_paid: Number(vRow?.total_paid ?? 0) + Number(payout.payable_amount),
        updated_at: now,
      })
      .eq("id", payout.verifier_id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verifier.payout.paid",
      target_type: "field_verifier_payout",
      target_id: payoutId,
      metadata: { verifierId: payout.verifier_id, amount: payout.payable_amount },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "hold" && payoutId) {
    await admin
      .from("field_verifier_payouts")
      .update({ status: "held", admin_notes: notes, updated_at: now })
      .eq("id", payoutId);
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_bank" && verifierId) {
    await admin
      .from("field_verifiers")
      .update({
        payout_enabled: true,
        bank_change_pending_review: false,
        payout_hold_reason: null,
        updated_at: now,
      })
      .eq("id", verifierId);

    await admin
      .from("field_verifier_bank_details")
      .update({
        bank_change_pending_review: false,
        reviewed_by: auth.user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("verifier_id", verifierId);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verifier.bank.approved",
      target_type: "field_verifier",
      target_id: verifierId,
      metadata: { notes },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
