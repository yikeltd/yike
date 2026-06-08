import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { hasValidPinSession } from "@/lib/admin/pin";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { getActiveSupportView } from "@/lib/admin/support-view";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    action: "archive" | "restore";
    reason?: string;
  };

  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: listing } = await supabase
    .from("properties")
    .select("id, title, city, agent_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const supportView = await getActiveSupportView(auth.user.id);

  if (body.action === "archive") {
    await supabase
      .from("properties")
      .update({
        status: "archived",
        archived_at: now,
        archived_by: auth.user.id,
        archive_reason: body.reason ?? null,
      })
      .eq("id", id);
  } else {
    await supabase
      .from("properties")
      .update({
        status: "approved",
        archived_at: null,
        archived_by: null,
        archive_reason: null,
      })
      .eq("id", id);
  }

  const ctx = await getRequestAuditContext(`/lex/auth/listings/${id}`);
  const auditAction = body.action === "archive" ? "listing.archive" : "listing.restore";

  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: supportView ? "support_view.action" : auditAction,
    target_type: "listing",
    target_id: id,
    target_user_id: listing.agent_id,
    reason: body.reason,
    metadata: {
      title: listing.title,
      city: listing.city,
      inner_action: auditAction,
      previous_status: listing.status,
    },
    support_view_context: !!supportView,
    ip: ctx.ip,
    user_agent_hash: ctx.user_agent_hash,
    route: ctx.route,
  });

  return NextResponse.json({ ok: true });
}
