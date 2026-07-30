import { NextResponse } from "next/server";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const { data: reports, error } = await admin
    .from("user_reports")
    .select("*, reporter:reporter_id(id, full_name, email, avatar_url), reported_user:reported_user_id(id, full_name, email, avatar_url)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = (await req.json()) as {
    reportId: string;
    action: "mark_valid" | "mark_invalid" | "dismiss" | "under_review";
    resolutionNotes?: string;
  };

  if (!body.reportId || !body.action) {
    return NextResponse.json({ error: "reportId and action required" }, { status: 400 });
  }

  // 1. Fetch current report
  const { data: report, error: fetchErr } = await admin
    .from("user_reports")
    .select("*")
    .eq("id", body.reportId)
    .single();

  if (fetchErr || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  let newStatus = "under_review";
  let riskDelta = 0;

  if (body.action === "mark_valid") {
    newStatus = "resolved";
    riskDelta = +25; // Confirmed report increases risk score
  } else if (body.action === "mark_invalid" || body.action === "dismiss") {
    newStatus = "dismissed";
    riskDelta = -5; // Revert preliminary report risk penalty
  }

  // 2. Update report status
  const { error: updateErr } = await admin
    .from("user_reports")
    .update({
      status: newStatus,
      assigned_moderator_id: auth.user.id,
      resolution: body.resolutionNotes ?? `Moderator action: ${body.action}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.reportId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 3. Record Trust Ledger event
  await recordTrustEvent(admin, {
    userId: report.reported_user_id,
    eventType: body.action === "mark_valid" ? "confirmed_violation" : "report_dismissed",
    actorId: auth.user.id,
    title: body.action === "mark_valid" ? "Confirmed Violation" : "Report Dismissed",
    description: body.resolutionNotes ?? `Report ${body.reportId} marked as ${body.action}`,
    riskScoreDelta: riskDelta,
    metadata: { report_id: body.reportId, category: report.category },
  });

  // 4. Log Audit
  await logTrustAudit(admin, {
    actorId: auth.user.id,
    targetUserId: report.reported_user_id,
    reportId: body.reportId,
    action: `report_${body.action}`,
    details: { resolution: body.resolutionNotes },
  });

  return NextResponse.json({ success: true, status: newStatus });
}
