import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/leads/events";

type RouteCtx = { params: Promise<{ id: string }> };

const ACTIONS = [
  "copy_support_reply",
  "copy_handoff_link",
  "mark_handoff_shared",
  "user_messaged_yike",
  "agent_contacted",
  "qualified",
  "closed_won",
  "closed_lost",
  "mark_spam",
  "cancel",
  "add_note",
] as const;

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: (typeof ACTIONS)[number];
    note?: string;
  };

  if (!ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (body.action === "copy_support_reply") {
    updates.handoff_copied_at = now;
    if (updates.concierge_status === undefined) {
      updates.concierge_status = "handoff_prepared";
    }
  } else if (body.action === "copy_handoff_link") {
    updates.handoff_copied_at = now;
  } else if (body.action === "mark_handoff_shared") {
    updates.concierge_status = "handoff_shared";
    updates.handoff_shared_at = now;
    updates.contacted_by = auth.user.id;
    updates.status = "connected";
  } else if (body.action === "user_messaged_yike") {
    updates.concierge_status = "user_messaged_yike";
  } else if (body.action === "agent_contacted") {
    updates.concierge_status = "agent_contacted";
    updates.contacted_by = auth.user.id;
  } else if (body.action === "qualified") {
    updates.concierge_status = "qualified";
    updates.lead_status = "qualified";
  } else if (body.action === "closed_won") {
    updates.concierge_status = "closed_won";
    updates.lead_status = "closed_won";
  } else if (body.action === "closed_lost") {
    updates.concierge_status = "closed_lost";
    updates.lead_status = "closed_lost";
  } else if (body.action === "mark_spam") {
    updates.concierge_status = "spam";
    updates.lead_quality_label = "spam";
    updates.archived_at = now;
    updates.archived_by = auth.user.id;
  } else if (body.action === "cancel") {
    updates.concierge_status = "cancelled";
    updates.archived_at = now;
    updates.archived_by = auth.user.id;
  } else if (body.action === "add_note" && body.note?.trim()) {
    const { data: row } = await admin
      .from("leads")
      .select("internal_notes")
      .eq("id", id)
      .maybeSingle();
    const prev = (row?.internal_notes as string | null) ?? "";
    updates.internal_notes = prev
      ? `${prev}\n\n[${now}] ${body.note.trim()}`
      : `[${now}] ${body.note.trim()}`;
  }

  const { error } = await admin.from("leads").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const auditAction =
    body.action === "copy_support_reply" || body.action === "copy_handoff_link"
      ? "lead.handoff_copied"
      : body.action === "mark_handoff_shared"
        ? "lead.handoff_shared"
        : body.action === "user_messaged_yike"
          ? "lead.concierge.user_messaged"
          : body.action === "agent_contacted"
            ? "lead.concierge.agent_contacted"
            : body.action === "qualified"
              ? "lead.concierge.qualified"
              : body.action === "closed_won" || body.action === "closed_lost"
                ? "lead.concierge.closed"
                : body.action === "mark_spam"
                  ? "lead.concierge.spam"
                  : body.action === "cancel"
                    ? "lead.concierge.cancel"
                    : "lead.note";

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "lead",
    target_id: id,
    metadata: { action: body.action },
    ip,
  });

  await logLeadEvent({
    leadId: id,
    type: body.action,
    actorId: auth.user.id,
    actorRole: auth.profile.role,
  });

  return NextResponse.json({ ok: true });
}
