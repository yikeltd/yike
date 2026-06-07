import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { profileStatusFromAccountAction } from "@/lib/account-control";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentProfileStatus } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as { reason?: string };
  const reason = String(body.reason ?? "").trim() || "Verification requested by Yike";

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileStatus = profileStatusFromAccountAction("pending_verification");

  await supabase
    .from("profiles")
    .update({
      profile_status: profileStatus,
      profile_status_reason: reason,
      verification_required: true,
      verification_status: "pending",
    })
    .eq("id", id);

  await supabase.from("admin_verification_requests").insert({
    user_id: id,
    requested_by: auth.user.id,
    reason,
    status: "open",
  });

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "agent.verification_request",
    target_type: "profile",
    target_id: id,
    metadata: { reason },
    ip,
  });

  return NextResponse.json({ ok: true });
}
