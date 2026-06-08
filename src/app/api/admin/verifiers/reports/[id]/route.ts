import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createVerifierEarning } from "@/lib/verifier/earnings";
import { getReportValidUntil } from "@/lib/verification/assignments";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: "approve" | "reject" | "fraud_review";
    notes?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: report } = await admin
    .from("property_verification_reports")
    .select("*, property_verification_requests(id, verifier_fee, status)")
    .eq("id", id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const requestId = report.verification_request_id as string;
  const reqMeta = report.property_verification_requests as {
    id: string;
    verifier_fee: number;
    status: string;
  } | null;

  if (body.action === "fraud_review") {
    await admin
      .from("property_verification_reports")
      .update({
        admin_review_status: "fraud_review",
        admin_review_notes: body.notes?.trim() || null,
        reviewed_at: now,
      })
      .eq("id", id);

    await admin
      .from("property_verification_requests")
      .update({ status: "fraud_review", reviewed_at: now, updated_at: now })
      .eq("id", requestId);

    const { data: v } = await admin
      .from("field_verifiers")
      .select("fraud_flags_count")
      .eq("id", report.verifier_id)
      .single();

    await admin
      .from("field_verifiers")
      .update({
        fraud_flags_count: (v?.fraud_flags_count ?? 0) + 1,
        status: "fraud_review",
        payout_enabled: false,
        payout_hold_reason: "Report flagged for fraud review",
        updated_at: now,
      })
      .eq("id", report.verifier_id);

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await admin
      .from("property_verification_reports")
      .update({
        admin_review_status: "rejected",
        admin_review_notes: body.notes?.trim() || null,
        reviewed_at: now,
      })
      .eq("id", id);

    await admin
      .from("property_verification_requests")
      .update({ status: "rejected", reviewed_at: now, updated_at: now })
      .eq("id", requestId);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verifier.report.reject",
      target_type: "property_verification_report",
      target_id: id,
      metadata: { notes: body.notes ?? null },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    const reportValidUntil = await getReportValidUntil(admin);
    await admin
      .from("property_verification_reports")
      .update({
        admin_review_status: "approved",
        admin_review_notes: body.notes?.trim() || null,
        reviewed_at: now,
        report_valid_until: reportValidUntil,
      })
      .eq("id", id);

    await admin
      .from("property_verification_requests")
      .update({ status: "reviewed", reviewed_at: now, updated_at: now })
      .eq("id", requestId);

    const fee = Number(reqMeta?.verifier_fee ?? 5000);
    await createVerifierEarning(admin, {
      verifierId: report.verifier_id as string,
      verificationRequestId: requestId,
      amount: fee,
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verifier.report.approve",
      target_type: "property_verification_report",
      target_id: id,
      metadata: { fee, verifierId: report.verifier_id },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
