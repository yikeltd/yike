import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profileId = new URL(req.url).searchParams.get("profile_id");
  if (!profileId) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await supabase
    .from("account_view_permissions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return NextResponse.json({ permission: data });
}

export async function POST(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    profile_id: string;
    can_view_accounts: boolean;
    notes?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  await supabase.from("account_view_permissions").upsert({
    profile_id: body.profile_id,
    can_view_accounts: body.can_view_accounts,
    granted_by: auth.user.id,
    granted_at: new Date().toISOString(),
    notes: body.notes ?? null,
  });

  const ctx = await getRequestAuditContext();
  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: body.can_view_accounts
      ? "trust.verification.permission.grant"
      : "trust.verification.permission.revoke",
    target_type: "staff",
    target_id: body.profile_id,
    reason: body.notes,
    metadata: { permission: "can_view_accounts", granted: body.can_view_accounts },
    ip: ctx.ip,
    user_agent_hash: ctx.user_agent_hash,
    route: ctx.route,
  });

  return NextResponse.json({ ok: true });
}
