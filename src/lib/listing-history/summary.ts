import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Property } from "@/types/database";
import { isRecentlyUpdated } from "@/lib/trust/quality";
import {
  getAgentMicroLabel,
  isResponsiveAgent,
} from "@/lib/agent-response";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";

export type ListingInsightSignal = {
  key: string;
  label: string;
  priority: number;
};

export type ListingInsightSummary = {
  listedAt: string;
  listedAgeLabel: string | null;
  priceChangeCount: number;
  reactivationCount: number;
  hadUnavailableState: boolean;
  lastVerifiedAt: string | null;
  physicalReviewCompleted: boolean;
  legalReviewCompleted: boolean;
  neighborhoodTrend: string | null;
  agentSignals: string[];
  publicSignals: ListingInsightSignal[];
};

const MIN_AREA_DEMAND_SCORE = 28;
const MIN_AREA_ACTIVITY = 12;

function formatListedAge(publishedAt: string, createdAt: string): string | null {
  const ref = publishedAt || createdAt;
  const ms = Date.now() - new Date(ref).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 7) return `Listed ${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "Listed 1 week ago" : `Listed ${weeks} weeks ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? "Listed 1 month ago" : `Listed ${months} months ago`;
  }
  const years = Math.floor(months / 12);
  return years === 1 ? "Listed 1 year ago" : `Listed ${years} years ago`;
}

function buildAgentSignals(agent: Profile | null | undefined): string[] {
  if (!agent) return [];
  const out: string[] = [];
  if (agent.company_verified) {
    out.push("Company verified");
  }
  if (agent.created_at) {
    const year = new Date(agent.created_at).getFullYear();
    if (year >= 2024) {
      out.push(`Agent joined Yike in ${year}`);
    }
  }
  const micro = getAgentMicroLabel(agent);
  if (micro) out.push(micro);
  else if (isResponsiveAgent(agent)) out.push("Usually responds quickly");
  else if (isVerifiedAgentProfile(agent)) out.push("Verified agent");
  return out.slice(0, 2);
}

async function getNeighborhoodTrendLabel(
  admin: SupabaseClient,
  property: Pick<Property, "state" | "city" | "area" | "listing_type" | "property_type">
): Promise<string | null> {
  const keys = [
    `${property.state}|${property.city}|${property.area}|${property.property_type ?? ""}`,
    `${property.state}|${property.city}|${property.area}|`,
    `${property.state}|${property.city}|${property.city}|`,
  ];

  for (const demand_key of keys) {
    const { data } = await admin
      .from("area_demand_memory")
      .select("demand_score, search_count, save_count, whatsapp_click_count, inquiry_count")
      .eq("demand_key", demand_key)
      .maybeSingle();

    if (!data) continue;
    const score = Number(data.demand_score ?? 0);
    const activity =
      Number(data.search_count ?? 0) +
      Number(data.save_count ?? 0) +
      Number(data.whatsapp_click_count ?? 0) +
      Number(data.inquiry_count ?? 0);

    if (score < MIN_AREA_DEMAND_SCORE || activity < MIN_AREA_ACTIVITY) continue;

    if (property.listing_type === "rent") {
      return "Popular area for rentals";
    }
    if (property.property_type === "shop" || property.property_type === "office") {
      return "Shops getting more attention in this area";
    }
    if (score >= 55) return "High demand area";
    return "Recently active neighborhood";
  }
  return null;
}

async function hasPublicEvent(
  admin: SupabaseClient,
  listingId: string,
  eventType: string
): Promise<boolean> {
  const { count } = await admin
    .from("listing_history_events")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("event_type", eventType)
    .eq("public_visible", true);
  return (count ?? 0) > 0;
}

export async function getListingInsightSummary(
  admin: SupabaseClient,
  property: Property,
  agent?: Profile | null
): Promise<ListingInsightSummary> {
  const listedAt = property.published_at ?? property.created_at;
  const listedAgeLabel = formatListedAge(
    property.published_at ?? "",
    property.created_at
  );

  const priceChangeCount = property.price_change_count ?? 0;
  const reactivationCount = property.reactivation_count ?? 0;
  const hadUnavailableState = property.had_unavailable_state ?? false;

  const physicalReviewCompleted =
    !!property.yike_verified ||
    !!(property.last_verified_at ?? property.yike_verified_at);

  const [legalReviewCompleted, neighborhoodTrend] = await Promise.all([
    hasPublicEvent(admin, property.id, "legal_review_completed"),
    getNeighborhoodTrendLabel(admin, property),
  ]);

  const agentSignals = buildAgentSignals(agent);
  const publicSignals: ListingInsightSignal[] = [];

  if (physicalReviewCompleted) {
    publicSignals.push({
      key: "physical_review",
      label: "Physical review completed",
      priority: 90,
    });
  }

  if (legalReviewCompleted) {
    publicSignals.push({
      key: "legal_review",
      label: "Legal review assistance completed",
      priority: 85,
    });
  }

  if (listedAgeLabel) {
    publicSignals.push({
      key: "listed_age",
      label: listedAgeLabel,
      priority: 70,
    });
  }

  if (priceChangeCount > 0) {
    publicSignals.push({
      key: "price_changes",
      label:
        priceChangeCount === 1
          ? "Price changed once"
          : `Price changed ${priceChangeCount} times`,
      priority: 60,
    });
  }

  if (reactivationCount > 0) {
    publicSignals.push({
      key: "reactivated",
      label:
        reactivationCount === 1
          ? "Reactivated recently"
          : "Availability recently confirmed",
      priority: 55,
    });
  } else if (
    hadUnavailableState &&
    isRecentlyUpdated({
      updated_at: property.updated_at,
      last_refreshed_at: property.last_refreshed_at,
    })
  ) {
    publicSignals.push({
      key: "availability_confirmed",
      label: "Availability recently confirmed",
      priority: 50,
    });
  }

  for (const label of agentSignals) {
    publicSignals.push({
      key: `agent_${label}`,
      label,
      priority: 45,
    });
  }

  if (neighborhoodTrend) {
    publicSignals.push({
      key: "neighborhood",
      label: neighborhoodTrend,
      priority: 40,
    });
  }

  publicSignals.sort((a, b) => b.priority - a.priority);

  return {
    listedAt,
    listedAgeLabel,
    priceChangeCount,
    reactivationCount,
    hadUnavailableState,
    lastVerifiedAt: property.last_verified_at ?? property.yike_verified_at ?? null,
    physicalReviewCompleted,
    legalReviewCompleted,
    neighborhoodTrend,
    agentSignals,
    publicSignals: publicSignals.slice(0, 5),
  };
}
