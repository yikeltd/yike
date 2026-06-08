import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAssignVerifier } from "@/lib/verifier/assignment";
import { getDefaultVerifierFee } from "@/lib/verifier/earnings";
import {
  assignmentExpiresAt,
  getAssignmentExpireHours,
} from "@/lib/verification/assignments";

export const runtime = "nodejs";

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
  const body = (await req.json()) as {
    action: "assign" | "cancel" | "fraud_review";
    verifierId?: string;
    assignmentNotes?: string;
    verifierFee?: number;
    internalNotes?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: requestRow } = await admin
    .from("property_verification_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!requestRow) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "cancel") {
    await admin
      .from("property_verification_requests")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "fraud_review") {
    await admin
      .from("property_verification_requests")
      .update({ status: "fraud_review", internal_notes: body.internalNotes ?? null, updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "assign" || !body.verifierId) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const check = await canAssignVerifier(admin, {
    verifierId: body.verifierId,
    propertyId: requestRow.property_id,
    listingAgentId: requestRow.listing_agent_id,
  });

  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 409 });
  }

  const fee =
    body.verifierFee != null ? Number(body.verifierFee) : await getDefaultVerifierFee(admin);
  const expireHours = await getAssignmentExpireHours(admin);

  await admin
    .from("property_verification_requests")
    .update({
      assigned_verifier_id: body.verifierId,
      status: "assigned",
      verifier_fee: fee,
      assignment_notes: body.assignmentNotes?.trim() || null,
      internal_notes: body.internalNotes?.trim() || requestRow.internal_notes,
      assigned_at: now,
      assignment_expires_at: assignmentExpiresAt(expireHours),
      updated_at: now,
    })
    .eq("id", id);

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "verifier.assignment.assign",
    target_type: "property_verification_request",
    target_id: id,
    metadata: { verifierId: body.verifierId, fee },
    ip,
  });

  return NextResponse.json({ ok: true });
}
