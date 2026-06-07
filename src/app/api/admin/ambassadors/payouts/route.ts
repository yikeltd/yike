import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { lagosYearMonth } from "@/lib/ambassador/constants";
import { refreshAmbassadorEarnings } from "@/lib/ambassador/commission";

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

  const { data: ambassadors } = await admin
    .from("city_ambassadors")
    .select(
      "id, ambassador_code, full_name, email, assigned_city, assigned_state, status, fraud_flags_count, payout_enabled, payout_hold_reason, bank_change_pending_review, total_paid, current_month_earnings"
    )
    .in("status", ["approved", "paused", "inactive"])
    .order("full_name");

  const queue = [];
  for (const amb of ambassadors ?? []) {
    const { data: commissions } = await admin
      .from("ambassador_commissions")
      .select("commission_amount, status, hidden_from_ambassador")
      .eq("ambassador_id", amb.id);

    let payable = 0;
    let pending = 0;
    let held = 0;
    let hidden = 0;
    for (const c of commissions ?? []) {
      const amt = Number(c.commission_amount);
      if (c.hidden_from_ambassador) {
        hidden += amt;
        continue;
      }
      if (c.status === "payable") payable += amt;
      if (c.status === "pending") pending += amt;
      if (c.status === "held" || c.status === "fraud_review") held += amt;
    }

    const { data: bank } = await admin
      .from("ambassador_bank_details")
      .select("bank_name, bank_code, account_number, account_name, bank_change_pending_review, updated_at")
      .eq("ambassador_id", amb.id)
      .maybeSingle();

    const { data: lastPayout } = await admin
      .from("ambassador_payouts")
      .select("paid_at, payable_amount, status")
      .eq("ambassador_id", amb.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    queue.push({
      ...amb,
      amounts: {
        payable: Math.round(payable * 100) / 100,
        pending: Math.round(pending * 100) / 100,
        held: Math.round(held * 100) / 100,
        hidden: Math.round(hidden * 100) / 100,
      },
      bank,
      lastPayout,
    });
  }

  const { data: payouts } = await admin
    .from("ambassador_payouts")
    .select("*, city_ambassadors(ambassador_code, full_name, email)")
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
  const ambassadorId = String(body.ambassadorId ?? "").trim();
  const payoutId = String(body.payoutId ?? "").trim();
  const notes = String(body.notes ?? "").trim() || null;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (action === "create_queue") {
    if (!ambassadorId) {
      return NextResponse.json({ error: "ambassadorId required" }, { status: 400 });
    }

    const { data: payable } = await admin
      .from("ambassador_commissions")
      .select("commission_amount")
      .eq("ambassador_id", ambassadorId)
      .eq("status", "payable")
      .eq("hidden_from_ambassador", false);

    const amount = (payable ?? []).reduce(
      (sum, row) => sum + Number(row.commission_amount),
      0
    );

    if (amount <= 0) {
      return NextResponse.json({ error: "No payable commissions" }, { status: 400 });
    }

    const period = lagosYearMonth();
    const { data: payout, error } = await admin
      .from("ambassador_payouts")
      .insert({
        ambassador_id: ambassadorId,
        period_year_month: period,
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

  if (action === "approve" || action === "mark_paid") {
    if (!payoutId) {
      return NextResponse.json({ error: "payoutId required" }, { status: 400 });
    }

    const { data: payout } = await admin
      .from("ambassador_payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const { data: ambRow } = await admin
      .from("city_ambassadors")
      .select("payout_enabled, bank_change_pending_review")
      .eq("id", payout.ambassador_id)
      .single();

    if (action === "mark_paid" && !ambRow?.payout_enabled) {
      return NextResponse.json(
        { error: "Ambassador payouts are frozen — approve bank details first" },
        { status: 409 }
      );
    }

    if (action === "approve") {
      await admin
        .from("ambassador_payouts")
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
        action: "ambassador.payout.approve",
        target_type: "ambassador_payout",
        target_id: payoutId,
        metadata: { ambassadorId: payout.ambassador_id, amount: payout.payable_amount },
        ip,
      });

      return NextResponse.json({ ok: true });
    }

    await admin
      .from("ambassador_commissions")
      .update({ status: "paid", paid_at: now, updated_at: now })
      .eq("ambassador_id", payout.ambassador_id)
      .eq("status", "payable")
      .eq("hidden_from_ambassador", false);

    await admin
      .from("ambassador_payouts")
      .update({
        status: "paid",
        paid_at: now,
        admin_notes: notes,
        updated_at: now,
      })
      .eq("id", payoutId);

    const { data: amb } = await admin
      .from("city_ambassadors")
      .select("total_paid")
      .eq("id", payout.ambassador_id)
      .single();

    await admin
      .from("city_ambassadors")
      .update({
        total_paid:
          Number(amb?.total_paid ?? 0) + Number(payout.payable_amount),
        updated_at: now,
      })
      .eq("id", payout.ambassador_id);

    await refreshAmbassadorEarnings(admin, payout.ambassador_id as string);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ambassador.payout.paid",
      target_type: "ambassador_payout",
      target_id: payoutId,
      metadata: { ambassadorId: payout.ambassador_id, amount: payout.payable_amount },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "hold" && payoutId) {
    await admin
      .from("ambassador_payouts")
      .update({ status: "held", admin_notes: notes, updated_at: now })
      .eq("id", payoutId);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ambassador.payout.held",
      target_type: "ambassador_payout",
      target_id: payoutId,
      metadata: { notes },
      ip,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject" && payoutId) {
    await admin
      .from("ambassador_payouts")
      .update({ status: "rejected", admin_notes: notes, updated_at: now })
      .eq("id", payoutId);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ambassador.payout.rejected",
      target_type: "ambassador_payout",
      target_id: payoutId,
      metadata: { notes },
      ip,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_bank" && ambassadorId) {
    await admin
      .from("city_ambassadors")
      .update({
        payout_enabled: true,
        bank_change_pending_review: false,
        payout_hold_reason: null,
        updated_at: now,
      })
      .eq("id", ambassadorId);

    await admin
      .from("ambassador_bank_details")
      .update({
        bank_change_pending_review: false,
        reviewed_by: auth.user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("ambassador_id", ambassadorId);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ambassador.bank.approved",
      target_type: "city_ambassador",
      target_id: ambassadorId,
      metadata: { notes },
      ip,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "freeze_ambassador" && ambassadorId) {
    await admin
      .from("city_ambassadors")
      .update({
        payout_enabled: false,
        payout_hold_reason: notes ?? "Admin payout freeze",
        status: "paused",
        updated_at: now,
      })
      .eq("id", ambassadorId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
