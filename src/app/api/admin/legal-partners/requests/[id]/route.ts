import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAssignLegalPartner } from "@/lib/legal-partner/assignment";
import { getDefaultPartnerFee } from "@/lib/legal-partner/earnings";
import { suggestLegalPartners } from "@/lib/legal-partner/suggestions";
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";

export const runtime = "nodejs";

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
    .from("legal_verification_requests")
    .select("*, properties(id, title, city, area, agent_id)")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prop = row.properties as { city?: string; area?: string; agent_id?: string } | null;
  const locationParts =
    row.property_location_text?.split(",").map((s: string) => s.trim()) ?? [];

  const suggestions = await suggestLegalPartners(admin, {
    city: prop?.city ?? prop?.area ?? locationParts[0],
    state: row.property_location_text?.split(",").pop()?.trim(),
    reviewType: row.review_type,
    listingAgentId: row.listing_agent_id ?? prop?.agent_id ?? null,
  });

  return NextResponse.json({ request: row, suggestions });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: string;
    partnerId?: string;
    adminNotes?: string;
    internalRiskNotes?: string;
    buyerSummary?: string;
    partnerFee?: number;
    cautionNotes?: string;
    urgency?: string;
    instructions?: string;
  };

  const pinActions = new Set(["assign", "fraud_review", "deliver", "reject"]);
  if (pinActions.has(body.action)) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin
    .from("legal_verification_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (body.action === "mark_contacted") {
    await admin
      .from("legal_verification_requests")
      .update({ status: "contacted", admin_notes: body.adminNotes?.trim() || row.admin_notes, updated_at: now })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: "legal_verification",
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
      action: "legal_verification.buyer.contacted",
      target_type: "legal_verification_request",
      target_id: id,
      metadata: { reference: row.request_reference },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "awaiting_documents") {
    await admin
      .from("legal_verification_requests")
      .update({ status: "awaiting_documents", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "awaiting_assignment") {
    await admin
      .from("legal_verification_requests")
      .update({ status: "awaiting_assignment", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "fraud_review") {
    await admin
      .from("legal_verification_requests")
      .update({
        status: "fraud_review",
        internal_risk_notes: body.internalRiskNotes?.trim() || row.internal_risk_notes,
        updated_at: now,
      })
      .eq("id", id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "legal_verification.fraud_review",
      target_type: "legal_verification_request",
      target_id: id,
      metadata: { reference: row.request_reference },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await admin
      .from("legal_verification_requests")
      .update({ status: "rejected", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "deliver") {
    const summary = body.buyerSummary?.trim();
    if (!summary || summary.length < 40) {
      return NextResponse.json({ error: "Buyer summary required" }, { status: 400 });
    }

    await admin
      .from("legal_verification_requests")
      .update({
        status: "delivered",
        buyer_summary: summary,
        delivered_at: now,
        updated_at: now,
      })
      .eq("id", id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "legal_verification.buyer.delivered",
      target_type: "legal_verification_request",
      target_id: id,
      metadata: { reference: row.request_reference },
      ip,
    });

    if (row.property_id) {
      void recordListingHistoryEvent(admin, {
        listingId: row.property_id as string,
        eventType: "legal_review_completed",
        newValue: { reference: row.request_reference },
        actorId: auth.user.id,
        actorRole: auth.profile.role,
        source: "legal_verification_deliver",
        publicVisible: true,
      });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "assign" && body.partnerId) {
    const check = await canAssignLegalPartner(admin, {
      partnerId: body.partnerId,
      listingAgentId: row.listing_agent_id,
    });

    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    const fee =
      body.partnerFee != null ? Number(body.partnerFee) : await getDefaultPartnerFee(admin);

    await admin
      .from("legal_verification_requests")
      .update({
        assigned_legal_partner_id: body.partnerId,
        status: "assigned",
        partner_fee: fee,
        admin_notes: body.adminNotes?.trim() || row.admin_notes,
        internal_risk_notes: body.internalRiskNotes?.trim() || row.internal_risk_notes,
        assignment_caution_notes: String(body.cautionNotes ?? "").trim() || null,
        assignment_urgency: String(body.urgency ?? "").trim() || null,
        assignment_instructions: String(body.instructions ?? "").trim() || null,
        assigned_at: now,
        updated_at: now,
      })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: "legal_verification",
      caseId: id,
      caseReference: row.request_reference,
      eventType: "legal_partner_assigned",
      title: "Legal partner assigned",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
      metadata: { partnerId: body.partnerId, fee },
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "legal_partner.assignment.assign",
      target_type: "legal_verification_request",
      target_id: id,
      metadata: { partnerId: body.partnerId, fee },
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
