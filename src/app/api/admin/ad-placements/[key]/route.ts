import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { key } = await params;
  const payload = (await req.json()) as Record<string, unknown>;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("ad_placements")
    .update(payload)
    .eq("placement_key", key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const ctx = await getRequestAuditContext("/lex/auth/ads");
  writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "ad_placement.update",
    target_type: "ad_placement",
    target_id: key,
    metadata: payload,
    ip: ctx.ip,
    user_agent_hash: ctx.user_agent_hash,
    route: ctx.route,
  });

  return NextResponse.json({ ok: true });
}
