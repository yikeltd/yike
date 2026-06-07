import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  getReportQualityConfig,
  validateReportSubmission,
} from "@/lib/verification/report-quality";
import { getReportValidUntil } from "@/lib/verification/assignments";
import { OCCUPANCY_OPTIONS } from "@/lib/verification/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: verifier } = await admin
    .from("field_verifiers")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!verifier || verifier.status !== "approved") {
    return NextResponse.json({ error: "Not an active verifier" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.requestId ?? "").trim();
  const inspectionSummary = String(body.inspectionSummary ?? "").trim();

  if (!requestId || !inspectionSummary) {
    return NextResponse.json({ error: "Request and summary required" }, { status: 400 });
  }

  const { data: reqRow } = await admin
    .from("property_verification_requests")
    .select("id, assigned_verifier_id, status")
    .eq("id", requestId)
    .single();

  if (!reqRow || reqRow.assigned_verifier_id !== verifier.id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (!["accepted", "in_progress"].includes(reqRow.status)) {
    return NextResponse.json({ error: "Cannot submit report for this status" }, { status: 409 });
  }

  const confidence = String(body.verifierConfidenceLevel ?? "medium");
  if (!["low", "medium", "high"].includes(confidence)) {
    return NextResponse.json({ error: "Invalid confidence level" }, { status: 400 });
  }

  const images = Array.isArray(body.uploadedImages)
    ? body.uploadedImages.filter((u: unknown) => typeof u === "string").slice(0, 12)
    : [];

  const occupancyStatus = String(body.occupancyStatus ?? "").trim();
  if (!OCCUPANCY_OPTIONS.includes(occupancyStatus as (typeof OCCUPANCY_OPTIONS)[number])) {
    return NextResponse.json({ error: "Select a valid occupancy status" }, { status: 400 });
  }

  const photoChecklist =
    body.photoChecklist && typeof body.photoChecklist === "object"
      ? (body.photoChecklist as Record<string, boolean>)
      : {};

  const config = await getReportQualityConfig(admin);
  const qualityError = validateReportSubmission({
    inspectionSummary,
    uploadedImages: images,
    propertyFound: Boolean(body.propertyFound),
    propertyAccessible: Boolean(body.propertyAccessible),
    occupancyStatus,
    photoChecklist,
    config,
  });
  if (qualityError) {
    return NextResponse.json({ error: qualityError }, { status: 400 });
  }

  const now = new Date().toISOString();
  const reportValidUntil = await getReportValidUntil(admin);

  const { error: reportError } = await admin.from("property_verification_reports").upsert({
    verification_request_id: requestId,
    verifier_id: verifier.id,
    property_found: Boolean(body.propertyFound),
    property_accessible: Boolean(body.propertyAccessible),
    photos_match_listing: body.photosMatchListing == null ? null : Boolean(body.photosMatchListing),
    occupancy_status: occupancyStatus,
    neighborhood_notes: String(body.neighborhoodNotes ?? "").trim() || null,
    neighborhood_quality: String(body.neighborhoodQuality ?? "").trim() || null,
    road_access_notes: String(body.roadAccessNotes ?? "").trim() || null,
    physical_condition_notes: String(body.physicalConditionNotes ?? "").trim() || null,
    local_feedback: String(body.localFeedback ?? "").trim() || null,
    suspicious_signs: String(body.suspiciousSigns ?? "").trim() || null,
    overall_observation: String(body.overallObservation ?? "").trim() || inspectionSummary,
    met_agent_or_contact: body.metAgentOrContact == null ? null : Boolean(body.metAgentOrContact),
    contact_person_name: String(body.contactPersonName ?? "").trim() || null,
    inspection_summary: inspectionSummary,
    uploaded_images: images,
    uploaded_videos: [],
    photo_checklist: photoChecklist,
    verifier_confidence_level: confidence,
    admin_review_status: "pending",
    report_valid_until: reportValidUntil,
    submitted_at: now,
  });

  if (reportError) {
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }

  await admin
    .from("property_verification_requests")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", requestId);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "verifier.report.submit",
    target_type: "property_verification_request",
    target_id: requestId,
    metadata: { verifierId: verifier.id },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true, message: "Report submitted for admin review" });
}
