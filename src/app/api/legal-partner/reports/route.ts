import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import type { RiskLevel } from "@/lib/legal-partner/constants";

export const runtime = "nodejs";

const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "high", "unclear"];

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: partner } = await admin
    .from("legal_partners")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!partner || partner.status !== "approved") {
    return NextResponse.json({ error: "Not an active legal partner" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.requestId ?? "").trim();
  const riskObservations = String(body.riskObservations ?? "").trim();
  const recommendationSummary = String(body.recommendationSummary ?? "").trim();
  const overallRisk = String(body.overallRiskLevel ?? "unclear") as RiskLevel;

  if (!requestId || !riskObservations || !recommendationSummary) {
    return NextResponse.json({ error: "Request, observations, and summary required" }, { status: 400 });
  }

  if (!RISK_LEVELS.includes(overallRisk)) {
    return NextResponse.json({ error: "Invalid risk level" }, { status: 400 });
  }

  if (riskObservations.length < 80 || recommendationSummary.length < 40) {
    return NextResponse.json({ error: "Provide substantive legal observations" }, { status: 400 });
  }

  const { data: reqRow } = await admin
    .from("legal_verification_requests")
    .select("id, assigned_legal_partner_id, status")
    .eq("id", requestId)
    .single();

  if (!reqRow || reqRow.assigned_legal_partner_id !== partner.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (reqRow.status !== "in_progress") {
    return NextResponse.json({ error: "Cannot submit report for this status" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const docsReviewed = Array.isArray(body.documentsReviewed)
    ? body.documentsReviewed.filter((d: unknown) => typeof d === "string")
    : [];

  const { error } = await admin.from("legal_verification_reports").upsert({
    legal_request_id: requestId,
    partner_id: partner.id,
    documents_reviewed: docsReviewed,
    registry_search_conducted: Boolean(body.registrySearchConducted),
    ownership_consistency_observed: String(body.ownershipConsistency ?? "").trim() || null,
    litigation_concerns: String(body.litigationConcerns ?? "").trim() || null,
    survey_concerns: String(body.surveyConcerns ?? "").trim() || null,
    encumbrance_concerns: String(body.encumbranceConcerns ?? "").trim() || null,
    document_irregularities: String(body.documentIrregularities ?? "").trim() || null,
    risk_observations: riskObservations,
    recommendation_summary: recommendationSummary,
    overall_risk_level: overallRisk,
    admin_review_status: "pending",
    submitted_at: now,
  });

  if (error) return NextResponse.json({ error: "Could not save report" }, { status: 500 });

  await admin
    .from("legal_verification_requests")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", requestId);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "legal_partner.report.submit",
    target_type: "legal_verification_request",
    target_id: requestId,
    metadata: { partnerId: partner.id, risk: overallRisk },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true, message: "Report submitted for admin review" });
}
