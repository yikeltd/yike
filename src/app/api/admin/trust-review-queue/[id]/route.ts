import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addTrustAdminNote,
  escalateUserTrust,
  restoreUserTrust,
} from "@/lib/verification/escalate";
import type { AdaptiveTrustLevel, TrustReviewAction } from "@/lib/verification/constants";
import { profileStatusFromAccountAction } from "@/lib/account-control";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: TrustReviewAction;
    userId?: string;
    note?: string;
    targetLevel?: AdaptiveTrustLevel;
  };

  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const isLive = id.startsWith("live-");
  const caseId = isLive ? undefined : id;
  let userId = body.userId;

  if (!userId && isLive) {
    userId = id.replace(/^live-/, "");
  }

  if (!userId && caseId) {
    const { data: caseRow } = await admin
      .from("trust_review_cases")
      .select("user_id")
      .eq("id", caseId)
      .maybeSingle();
    userId = caseRow?.user_id as string | undefined;
  }

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const note = body.note?.trim();

  if (note) {
    await addTrustAdminNote(admin, {
      userId,
      authorId: auth.user.id,
      note,
    });
  }

  let auditAction = "trust.review.resolve";
  let ok = true;

  switch (body.action) {
    case "approve":
    case "restore_trust": {
      const target = (body.targetLevel ?? 3) as AdaptiveTrustLevel;
      ok = await restoreUserTrust(admin, {
        userId,
        targetLevel: target,
        resolvedBy: auth.user.id,
        caseId,
        resolutionAction: body.action,
        note,
      });
      await admin
        .from("profiles")
        .update({
          verification_required: false,
          account_status: "active",
          profile_status: profileStatusFromAccountAction("active"),
        })
        .eq("id", userId);
      auditAction = "trust.verification.restore";
      break;
    }
    case "reduce_restrictions": {
      const { data: profile } = await admin
        .from("profiles")
        .select("adaptive_trust_level")
        .eq("id", userId)
        .single();
      const current = Number(profile?.adaptive_trust_level ?? 4);
      const target = Math.max(2, current - 1) as AdaptiveTrustLevel;
      ok = await restoreUserTrust(admin, {
        userId,
        targetLevel: target,
        resolvedBy: auth.user.id,
        caseId,
        resolutionAction: body.action,
        note,
      });
      auditAction = "trust.verification.restore";
      break;
    }
    case "escalate":
    case "request_verification":
    case "require_whatsapp_review":
    case "require_bank_verification": {
      const { data: profile } = await admin
        .from("profiles")
        .select("adaptive_trust_level")
        .eq("id", userId)
        .single();
      const current = Number(profile?.adaptive_trust_level ?? 2);
      const level = Math.min(5, current + 1) as AdaptiveTrustLevel;
      const result = await escalateUserTrust(admin, {
        userId,
        level,
        reason: note || `Trust review: ${body.action}`,
        openedBy: auth.user.id,
        caseType: "manual",
        requiredActions: [body.action],
      });
      ok = Boolean(result);
      auditAction = "trust.verification.escalate";
      break;
    }
    case "pause_listings": {
      const result = await escalateUserTrust(admin, {
        userId,
        level: 5,
        reason: note || "Listings paused pending trust review",
        openedBy: auth.user.id,
        caseType: "manual",
      });
      ok = Boolean(result);
      auditAction = "trust.verification.escalate";
      break;
    }
    case "suspend_temporary": {
      await admin
        .from("profiles")
        .update({
          account_status: "suspended",
          profile_status: profileStatusFromAccountAction("suspended"),
          adaptive_trust_level: 5,
        })
        .eq("id", userId);
      if (caseId) {
        await admin
          .from("trust_review_cases")
          .update({
            status: "resolved",
            resolution_action: body.action,
            resolved_by: auth.user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", caseId);
      }
      break;
    }
    case "ban_permanent": {
      await admin
        .from("profiles")
        .update({
          is_banned: true,
          account_status: "suspended",
          profile_status: profileStatusFromAccountAction("suspended"),
          adaptive_trust_level: 5,
        })
        .eq("id", userId);
      if (caseId) {
        await admin
          .from("trust_review_cases")
          .update({
            status: "resolved",
            resolution_action: body.action,
            resolved_by: auth.user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", caseId);
      }
      break;
    }
    case "dismiss": {
      if (caseId) {
        await admin
          .from("trust_review_cases")
          .update({
            status: "dismissed",
            resolution_action: body.action,
            resolved_by: auth.user.id,
            resolved_at: new Date().toISOString(),
            admin_notes: note ?? null,
          })
          .eq("id", caseId);
      }
      auditAction = "trust.review.dismiss";
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!ok) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "profile",
    target_id: userId,
    metadata: { action: body.action, caseId, note },
    ip,
  });

  return NextResponse.json({ ok: true });
}
