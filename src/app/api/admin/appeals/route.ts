import { NextResponse } from "next/server";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEnforcementAction } from "@/lib/trust-safety/enforcement";
import { recordTrustEvent, logTrustAudit } from "@/lib/trust-safety/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  const { data: appeals, error } = await admin
    .from("trust_appeals")
    .select("*, user:user_id(id, full_name, email, avatar_url)")
    .eq("appeal_status", status)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appeals });
}

export async function POST(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = (await req.json()) as {
    appealId: string;
    decision: "approve" | "reject";
    moderatorNotes?: string;
  };

  if (!body.appealId || !body.decision) {
    return NextResponse.json({ error: "appealId and decision required" }, { status: 400 });
  }

  // 1. Fetch appeal record
  const { data: appeal, error: fetchErr } = await admin
    .from("trust_appeals")
    .select("*")
    .eq("id", body.appealId)
    .single();

  if (fetchErr || !appeal) {
    return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
  }

  const isApproved = body.decision === "approve";
  const newAppealStatus = isApproved ? "approved" : "rejected";

  // 2. Update appeal record
  await admin
    .from("trust_appeals")
    .update({
      appeal_status: newAppealStatus,
      moderator_notes: body.moderatorNotes ?? null,
      decision: isApproved ? "Appeal Approved — Status Restored" : "Appeal Rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.appealId);

  // 3. Update trust_profile appeal status
  await admin
    .from("trust_profiles")
    .update({
      appeal_status: newAppealStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", appeal.user_id);

  // 4. If approved, restore account to normal status via Enforcement Engine
  if (isApproved) {
    await applyEnforcementAction(admin, {
      userId: appeal.user_id,
      action: "restore",
      moderatorId: auth.user.id,
      reason: `Appeal Approved: ${body.moderatorNotes ?? "Evidence verified"}`,
      notes: "Account restored to normal visibility following successful appeal.",
    });
  } else {
    // Record Trust Ledger event for rejection
    await recordTrustEvent(admin, {
      userId: appeal.user_id,
      eventType: "appeal_rejected",
      actorId: auth.user.id,
      title: "Appeal Rejected",
      description: body.moderatorNotes ?? "Appeal evidence insufficient.",
      metadata: { appeal_id: body.appealId },
    });
  }

  // 5. Audit log
  await logTrustAudit(admin, {
    actorId: auth.user.id,
    targetUserId: appeal.user_id,
    reportId: appeal.report_id ?? undefined,
    action: `appeal_${newAppealStatus}`,
    details: { notes: body.moderatorNotes },
  });

  return NextResponse.json({ success: true, status: newAppealStatus });
}
