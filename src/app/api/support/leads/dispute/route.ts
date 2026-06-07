import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/leads/events";
import { refundLeadCharge } from "@/lib/leads/billing";
import { supportCanUseDisputeAction } from "@/lib/admin/support-permissions";
import { assertSupportLeadAccess } from "@/lib/support/lead-access";

export type DisputeReason =
  | "duplicate"
  | "fake_user"
  | "wrong_number"
  | "spam"
  | "property_unavailable"
  | "agent_not_responsible";

export async function PATCH(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    lead_id: string;
    action: "open" | "review" | "approve_refund" | "reject" | "resolve";
    dispute_reason?: DisputeReason;
    dispute_resolution?: string;
    internal_note?: string;
  };

  if (!body.lead_id || !body.action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!supportCanUseDisputeAction(auth.profile.role, body.action)) {
    return NextResponse.json({ error: "Action not permitted" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const access = await assertSupportLeadAccess(
    admin,
    body.lead_id,
    auth.user.id,
    auth.profile.role
  );
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {};
  let auditAction = "lead.dispute.opened";

  switch (body.action) {
    case "open":
      updates.dispute_status = "opened";
      updates.dispute_reason = body.dispute_reason ?? null;
      updates.disputed_at = now;
      updates.dispute_resolved_at = null;
      updates.dispute_resolution = null;
      auditAction = "lead.dispute.opened";
      break;
    case "review":
      updates.dispute_status = "under_review";
      auditAction = "lead.dispute.review";
      break;
    case "approve_refund":
      updates.dispute_status = "approved_refund";
      updates.dispute_resolved_at = now;
      updates.dispute_resolution =
        body.dispute_resolution ?? "Refund approved";
      await refundLeadCharge(body.lead_id, auth.user.id);
      auditAction = "lead.refund";
      break;
    case "reject":
      updates.dispute_status = "rejected";
      updates.dispute_resolved_at = now;
      updates.dispute_resolution =
        body.dispute_resolution ?? "Dispute rejected";
      auditAction = "lead.dispute.resolved";
      break;
    case "resolve":
      updates.dispute_status = "resolved";
      updates.dispute_resolved_at = now;
      updates.dispute_resolution = body.dispute_resolution ?? "Resolved";
      auditAction = "lead.dispute.resolved";
      break;
  }

  const { error } = await admin.from("leads").update(updates).eq("id", body.lead_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logLeadEvent({
    leadId: body.lead_id,
    type: `dispute_${body.action}`,
    actorId: auth.user.id,
    actorRole: auth.profile.role,
    metadata: { ...updates, note: body.internal_note },
  });

  if (body.internal_note?.trim()) {
    const { data: lead } = await admin
      .from("leads")
      .select("agent_id")
      .eq("id", body.lead_id)
      .single();
    if (lead?.agent_id) {
      await admin.from("internal_profile_notes").insert({
        profile_id: lead.agent_id,
        note: `[Lead dispute ${body.lead_id.slice(0, 8)}] ${body.internal_note.trim()}`,
        created_by: auth.user.id,
        visibility: "internal_only",
      });
    }
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "lead",
    target_id: body.lead_id,
    metadata: updates,
    ip,
  });

  return NextResponse.json({ ok: true });
}
