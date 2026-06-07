import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueYlrReference } from "@/lib/legal-partner/reference";
import { createStaffOpsAlert } from "@/lib/verification/ops-alerts";
import type { LegalReviewType } from "@/lib/legal-partner/constants";
import { REVIEW_TYPE_OPTIONS } from "@/lib/legal-partner/constants";
import { sendLegalVerificationAlert } from "@/lib/email/service";
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import {
  assessPropertyVerificationRisk,
  persistRiskAssessment,
  syncRequestInternalRisk,
} from "@/lib/trust/operations/risk-scoring";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const propertyTitle = String(body.propertyTitle ?? "").trim();
  const propertyLocation = String(body.propertyLocation ?? "").trim();
  const reviewType = String(body.reviewType ?? "level_1_basic") as LegalReviewType;

  if (!fullName || !email || !whatsapp || !propertyTitle || !propertyLocation) {
    return NextResponse.json({ error: "Please complete required fields" }, { status: 400 });
  }

  if (!body.termsAccepted) {
    return NextResponse.json({ error: "Please accept legal assistance terms" }, { status: 400 });
  }

  if (!REVIEW_TYPE_OPTIONS.some((o) => o.id === reviewType)) {
    return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
  }

  const reference = await generateUniqueYlrReference(admin);
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const { data: row, error } = await admin
    .from("legal_verification_requests")
    .insert({
      request_reference: reference,
      requester_user_id: user?.id ?? null,
      status: "submitted",
      review_type: reviewType,
      buyer_full_name: fullName,
      buyer_email: email,
      buyer_whatsapp: whatsapp,
      property_title: propertyTitle,
      property_location_text: propertyLocation,
      property_id: body.propertyId ?? null,
      buyer_notes: String(body.notes ?? "").trim() || null,
      is_diaspora_request: Boolean(body.outsideNigeria),
      diaspora_priority: Boolean(body.outsideNigeria),
      terms_accepted: true,
      payment_status: "not_requested",
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }

  await createStaffOpsAlert(admin, {
    alertType: "legal_verification_new",
    title: "New Legal Verification Request",
    body: `${fullName} · ${propertyLocation} · ${reference}`,
    referenceType: "legal_verification_request",
    referenceId: reference,
    priority: body.outsideNigeria ? "high" : "normal",
  });

  const risk = assessPropertyVerificationRisk({
    isDiaspora: Boolean(body.outsideNigeria),
    priority: body.outsideNigeria ? "high" : "normal",
  });

  await persistRiskAssessment(admin, {
    entityType: "legal_verification_request",
    entityId: row.id,
    entityReference: reference,
    level: risk.level,
    score: risk.score,
    signals: risk.signals,
  });
  await syncRequestInternalRisk(admin, "legal_verification_requests", row.id, risk.level);

  await appendTrustTimeline(admin, {
    caseType: "legal_verification",
    caseId: row.id,
    caseReference: reference,
    eventType: "request_submitted",
    title: "Legal review request submitted",
    detail: `${propertyTitle} · ${reviewType}`,
    metadata: { riskLevel: risk.level },
  });

  const propertyId = body.propertyId ? String(body.propertyId).trim() : null;
  if (propertyId) {
    void recordListingHistoryEvent(admin, {
      listingId: propertyId,
      eventType: "legal_review_requested",
      newValue: { reference, reviewType },
      actorId: user?.id ?? null,
      actorRole: user ? "user" : "guest",
      source: "legal_verification_form",
      publicVisible: false,
    });
  }

  void sendLegalVerificationAlert(admin, {
    reference,
    buyerName: fullName,
    buyerEmail: email,
    propertyTitle,
    reviewType,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    reference,
    message: "Thank you. Yike will review your request and contact you on WhatsApp.",
  });
}
