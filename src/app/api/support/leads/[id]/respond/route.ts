import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLeadEvent } from "@/lib/leads/events";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteCtx) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await admin.rpc("yike_mark_lead_responded", {
    p_lead_id: id,
    p_actor_id: auth.user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "lead.respond",
    target_type: "lead",
    target_id: id,
    ip,
  });

  await logLeadEvent({
    leadId: id,
    type: "support_replied",
    actorId: auth.user.id,
    actorRole: auth.profile.role,
  });

  return NextResponse.json({ ok: true });
}
