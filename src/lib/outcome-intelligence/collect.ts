import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "@/types/database";
import { computeListingOutcome, type ListingOutcomeInput } from "./compute";

const MISLEADING_REASON_PATTERNS = [
  /mislead/i,
  /fake/i,
  /not available/i,
  /wrong price/i,
  /bait/i,
  /scam/i,
  /ghost/i,
];

export async function gatherListingOutcomeInput(
  client: SupabaseClient,
  property: Property
): Promise<ListingOutcomeInput> {
  const published = property.published_at ?? property.created_at;
  const daysLive = Math.max(
    0,
    Math.floor((Date.now() - new Date(published).getTime()) / 86_400_000)
  );

  const [
    { count: saveCount },
    { data: reports },
    { count: postApprovalEdits },
    { data: agentMetrics },
    { data: adminMemories },
  ] = await Promise.all([
    client
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property.id),
    client
      .from("listing_reports")
      .select("reason, status")
      .eq("property_id", property.id),
    client
      .from("listing_history_events")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", property.id)
      .in("event_type", ["price_changed", "status_changed"])
      .gte(
        "created_at",
        property.published_at ?? property.created_at
      ),
    property.agent_id
      ? client
          .from("agent_trust_metrics")
          .select("response_rate")
          .eq("profile_id", property.agent_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client
      .from("listing_review_memory")
      .select("decision_type")
      .eq("listing_id", property.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const openReports =
    reports?.filter((r) => r.status === "open" || r.status === "pending")
      .length ?? 0;
  const misleadingReports =
    reports?.filter((r) =>
      MISLEADING_REASON_PATTERNS.some((p) => p.test(r.reason ?? ""))
    ).length ?? 0;

  const adminPositiveOverride = (adminMemories ?? []).some((m) =>
    ["approved", "approved_after_explanation", "approved_negotiable_landlord_terms", "promoted"].includes(
      m.decision_type
    )
  );
  const adminNegativeOverride = (adminMemories ?? []).some((m) =>
    m.decision_type.startsWith("rejected")
  );

  const wasRapidlyHidden =
    property.status === "hidden" &&
    daysLive < 7 &&
    !!property.published_at;

  return {
    views: property.views_count ?? 0,
    contactClicks: property.contact_clicks ?? 0,
    inquiryScore: property.inquiry_score ?? 0,
    engagementScore: property.engagement_score ?? 0,
    saveCount: saveCount ?? 0,
    openReports,
    misleadingReports,
    inspectionRequests: property.inspection_requested_count ?? 0,
    priceChangeCount: property.price_change_count ?? 0,
    reactivationCount: property.reactivation_count ?? 0,
    daysLive,
    postApprovalEditCount: postApprovalEdits ?? 0,
    wasRapidlyHidden,
    possibleDuplicate: !!property.possible_duplicate,
    priceAnomalyLevel: property.price_anomaly_level ?? null,
    agentResponseRate: Number(agentMetrics?.response_rate ?? 0.5),
    adminPositiveOverride,
    adminNegativeOverride,
  };
}

export async function computeAndPersistListingOutcome(
  client: SupabaseClient,
  property: Property
): Promise<ReturnType<typeof computeListingOutcome>> {
  const input = await gatherListingOutcomeInput(client, property);
  const outcome = computeListingOutcome(input);
  const now = new Date().toISOString();

  await client
    .from("properties")
    .update({
      outcome_score: outcome.outcomeScore,
      outcome_evolution_delta: outcome.evolutionDelta,
      outcome_signals: {
        positive: outcome.positive,
        negative: outcome.negative,
        signals: outcome.signals,
        days_live: input.daysLive,
      },
      outcome_updated_at: now,
    })
    .eq("id", property.id);

  const events = Object.entries(outcome.signals).map(([signal_type, weight]) => ({
    entity_type: "listing",
    entity_id: property.id,
    signal_type,
    signal_weight: Number(weight),
    metadata: { outcome_score: outcome.outcomeScore },
  }));

  if (events.length > 0) {
    await client.from("outcome_learning_events").insert(events.slice(0, 12));
  }

  return outcome;
}
