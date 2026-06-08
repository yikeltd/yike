import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyBulkEnforcement,
  applyEnforcementAction,
  type EnforcementAction,
} from "@/lib/verification/enforcement";
import { getVerificationControlConfig } from "@/lib/verification/config";
import { refreshOperationalSuspicionScore } from "@/lib/verification/abuse-signals";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    userId?: string;
    userIds?: string[];
    action: EnforcementAction;
    reason?: string;
  };

  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const userIds = body.userIds?.length
    ? body.userIds
    : body.userId
      ? [body.userId]
      : [];

  if (userIds.length === 0) {
    return NextResponse.json({ error: "userId or userIds required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const config = await getVerificationControlConfig(admin);
  const reason = String(body.reason ?? "").trim() || `Trust enforcement: ${body.action}`;
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  let result: { succeeded: string[]; failed: string[] };
  if (userIds.length === 1) {
    const single = await applyEnforcementAction(admin, {
      userId: userIds[0]!,
      action: body.action,
      reason,
      actorId: auth.user.id,
      config,
    });
    result = {
      succeeded: single.ok ? userIds : [],
      failed: single.ok ? [] : userIds,
    };
  } else {
    result = await applyBulkEnforcement(admin, {
      userIds,
      action: body.action,
      reason,
      actorId: auth.user.id,
    });
  }

  for (const userId of result.succeeded) {
    await refreshOperationalSuspicionScore(admin, userId);
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "trust.verification.escalate",
      target_type: "profile",
      target_id: userId,
      metadata: { action: body.action, reason, bulk: userIds.length > 1 },
      ip,
    });
  }

  return NextResponse.json(result);
}
