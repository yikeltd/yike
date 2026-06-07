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
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";
import { grantTrustBadge } from "@/lib/trust/operations/badges";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import { suggestVerifiersForRequest } from "@/lib/verification/suggestions";
import { formatReportValidityNotice } from "@/lib/verification/report-expiry";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin
    .from("property_verification_requests")
    .select("*, properties(id, title, city, area, agent_id)")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: report } = await admin
    .from("property_verification_reports")
    .select("id, report_valid_until, admin_review_status, submitted_at")
    .eq("verification_request_id", id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prop = row.properties as { city?: string; state?: string } | null;
  const locationParts = row.property_location_text?.split(",").map((s: string) => s.trim()) ?? [];
  const suggestions = await suggestVerifiersForRequest(admin, {
    city: prop?.city ?? locationParts[locationParts.length - 2] ?? locationParts[0],
    state: prop?.state ?? locationParts[locationParts.length - 1],
    propertyId: row.property_id,
    listingAgentId: row.listing_agent_id,
  });

  return NextResponse.json({ request: row, report: report ?? null, suggestions });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: string;
    notes?: string;
    internalNotes?: string;
    priority?: string;
    verifierId?: string;
    buyerSummary?: string;
    buyerFeedback?: Record<string, unknown>;
    verifierFee?: number;
    assignmentNotes?: string;
    cautionNotes?: string;
    urgency?: string;
    instructions?: string;
  };

  const pinActions = new Set([
    "assign",
    "reject",
    "fraud_review",
    "deliver",
    "suspend_path",
  ]);
  if (pinActions.has(body.action)) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin
    .from("property_verification_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "mark_contacted") {
    await admin
      .from("property_verification_requests")
      .update({
        status: "contacted",
        contacted_at: now,
        contacted_by: auth.user.id,
        admin_internal_notes: body.internalNotes?.trim() || row.admin_internal_notes,
        updated_at: now,
      })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: "property_verification",
      caseId: id,
      caseReference: row.request_reference,
      eventType: "buyer_contacted",
      title: "Buyer contacted",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verification.buyer.contacted",
      target_type: "property_verification_request",
      target_id: id,
      metadata: { reference: row.request_reference },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve_for_assignment") {
    await admin
      .from("property_verification_requests")
      .update({
        status: "awaiting_assignment",
        priority: body.priority ?? row.priority,
        admin_internal_notes: body.internalNotes?.trim() || row.admin_internal_notes,
        updated_at: now,
      })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  }

  if (body.action === "hold") {
    await admin
      .from("property_verification_requests")
      .update({
        status: "under_review",
        admin_internal_notes: body.internalNotes?.trim() || row.admin_internal_notes,
        updated_at: now,
      })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await admin
      .from("property_verification_requests")
      .update({ status: "rejected", internal_notes: body.notes ?? null, updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "assign" && body.verifierId) {
    const check = await canAssignVerifier(admin, {
      verifierId: body.verifierId,
      propertyId: row.property_id ?? "",
      listingAgentId: row.listing_agent_id,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    const expireHours = await getAssignmentExpireHours(admin);
    const fee = body.verifierFee != null ? Number(body.verifierFee) : await getDefaultVerifierFee(admin);

    await admin
      .from("property_verification_requests")
      .update({
        assigned_verifier_id: body.verifierId,
        status: "assigned",
        verifier_fee: fee,
        assignment_notes: body.assignmentNotes?.trim() || null,
        assignment_caution_notes: body.cautionNotes?.trim() || null,
        assignment_urgency: body.urgency?.trim() || null,
        assignment_instructions: body.instructions?.trim() || null,
        assignment_expires_at: assignmentExpiresAt(expireHours),
        assigned_at: now,
        updated_at: now,
      })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: "property_verification",
      caseId: id,
      caseReference: row.request_reference,
      eventType: "verifier_assigned",
      title: "Verifier assigned",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
      metadata: { verifierId: body.verifierId, fee },
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verifier.assignment.assign",
      target_type: "property_verification_request",
      target_id: id,
      metadata: { verifierId: body.verifierId, reference: row.request_reference },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "deliver" && body.buyerSummary) {
    const { data: report } = await admin
      .from("property_verification_reports")
      .select("report_valid_until")
      .eq("verification_request_id", id)
      .eq("admin_review_status", "approved")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const validity = formatReportValidityNotice(report?.report_valid_until ?? null);
    const summary = `${body.buyerSummary.trim()}${validity}`;

    await admin
      .from("property_verification_requests")
      .update({
        status: "delivered",
        buyer_summary: summary,
        delivered_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (row.property_id) {
      await grantTrustBadge(admin, {
        entityType: "property",
        entityId: row.property_id as string,
        badgeType: "physically_reviewed",
        grantedBy: auth.user.id,
        expiresAt: report?.report_valid_until ?? null,
        adminNotes: `Verification ${row.request_reference}`,
      });
      await admin
        .from("properties")
        .update({
          internal_trust_status: "physically_reviewed",
          updated_at: now,
        })
        .eq("id", row.property_id);

      void recordListingHistoryEvent(admin, {
        listingId: row.property_id as string,
        eventType: "verified_physical",
        newValue: { reference: row.request_reference },
        actorId: auth.user.id,
        actorRole: auth.profile.role,
        source: "verification_deliver",
        publicVisible: true,
      });
    }

    await appendTrustTimeline(admin, {
      caseType: "property_verification",
      caseId: id,
      caseReference: row.request_reference,
      eventType: "delivered_to_buyer",
      title: "Summary delivered to buyer",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
      metadata: { reportValidUntil: report?.report_valid_until ?? null },
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "verification.buyer.delivered",
      target_type: "property_verification_request",
      target_id: id,
      metadata: { reference: row.request_reference },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_buyer_feedback" && body.buyerFeedback) {
    await admin
      .from("property_verification_requests")
      .update({
        buyer_feedback: {
          ...body.buyerFeedback,
          recorded_at: now,
          recorded_by: auth.user.id,
        },
        updated_at: now,
      })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_notes") {
    await admin
      .from("property_verification_requests")
      .update({
        admin_internal_notes: body.internalNotes?.trim() || null,
        updated_at: now,
      })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "close") {
    await admin
      .from("property_verification_requests")
      .update({ status: "closed", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
