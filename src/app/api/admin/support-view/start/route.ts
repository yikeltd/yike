import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import {
  canViewAccounts,
  setSupportViewCookie,
  type SupportViewSession,
} from "@/lib/admin/support-view";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const allowed = await canViewAccounts(auth.user.id, auth.profile.role);
  if (!allowed) {
    return NextResponse.json({ error: "Account view permission required" }, { status: 403 });
  }

  const body = (await req.json()) as { target_user_id?: string };
  if (!body.target_user_id) {
    return NextResponse.json({ error: "target_user_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, username, role")
    .eq("id", body.target_user_id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: sessionRow } = await supabase
    .from("support_view_sessions")
    .insert({
      admin_id: auth.user.id,
      target_user_id: target.id,
      read_only: true,
      route: "/lex/auth/users",
    })
    .select("id")
    .single();

  const ctx = await getRequestAuditContext("/lex/auth/users");
  const targetName = target.full_name ?? target.username ?? "User";

  const session: SupportViewSession = {
    sessionId: sessionRow?.id ?? crypto.randomUUID(),
    adminId: auth.user.id,
    targetUserId: target.id,
    targetUserName: targetName,
    readOnly: true,
    startedAt: new Date().toISOString(),
  };

  await setSupportViewCookie(session);

  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "support_view.start",
    target_type: "profile",
    target_id: target.id,
    target_user_id: target.id,
    target_user_name: targetName,
    metadata: { target_role: target.role },
    ip: ctx.ip,
    user_agent_hash: ctx.user_agent_hash,
    route: ctx.route,
  });

  return NextResponse.json({ ok: true, session });
}
