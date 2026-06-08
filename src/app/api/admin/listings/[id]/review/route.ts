import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordListingHistoryEvent } from "@/lib/listing-history/record";
import {
  REVIEW_ACTION_LABELS,
  type ReviewDecisionType,
  type ReviewSuggestedAction,
} from "@/lib/review-memory";
import {
  persistListingReviewScores,
  recalculateListingReview,
} from "@/lib/review-memory/recalculate";
import { saveReviewDecision } from "@/lib/review-memory/memory";
import { applyReviewTrustImpact } from "@/lib/review-memory/trust-impact";
import type { Property, Profile, PropertyStatus } from "@/types/database";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

const SILENT_ACTIONS = [
  "approve_rank_lower",
  "approve_no_feature",
  "lower_visibility",
  "hold",
  "promote",
] as const;

type SilentAction = (typeof SILENT_ACTIONS)[number];

const VISIBILITY_MAP: Partial<Record<SilentAction, number>> = {
  approve_rank_lower: -12,
  approve_no_feature: -8,
  lower_visibility: -20,
  promote: 10,
};

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await admin
    .from("properties")
    .select(
      `*, outcome_score, outcome_evolution_delta, outcome_signals, outcome_updated_at,
       agent:profiles!properties_agent_id_fkey (
        id, full_name, verification_status, verified_badge, role, whatsapp, phone
      )`
    )
    .eq("id", id)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const property = data as Property & { agent: Profile | null };
  const result = await recalculateListingReview(admin, property);
  await persistListingReviewScores(admin, id, result);

  const { data: openRequests } = await admin
    .from("listing_review_requests")
    .select("id, request_type, message, status, created_at")
    .eq("listing_id", id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data: memories } = await admin
    .from("listing_review_memory")
    .select("decision_type, decision_reason, created_at")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(8);

  let agentOutcome: Record<string, unknown> | null = null;
  if (property.agent_id) {
    const { data } = await admin
      .from("agent_outcome_memory")
      .select("quality_score, review_strictness_modifier, outcome_summary")
      .eq("agent_id", property.agent_id)
      .maybeSingle();
    agentOutcome = data;
  }

  return NextResponse.json({
    judgment: result.judgment,
    suggestedAction: result.suggestedAction,
    suggestedActionLabel: REVIEW_ACTION_LABELS[result.suggestedAction],
    queueGroup: result.queueGroup,
    openRequests: openRequests ?? [],
    recentDecisions: memories ?? [],
    visibilityModifier: property.review_visibility_modifier ?? 0,
    holdStatus: property.review_hold_status ?? "none",
    outcome: {
      score: property.outcome_score ?? result.outcomeScore,
      evolutionDelta: property.outcome_evolution_delta ?? result.outcomeDelta,
      signals: property.outcome_signals ?? null,
      updatedAt: property.outcome_updated_at ?? null,
    },
    agentOutcome,
  });
}

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
    action: SilentAction | "approve" | "reject";
    note?: string;
    decisionType?: ReviewDecisionType;
    visibilityModifier?: number;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (
        id, full_name, verification_status, verified_badge, role
      )`
    )
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const property = existing as Property & { agent: Profile | null };
  const result = await recalculateListingReview(admin, property);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  let decisionType: ReviewDecisionType =
    body.decisionType ?? "approved";

  if (body.action === "approve") {
    patch.status = "approved" as PropertyStatus;
    patch.last_refreshed_at = now;
    patch.listing_activity_status = "active";
    patch.possible_duplicate = false;
    patch.duplicate_confidence_score = null;
    patch.review_hold_status = "none";
    decisionType = body.decisionType ?? "approved";
  } else if (body.action === "reject") {
    patch.status = "rejected" as PropertyStatus;
    decisionType = body.decisionType ?? "rejected";
  } else if (body.action === "hold") {
    patch.review_hold_status = "hold";
    decisionType = "held_for_review";
  } else if (body.action === "approve_rank_lower") {
    patch.status = "approved" as PropertyStatus;
    patch.review_visibility_modifier =
      body.visibilityModifier ?? VISIBILITY_MAP.approve_rank_lower;
    patch.last_refreshed_at = now;
    decisionType = "approved_rank_lower";
  } else if (body.action === "approve_no_feature") {
    patch.status = "approved" as PropertyStatus;
    patch.is_featured = false;
    patch.review_visibility_modifier =
      body.visibilityModifier ?? VISIBILITY_MAP.approve_no_feature;
    patch.last_refreshed_at = now;
    decisionType = "approved_no_feature";
  } else if (body.action === "lower_visibility") {
    patch.review_visibility_modifier =
      body.visibilityModifier ?? VISIBILITY_MAP.lower_visibility;
    decisionType = "lowered_visibility";
  } else if (body.action === "promote") {
    patch.review_visibility_modifier =
      body.visibilityModifier ?? VISIBILITY_MAP.promote;
    patch.boost_score = Math.min(100, (property.boost_score ?? 0) + 15);
    decisionType = "promoted";
  }

  if (body.note) patch.moderation_note = body.note.trim();

  const { data: updated, error } = await admin
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await saveReviewDecision(admin, {
    listing: property,
    judgment: result.judgment,
    decisionType,
    decisionReason: body.note,
    adminId: auth.user.id,
    extraSignals: { action: body.action },
  });

  if (property.agent_id) {
    await applyReviewTrustImpact(admin, {
      agentId: property.agent_id,
      listingId: id,
      decisionType,
      adminId: auth.user.id,
      reason: body.note,
    });
  }

  await persistListingReviewScores(admin, id, result);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "listing.review_action",
    target_type: "property",
    target_id: id,
    metadata: { action: body.action, decisionType, note: body.note ?? null },
    ip,
  });

  void recordListingHistoryEvent(admin, {
    listingId: id,
    eventType: "admin_reviewed",
    oldValue: { status: property.status },
    newValue: { action: body.action, decisionType },
    actorId: auth.user.id,
    actorRole: auth.profile.role,
    source: "review_memory",
    publicVisible: false,
    internalNote: body.note?.trim() || null,
  });

  return NextResponse.json({ listing: updated, decisionType });
}
