import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  REVIEW_REQUEST_TEMPLATES,
  type ReviewDecisionType,
  type ReviewRequestType,
} from "@/lib/review-memory";
import { saveReviewDecision } from "@/lib/review-memory/memory";
import { notifyAgentReviewRequest } from "@/lib/review-memory/notify";
import type { Property } from "@/types/database";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

const REQUEST_TYPES: ReviewRequestType[] = [
  "update",
  "explain",
  "upload_proof",
  "clearer_photos",
  "fee_clarity",
  "location_correction",
  "title_document",
];

const DECISION_MAP: Record<ReviewRequestType, ReviewDecisionType> = {
  update: "requested_update",
  explain: "requested_explanation",
  upload_proof: "requested_documents",
  clearer_photos: "requested_photos",
  fee_clarity: "requested_fee_clarity",
  location_correction: "requested_update",
  title_document: "requested_documents",
};

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
    requestType: ReviewRequestType;
    message?: string;
  };

  if (!REQUEST_TYPES.includes(body.requestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: listing } = await admin
    .from("properties")
    .select("id, title, agent_id, status")
    .eq("id", id)
    .single();

  if (!listing?.agent_id) {
    return NextResponse.json({ error: "Listing or agent not found" }, { status: 404 });
  }

  const message =
    body.message?.trim() || REVIEW_REQUEST_TEMPLATES[body.requestType];
  const now = new Date().toISOString();

  const { data: request, error } = await admin
    .from("listing_review_requests")
    .insert({
      listing_id: id,
      agent_id: listing.agent_id,
      request_type: body.requestType,
      message,
      status: "open",
      requested_by: auth.user.id,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !request) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  await admin
    .from("properties")
    .update({
      review_hold_status: "update_requested",
      updated_at: now,
    })
    .eq("id", id);

  await saveReviewDecision(admin, {
    listing: listing as Property,
    decisionType: DECISION_MAP[body.requestType],
    decisionReason: message,
    adminId: auth.user.id,
    extraSignals: { request_type: body.requestType, request_id: request.id },
  });

  await notifyAgentReviewRequest(admin, {
    agentId: listing.agent_id,
    listingId: id,
    listingTitle: listing.title,
    requestType: body.requestType,
    message,
    requestId: request.id,
  });

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.review_request",
    target_type: "property",
    target_id: id,
    metadata: { request_type: body.requestType, request_id: request.id },
    ip,
  });

  return NextResponse.json({ request });
}
