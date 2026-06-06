import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentProfileStatus } from "@/types/database";

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    agent_id: string;
    action: "suspend" | "reinstate" | "delete";
    reason?: string;
    hide_listings?: boolean;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "suspend") {
    await supabase
      .from("profiles")
      .update({
        profile_status: "suspended" as AgentProfileStatus,
        profile_status_reason: body.reason ?? "Suspended by admin",
        suspended_at: now,
        is_banned: true,
      })
      .eq("id", body.agent_id);

    if (body.hide_listings !== false) {
      await supabase
        .from("properties")
        .update({ status: "hidden" })
        .eq("agent_id", body.agent_id)
        .eq("status", "approved");
    }
  } else if (body.action === "reinstate") {
    await supabase
      .from("profiles")
      .update({
        profile_status: "reinstated" as AgentProfileStatus,
        profile_status_reason: body.reason ?? null,
        suspended_at: null,
        deleted_at: null,
        is_banned: false,
      })
      .eq("id", body.agent_id);
  } else if (body.action === "delete") {
    await supabase
      .from("profiles")
      .update({
        profile_status: "deleted" as AgentProfileStatus,
        profile_status_reason: body.reason ?? "Removed by admin",
        deleted_at: now,
        is_banned: true,
      })
      .eq("id", body.agent_id);

    await supabase
      .from("properties")
      .update({ status: "hidden" })
      .eq("agent_id", body.agent_id);
  }

  await supabase.from("agent_status_logs").insert({
    agent_id: body.agent_id,
    action: body.action,
    reason: body.reason ?? null,
    actor_id: auth.user.id,
    metadata: { hide_listings: body.hide_listings },
  });

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: `agent.${body.action}`,
    target_type: "agent",
    target_id: body.agent_id,
    metadata: { reason: body.reason },
    ip,
  });

  return NextResponse.json({ ok: true });
}
