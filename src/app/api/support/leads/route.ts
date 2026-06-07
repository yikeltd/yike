import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import {
  supportCanUseLeadAction,
  supportOwnsAssignment,
} from "@/lib/admin/support-permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/leads/events";
import { waiveLeadCharge } from "@/lib/leads/billing";
import type { LeadQualityLabel } from "@/lib/leads/operations-types";

export async function PATCH(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    lead_id: string;
    action: "archive" | "unarchive" | "quality" | "mark_spam" | "waive_charge";
    lead_quality_label?: LeadQualityLabel;
    lead_quality_score?: number;
    archive_reason?: string;
  };

  if (!body.lead_id || !body.action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!supportCanUseLeadAction(auth.profile.role, body.action)) {
    return NextResponse.json({ error: "Action not permitted" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("leads")
    .select("assigned_support_id")
    .eq("id", body.lead_id)
    .maybeSingle();

  if (
    !supportOwnsAssignment(
      auth.profile.role,
      existing?.assigned_support_id,
      auth.user.id
    )
  ) {
    return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const updates: Record<string, unknown> = {};

  if (body.action === "archive" || body.action === "mark_spam") {
    updates.archived_at = now;
    updates.archived_by = auth.user.id;
    updates.archive_reason =
      body.archive_reason ?? (body.action === "mark_spam" ? "spam" : "archived");
    if (body.action === "mark_spam") {
      updates.lead_quality_label = "spam";
    }
  } else if (body.action === "unarchive") {
    updates.archived_at = null;
    updates.archived_by = null;
    updates.archive_reason = null;
  } else if (body.action === "quality") {
    if (body.lead_quality_label) {
      updates.lead_quality_label = body.lead_quality_label;
    }
    if (body.lead_quality_score != null) {
      updates.lead_quality_score = body.lead_quality_score;
    }
  } else if (body.action === "waive_charge") {
    await waiveLeadCharge(body.lead_id, auth.user.id);
    updates.charge_status = "waived";
    updates.charged_at = now;
  }

  const { error } = await admin.from("leads").update(updates).eq("id", body.lead_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const eventType =
    body.action === "archive" || body.action === "mark_spam"
      ? "archived"
      : body.action === "quality"
        ? "quality_updated"
        : "note_added";

  await logLeadEvent({
    leadId: body.lead_id,
    type: eventType,
    actorId: auth.user.id,
    actorRole: auth.profile.role,
    metadata: { action: body.action, ...updates },
  });

  const auditAction =
    body.action === "waive_charge"
      ? "lead.charge_waived"
      : body.action === "archive" || body.action === "mark_spam"
        ? "lead.archive"
        : "lead.quality";

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "lead",
    target_id: body.lead_id,
    metadata: { action: body.action },
    ip,
  });

  return NextResponse.json({ ok: true });
}
