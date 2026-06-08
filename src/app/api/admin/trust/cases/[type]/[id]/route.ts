import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendTrustTimeline, getTrustTimeline } from "@/lib/trust/operations/timeline";
import { createTrustEscalation } from "@/lib/trust/operations/escalations";
import { addToBlacklist } from "@/lib/trust/operations/blacklist";
import { addToWatchlist } from "@/lib/trust/operations/watchlist";
import { disputeRef } from "@/lib/trust/operations/escalations";
import {
  assessPropertyVerificationRisk,
  persistRiskAssessment,
  syncRequestInternalRisk,
} from "@/lib/trust/operations/risk-scoring";
import { generateUniqueYvrReference } from "@/lib/verification/reference";
import type { TrustCaseType } from "@/lib/trust/operations/constants";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ type: string; id: string }> };

const CASE_MAP: Record<string, { table: string; caseType: TrustCaseType; refField: string }> = {
  property: {
    table: "property_verification_requests",
    caseType: "property_verification",
    refField: "request_reference",
  },
  legal: {
    table: "legal_verification_requests",
    caseType: "legal_verification",
    refField: "request_reference",
  },
};

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { type, id } = await ctx.params;
  const meta = CASE_MAP[type];
  if (!meta) return NextResponse.json({ error: "Invalid case type" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin.from(meta.table).select("*").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const timeline = await getTrustTimeline(admin, meta.caseType, id);

  const entityType =
    type === "property" ? "property_verification_request" : "legal_verification_request";
  const { data: riskRow } = await admin
    .from("trust_risk_assessments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .maybeSingle();

  const { data: disputes } = await admin
    .from("verification_disputes")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    case: row,
    timeline,
    risk: riskRow,
    disputes: disputes ?? [],
  });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinActions = new Set([
    "escalate",
    "fraud_review",
    "blacklist",
    "reinspection",
    "freeze_agent",
    "hold_listing",
    "create_dispute",
  ]);

  const { type, id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");

  if (pinActions.has(action)) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const meta = CASE_MAP[type];
  if (!meta) return NextResponse.json({ error: "Invalid case type" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: row } = await admin.from(meta.table).select("*").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ref = row[meta.refField] as string;

  if (action === "recalculate_risk" && type === "property") {
    const assessed = assessPropertyVerificationRisk({
      concernFlags: row.concern_flags as Record<string, boolean>,
      buyerContext: row.buyer_context as Record<string, boolean>,
      isDiaspora: row.is_diaspora_request,
      priority: row.priority,
      status: row.status,
    });
    await persistRiskAssessment(admin, {
      entityType: "property_verification_request",
      entityId: id,
      entityReference: ref,
      level: assessed.level,
      score: assessed.score,
      signals: assessed.signals,
      assessedBy: auth.user.id,
    });
    await syncRequestInternalRisk(admin, "property_verification_requests", id, assessed.level);
    await appendTrustTimeline(admin, {
      caseType: meta.caseType,
      caseId: id,
      caseReference: ref,
      eventType: "risk_assessed",
      title: `Risk assessed: ${assessed.level}`,
      actorId: auth.user.id,
      actorRole: auth.profile.role,
      metadata: { score: assessed.score },
    });
    return NextResponse.json({ ok: true, risk: assessed });
  }

  if (action === "save_assignment_notes") {
    const patch = {
      assignment_caution_notes: String(body.cautionNotes ?? "").trim() || null,
      assignment_urgency: String(body.urgency ?? "").trim() || null,
      assignment_instructions: String(body.instructions ?? "").trim() || null,
      assignment_notes: String(body.assignmentNotes ?? "").trim() || row.assignment_notes,
      updated_at: now,
    };
    await admin.from(meta.table).update(patch).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "set_diaspora_priority") {
    await admin
      .from(meta.table)
      .update({
        diaspora_priority: Boolean(body.enabled),
        priority: body.enabled ? "high" : row.priority,
        updated_at: now,
      })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "escalate") {
    const esc = await createTrustEscalation(admin, {
      sourceCaseType: meta.caseType,
      sourceCaseId: id,
      sourceReference: ref,
      escalationType: String(body.escalationType ?? "fraud_concern"),
      reason: String(body.reason ?? "Admin escalation"),
      priority: String(body.priority ?? "normal"),
      requestedActions: Array.isArray(body.requestedActions)
        ? (body.requestedActions as string[])
        : [],
      openedBy: auth.user.id,
      adminNotes: String(body.notes ?? "").trim() || undefined,
    });
    if (!esc) return NextResponse.json({ error: "Could not create escalation" }, { status: 500 });

    await admin.from(meta.table).update({ escalation_id: esc.id, updated_at: now }).eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: meta.caseType,
      caseId: id,
      caseReference: ref,
      eventType: "escalation_opened",
      title: `Escalation ${esc.reference}`,
      detail: String(body.reason ?? ""),
      actorId: auth.user.id,
      actorRole: auth.profile.role,
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "trust.escalation.open",
      target_type: "trust_escalation",
      target_id: esc.id,
      metadata: { caseId: id, reference: esc.reference },
      ip,
    });

    return NextResponse.json({ ok: true, escalation: esc });
  }

  if (action === "fraud_review") {
    await admin
      .from(meta.table)
      .update({ status: "fraud_review", internal_risk_level: "high", updated_at: now })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: meta.caseType,
      caseId: id,
      caseReference: ref,
      eventType: "fraud_review_triggered",
      title: "Moved to fraud review",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
    });

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "trust.fraud_review",
      target_type: meta.table,
      target_id: id,
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "reinspection" && type === "property") {
    const newRef = await generateUniqueYvrReference(admin);
    const { data: created, error } = await admin
      .from("property_verification_requests")
      .insert({
        request_reference: newRef,
        property_id: row.property_id,
        requester_user_id: row.requester_user_id,
        listing_agent_id: row.listing_agent_id,
        status: "awaiting_assignment",
        source: "reinspection",
        buyer_full_name: row.buyer_full_name,
        buyer_email: row.buyer_email,
        buyer_whatsapp: row.buyer_whatsapp,
        property_title: row.property_title,
        property_location_text: row.property_location_text,
        property_link: row.property_link,
        reinspection_of_request_id: id,
        reinspection_requested: true,
        admin_internal_notes: `Re-inspection of ${ref}`,
        priority: "high",
        terms_accepted: true,
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Could not create re-inspection" }, { status: 500 });
    }

    await admin
      .from("property_verification_requests")
      .update({ reinspection_requested: true, updated_at: now })
      .eq("id", id);

    await appendTrustTimeline(admin, {
      caseType: "property_verification",
      caseId: id,
      caseReference: ref,
      eventType: "reinspection_requested",
      title: `Re-inspection queued (${newRef})`,
      actorId: auth.user.id,
      actorRole: auth.profile.role,
      metadata: { newRequestId: created.id, newReference: newRef },
    });

    return NextResponse.json({ ok: true, newReference: newRef, newRequestId: created.id });
  }

  if (action === "blacklist") {
    const entityType = String(body.entityType ?? "verifier") as
      | "verifier"
      | "legal_partner"
      | "agent"
      | "company";
    const entityId = String(body.entityId ?? "");
    if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

    await addToBlacklist(admin, {
      entityType,
      entityId,
      entityLabel: String(body.entityLabel ?? ""),
      reason: String(body.reason ?? "Trust blacklist"),
      reasonCode: String(body.reasonCode ?? ""),
      payoutsFrozen: Boolean(body.payoutsFrozen),
      addedBy: auth.user.id,
    });

    if (entityType === "verifier") {
      await admin
        .from("field_verifiers")
        .update({
          status: "suspended",
          payout_enabled: false,
          payout_hold_reason: "Blacklisted",
          updated_at: now,
        })
        .eq("id", entityId);
    }
    if (entityType === "legal_partner") {
      await admin
        .from("legal_partners")
        .update({
          status: "suspended",
          payout_enabled: false,
          payout_hold_reason: "Blacklisted",
          updated_at: now,
        })
        .eq("id", entityId);
    }

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "trust.blacklist.add",
      target_type: entityType,
      target_id: entityId,
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "watchlist") {
    await addToWatchlist(admin, {
      entityType: String(body.entityType ?? "agent"),
      entityId: String(body.entityId ?? "") || null,
      entityLabel: String(body.entityLabel ?? "Unknown"),
      watchReason: String(body.reason ?? "Fraud watch"),
      notes: String(body.notes ?? ""),
      addedBy: auth.user.id,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "create_dispute") {
    const dref = disputeRef();
    await admin.from("verification_disputes").insert({
      dispute_reference: dref,
      case_type: meta.caseType,
      case_id: id,
      dispute_type: String(body.disputeType ?? "other"),
      description: String(body.description ?? "Dispute filed"),
      requester_user_id: row.requester_user_id ?? null,
    });

    await appendTrustTimeline(admin, {
      caseType: meta.caseType,
      caseId: id,
      caseReference: ref,
      eventType: "dispute_submitted",
      title: `Dispute ${dref}`,
      actorId: auth.user.id,
      actorRole: auth.profile.role,
    });

    return NextResponse.json({ ok: true, reference: dref });
  }

  if (action === "hold_listing" && row.property_id) {
    await admin
      .from("properties")
      .update({ internal_trust_status: "under_investigation", updated_at: now })
      .eq("id", row.property_id);

    await appendTrustTimeline(admin, {
      caseType: meta.caseType,
      caseId: id,
      caseReference: ref,
      eventType: "listing_held",
      title: "Listing held for investigation",
      actorId: auth.user.id,
      actorRole: auth.profile.role,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
