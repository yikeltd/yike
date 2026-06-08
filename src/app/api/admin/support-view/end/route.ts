import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import {
  clearSupportViewCookie,
  getActiveSupportView,
} from "@/lib/admin/support-view";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const active = await getActiveSupportView(auth.user.id);
  await clearSupportViewCookie();

  if (active) {
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("support_view_sessions")
        .update({ ended_at: new Date().toISOString(), end_reason: "admin_ended" })
        .eq("id", active.sessionId);
    }

    const ctx = await getRequestAuditContext();
    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "support_view.end",
      target_type: "profile",
      target_id: active.targetUserId,
      target_user_id: active.targetUserId,
      target_user_name: active.targetUserName,
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });
  }

  return NextResponse.json({ ok: true });
}
