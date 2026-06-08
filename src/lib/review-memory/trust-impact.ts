import type { SupabaseClient } from "@supabase/supabase-js";
import { recordTrustScoreEvent } from "@/lib/trust/score-engine/events";
import type { ReviewDecisionType } from "./constants";

const POSITIVE_DECISIONS: ReviewDecisionType[] = [
  "approved",
  "approved_after_explanation",
  "approved_negotiable_landlord_terms",
  "promoted",
];

const NEGATIVE_DECISIONS: ReviewDecisionType[] = [
  "rejected",
  "rejected_fake_location",
  "rejected_duplicate_photos",
  "rejected_bait_pricing",
];

export async function applyReviewTrustImpact(
  client: SupabaseClient,
  input: {
    agentId: string;
    listingId: string;
    decisionType: ReviewDecisionType;
    adminId?: string | null;
    reason?: string;
  }
): Promise<void> {
  if (POSITIVE_DECISIONS.includes(input.decisionType)) {
    await recordTrustScoreEvent(client, {
      entityType: "agent",
      entityId: input.agentId,
      eventType: "listing_verified",
      reason: input.reason ?? `Review: ${input.decisionType}`,
      metadata: { listing_id: input.listingId, decision: input.decisionType },
      actorId: input.adminId,
    });
    return;
  }

  if (NEGATIVE_DECISIONS.includes(input.decisionType)) {
    const isFraud =
      input.decisionType === "rejected_fake_location" ||
      input.decisionType === "rejected_duplicate_photos" ||
      input.decisionType === "rejected_bait_pricing";

    await recordTrustScoreEvent(client, {
      entityType: "agent",
      entityId: input.agentId,
      eventType: isFraud ? "fraud_flag" : "admin_warning",
      reason: input.reason ?? `Review: ${input.decisionType}`,
      metadata: { listing_id: input.listingId, decision: input.decisionType },
      actorId: input.adminId,
    });
  }

  if (input.decisionType === "lowered_visibility") {
    await recordTrustScoreEvent(client, {
      entityType: "agent",
      entityId: input.agentId,
      eventType: "admin_warning",
      reason: input.reason ?? "Listing visibility lowered after review",
      scoreDelta: -1,
      riskDelta: 2,
      metadata: { listing_id: input.listingId },
      actorId: input.adminId,
    });
  }
}
