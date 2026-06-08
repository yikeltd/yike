import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VERIFICATION_CALL_METHOD,
  VERIFICATION_WHATSAPP_NUMBER,
} from "@/lib/agent-verification";
import type { VerificationCallStatus } from "@/types/database";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    verification_id: string;
    agent_id: string;
    action:
      | "schedule_call"
      | "reschedule_call"
      | "complete_call"
      | "missed_call"
      | "failed_call"
      | "approve"
      | "reject"
      | "request_info";
    call_time?: string;
    notes?: string;
    rejection_reason?: string;
  };

  const needsPin = ["approve", "reject"].includes(body.action);
  if (needsPin) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const now = new Date().toISOString();

  const verificationUpdate: Record<string, unknown> = {
    verification_call_method: VERIFICATION_CALL_METHOD,
    verification_whatsapp_number: VERIFICATION_WHATSAPP_NUMBER,
    verification_notes: body.notes ?? null,
  };

  if (body.action === "schedule_call" || body.action === "reschedule_call") {
    if (!body.call_time) {
      return NextResponse.json({ error: "Call time required" }, { status: 400 });
    }
    verificationUpdate.verification_call_status = "scheduled" as VerificationCallStatus;
    verificationUpdate.verification_call_time = body.call_time;
  } else if (body.action === "complete_call") {
    verificationUpdate.verification_call_status = "completed" as VerificationCallStatus;
  } else if (body.action === "missed_call") {
    verificationUpdate.verification_call_status = "missed" as VerificationCallStatus;
  } else if (body.action === "failed_call") {
    verificationUpdate.verification_call_status = "failed" as VerificationCallStatus;
  } else if (body.action === "approve") {
    verificationUpdate.status = "approved";
    verificationUpdate.reviewed_at = now;
    verificationUpdate.reviewed_by = auth.user.id;
    verificationUpdate.verified_at = now;
    verificationUpdate.verified_by = auth.user.id;
    verificationUpdate.verification_call_status = "completed";

    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("listing_limit_updated_by")
      .eq("id", body.agent_id)
      .single();

    const profilePatch: Record<string, unknown> = {
      role: "agent_verified",
      verification_status: "approved",
      verified_badge: true,
      ranking_score: 100,
      verification_required: false,
    };

    if (!agentProfile?.listing_limit_updated_by) {
      profilePatch.listing_limit = null;
    }

    await supabase.from("profiles").update(profilePatch).eq("id", body.agent_id);
  } else if (body.action === "reject") {
    verificationUpdate.status = "rejected";
    verificationUpdate.rejection_reason =
      body.rejection_reason ?? "Did not meet verification requirements";
    verificationUpdate.reviewed_at = now;
    verificationUpdate.reviewed_by = auth.user.id;

    await supabase
      .from("profiles")
      .update({
        verification_status: "rejected",
        verified_badge: false,
      })
      .eq("id", body.agent_id);
  }

  await supabase
    .from("agent_verifications")
    .update(verificationUpdate)
    .eq("id", body.verification_id);

  if (body.action === "approve" || body.action === "reject") {
    void fetch(`${process.env.SITE_URL ?? "https://yike.ng"}/api/notifications/email/agent-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: body.agent_id,
        status: body.action === "approve" ? "approved" : "rejected",
        reason: body.rejection_reason,
      }),
    });
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: `agent.verification.${body.action}`,
    target_type: "agent_verification",
    target_id: body.verification_id,
    metadata: {
      agent_id: body.agent_id,
      method: VERIFICATION_CALL_METHOD,
      whatsapp: VERIFICATION_WHATSAPP_NUMBER,
      call_time: body.call_time,
    },
    ip,
  });

  return NextResponse.json({
    ok: true,
    whatsapp_number: VERIFICATION_WHATSAPP_NUMBER,
    method: VERIFICATION_CALL_METHOD,
  });
}
