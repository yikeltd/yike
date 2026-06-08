import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { isSuperAdmin } from "@/lib/admin/roles";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAbuseSuspicionSignals } from "@/lib/verification/abuse-signals";
import {
  applyEnforcementAction,
  type EnforcementAction,
} from "@/lib/verification/enforcement";
import { getVerificationControlConfig } from "@/lib/verification/config";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { deriveVerificationState, VERIFICATION_STATE_LABELS } from "@/lib/verification/status-states";
import { effectiveTrustLevel } from "@/lib/verification/levels";
import type { TrustProfileSlice } from "@/lib/verification/levels";
import { profileStatusFromAccountAction } from "@/lib/account-control";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: profile } = await admin.from("profiles").select("*").eq("id", id).single();
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const slice = profile as TrustProfileSlice;
  const config = await getVerificationControlConfig(admin);
  const abuse = await computeAbuseSuspicionSignals(admin, id);

  const { data: notes } = await admin
    .from("trust_admin_notes")
    .select("id, note, created_at, author_id")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(12);

  const tasks = getRequiredVerificationTasks(slice, config);
  const state = deriveVerificationState(slice);

  return NextResponse.json({
    trustLevel: effectiveTrustLevel(slice),
    verificationState: state,
    verificationStateLabel: VERIFICATION_STATE_LABELS[state],
    verificationRequired: Boolean(profile.verification_required),
    suspicionScore: abuse.suspicionScore,
    signals: abuse.signals,
    linkedAccountIds: abuse.linkedAccountIds,
    tasks,
    notes: notes ?? [],
    escalationReason: profile.verification_escalation_reason,
  });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action?: EnforcementAction | "suspend" | "delete";
    reason?: string;
    note?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const reason = body.reason?.trim() || body.note?.trim() || "Admin trust action";

  if (body.note?.trim()) {
    await admin.from("trust_admin_notes").insert({
      user_id: id,
      author_id: auth.user.id,
      note: body.note.trim(),
    });
  }

  if (body.action === "suspend" || body.action === "delete") {
    if (!isSuperAdmin(auth.profile.role)) {
      return NextResponse.json({ error: "Chief admin required" }, { status: 403 });
    }
    await admin
      .from("profiles")
      .update({
        is_banned: body.action === "delete",
        account_status: body.action === "suspend" ? "suspended" : "deleted",
        profile_status: profileStatusFromAccountAction(
          body.action === "suspend" ? "suspended" : "deleted"
        ),
        adaptive_trust_level: 5,
        verification_state: "suspended",
      })
      .eq("id", id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: body.action === "delete" ? "user.delete" : "agent.suspend",
      target_type: "profile",
      target_id: id,
      metadata: { reason },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const config = await getVerificationControlConfig(admin);
  const result = await applyEnforcementAction(admin, {
    userId: id,
    action: body.action,
    reason,
    actorId: auth.user.id,
    config,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action:
      body.action === "restore_trust" || body.action === "remove_escalation"
        ? "trust.verification.restore"
        : "trust.verification.escalate",
    target_type: "profile",
    target_id: id,
    metadata: { action: body.action, reason },
    ip,
  });

  return NextResponse.json({ success: true, caseId: result.caseId, reference: result.reference });
}
