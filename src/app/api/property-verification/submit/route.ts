import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueYvrReference } from "@/lib/verification/reference";
import { createStaffOpsAlert } from "@/lib/verification/ops-alerts";
import type { VerificationPriority } from "@/lib/verification/constants";
import { sendPropertyVerificationAlert } from "@/lib/email/service";
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";
import {
  assessPropertyVerificationRisk,
  persistRiskAssessment,
  syncRequestInternalRisk,
} from "@/lib/trust/operations/risk-scoring";

export const runtime = "nodejs";

function derivePriority(input: {
  urgency: string;
  alreadyPaid: boolean;
  outsideNigeria: boolean;
  concerns: Record<string, boolean>;
}): VerificationPriority {
  if (input.alreadyPaid || input.concerns.already_paid) return "urgent";
  if (input.urgency === "urgent") return "urgent";
  if (input.urgency === "high" || input.outsideNigeria || input.concerns.outside_nigeria) return "high";
  if (input.urgency === "low") return "low";
  return "normal";
}

function parsePropertyIdFromLink(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/properties\/([a-f0-9-]{36})/i);
  if (match) return match[1];
  return null;
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const propertyTitle = String(body.propertyTitle ?? "").trim();
  const propertyLocation = String(body.propertyLocation ?? "").trim();

  if (!fullName || !email || !whatsapp || !propertyTitle || !propertyLocation) {
    return NextResponse.json({ error: "Please complete required fields" }, { status: 400 });
  }

  if (!body.termsAccepted) {
    return NextResponse.json({ error: "Please accept verification assistance terms" }, { status: 400 });
  }

  const concernFlags = (body.concernFlags ?? {}) as Record<string, boolean>;
  const priority = derivePriority({
    urgency: String(body.urgency ?? "normal"),
    alreadyPaid: Boolean(body.alreadyPaid),
    outsideNigeria: Boolean(body.outsideNigeria),
    concerns: concernFlags,
  });

  const propertyLink = String(body.propertyLink ?? "").trim() || null;
  const propertyId = parsePropertyIdFromLink(propertyLink ?? "");
  let listingAgentId: string | null = null;

  if (propertyId) {
    const { data: listing } = await admin
      .from("properties")
      .select("id, agent_id, city, state, title")
      .eq("id", propertyId)
      .maybeSingle();
    if (listing) listingAgentId = listing.agent_id;
  }

  const reference = await generateUniqueYvrReference(admin);
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const { data: row, error } = await admin
    .from("property_verification_requests")
    .insert({
      request_reference: reference,
      source: "public_form",
      status: "submitted",
      requester_user_id: user?.id ?? null,
      property_id: propertyId,
      listing_agent_id: listingAgentId,
      buyer_full_name: fullName,
      buyer_email: email,
      buyer_whatsapp: whatsapp,
      buyer_city: String(body.buyerCity ?? "").trim() || null,
      buyer_country: String(body.buyerCountry ?? "Nigeria").trim() || "Nigeria",
      preferred_contact_method: String(body.preferredContact ?? "whatsapp"),
      property_link: propertyLink,
      property_title: propertyTitle,
      property_type: String(body.propertyType ?? "").trim() || null,
      property_purpose: String(body.propertyPurpose ?? "").trim() || null,
      property_location_text: propertyLocation,
      agent_company_name: String(body.agentCompanyName ?? "").trim() || null,
      asking_price: String(body.askingPrice ?? "").trim() || null,
      verification_needs: body.verificationNeeds ?? {},
      buyer_context: {
        outsideCity: Boolean(body.outsideCity),
        outsideNigeria: Boolean(body.outsideNigeria),
        alreadyPaid: Boolean(body.alreadyPaid),
        urgency: String(body.urgency ?? "normal"),
        additionalNotes: String(body.additionalNotes ?? "").trim() || null,
      },
      concern_flags: concernFlags,
      is_diaspora_request: Boolean(body.outsideNigeria) || Boolean(concernFlags.outside_nigeria),
      diaspora_priority: Boolean(body.outsideNigeria) || Boolean(concernFlags.outside_nigeria),
      priority,
      preferred_timeline: String(body.preferredTimeline ?? "").trim() || null,
      requester_notes: String(body.additionalNotes ?? "").trim() || null,
      terms_accepted: true,
      payment_status: "not_requested",
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }

  await createStaffOpsAlert(admin, {
    alertType: "property_verification_new",
    title: "New Property Verification Request",
    body: `${fullName} · ${propertyLocation} · ${reference}`,
    referenceType: "property_verification_request",
    referenceId: reference,
    priority,
  });

  const risk = assessPropertyVerificationRisk({
    concernFlags,
    buyerContext: {
      outside_nigeria: Boolean(body.outsideNigeria),
      already_paid: Boolean(body.alreadyPaid),
    },
    isDiaspora: Boolean(body.outsideNigeria),
    priority,
    alreadyPaid: Boolean(body.alreadyPaid),
  });

  await persistRiskAssessment(admin, {
    entityType: "property_verification_request",
    entityId: row.id,
    entityReference: reference,
    level: risk.level,
    score: risk.score,
    signals: risk.signals,
  });
  await syncRequestInternalRisk(admin, "property_verification_requests", row.id, risk.level);

  await appendTrustTimeline(admin, {
    caseType: "property_verification",
    caseId: row.id,
    caseReference: reference,
    eventType: "request_submitted",
    title: "Verification request submitted",
    detail: `${propertyTitle} · ${propertyLocation}`,
    metadata: { priority, riskLevel: risk.level },
  });

  void sendPropertyVerificationAlert(admin, {
    reference,
    buyerName: fullName,
    buyerEmail: email,
    propertyTitle,
    propertyLocation,
    priority,
  }).catch((err) => console.warn("[property-verification] alert failed", err));

  return NextResponse.json({
    ok: true,
    reference,
    message: "Thank you. Yike will review your request and contact you shortly on WhatsApp.",
  });
}
