import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { profileStatusFromAccountAction } from "@/lib/account-control";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentProfileStatus } from "@/types/database";

export const runtime = "nodejs";

type StatusAction =
  | "suspend"
  | "reinstate"
  | "delete"
  | "on_hold"
  | "pending_verification";

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
    action: StatusAction;
    reason?: string;
    hide_listings?: boolean;
    verification_required?: boolean;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  const profileStatus = profileStatusFromAccountAction(
    body.action === "reinstate" ? "reinstate" : body.action
  );

  const patch: Record<string, unknown> = {
    profile_status: profileStatus,
    profile_status_reason: body.reason ?? null,
  };

  if (body.action === "suspend") {
    patch.suspended_at = now;
    patch.is_banned = true;
    patch.profile_status_reason = body.reason ?? "Suspended by admin";
    if (body.hide_listings !== false) {
      await supabase
        .from("properties")
        .update({ status: "hidden" })
        .eq("agent_id", body.agent_id)
        .eq("status", "approved");
    }
  } else if (body.action === "on_hold") {
    patch.is_banned = false;
    patch.suspended_at = null;
    patch.profile_status_reason = body.reason ?? "On hold — under review";
  } else if (body.action === "pending_verification") {
    patch.is_banned = false;
    patch.verification_required = body.verification_required !== false;
    patch.profile_status_reason = body.reason ?? "Verification requested by Yike";
  } else if (body.action === "reinstate") {
    patch.suspended_at = null;
    patch.deleted_at = null;
    patch.is_banned = false;
    patch.verification_required = false;
    patch.profile_status_reason = body.reason ?? null;
  } else if (body.action === "delete") {
    patch.deleted_at = now;
    patch.is_banned = true;
    patch.profile_status_reason = body.reason ?? "Removed by admin";
    await supabase
      .from("properties")
      .update({ status: "hidden" })
      .eq("agent_id", body.agent_id);
  }

  await supabase.from("profiles").update(patch).eq("id", body.agent_id);

  await supabase.from("agent_status_logs").insert({
    agent_id: body.agent_id,
    action: body.action,
    reason: body.reason ?? null,
    actor_id: auth.user.id,
    metadata: { hide_listings: body.hide_listings },
  });

  const auditAction =
    body.action === "on_hold"
      ? "agent.on_hold"
      : body.action === "pending_verification"
        ? "agent.verification_request"
        : `agent.${body.action}`;

  const { data: agentProfile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", body.agent_id)
    .maybeSingle();

  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "profile",
    target_id: body.agent_id,
    target_user_id: body.agent_id,
    target_user_name: agentProfile?.full_name ?? agentProfile?.username ?? null,
    reason: body.reason,
    metadata: { reason: body.reason, patch },
    ip,
  });

  await supabase.rpc("yike_refresh_abuse_review_flag", { p_user_id: body.agent_id });

  return NextResponse.json({ ok: true });
}
