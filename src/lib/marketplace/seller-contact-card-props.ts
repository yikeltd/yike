import type { Property } from "@/types/database";
import type { MarketplaceAssetType } from "@/lib/marketplace-messaging/service";
import { agentPublicPath } from "@/lib/agent-slugs";
import { isResponsiveAgent } from "@/lib/agent-response";
import { isVerifiedAgent } from "@/lib/utils";

export type SellerContactCardIdentity = {
  listingId: string;
  assetType: MarketplaceAssetType;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string | null;
  verified: boolean;
  roleLabel: string;
  trustScoreLabel: string | null;
  responseLabel: string | null;
  profileHref: string;
};

function trustScoreLabelFromAgent(agent: NonNullable<Property["agent"]>): string | null {
  const score = agent.performance_score;
  if (typeof score === "number" && Number.isFinite(score) && score > 0) {
    return `${Math.round(score)} / 100 Trust Score`;
  }
  return null;
}

function responseLabelFromAgent(agent: NonNullable<Property["agent"]>): string | null {
  const inquiries = agent.inquiry_count ?? 0;
  const avgMins = agent.avg_response_time_minutes;
  if (
    typeof avgMins === "number" &&
    Number.isFinite(avgMins) &&
    avgMins > 0 &&
    inquiries >= 2
  ) {
    if (avgMins < 60) {
      const rounded = Math.max(1, Math.ceil(avgMins));
      return `Replies in <${rounded} min`;
    }
    const hours = Math.ceil(avgMins / 60);
    return hours <= 24 ? `Replies in ~${hours} hr` : null;
  }
  if (isResponsiveAgent(agent)) {
    return "Usually responds quickly";
  }
  return null;
}

export function sellerContactCardFromListing(
  listing: Property,
  assetType: MarketplaceAssetType,
  options?: {
    verified?: boolean;
    roleLabel?: string;
  },
): SellerContactCardIdentity | null {
  const agent = listing.agent;
  const sellerId = agent?.id ?? listing.agent_id;
  if (!sellerId) return null;

  const sellerName =
    agent?.company_name ||
    agent?.full_name ||
    "Verified Nigerian Seller";
  const verified =
    options?.verified ??
    Boolean(
      listing.is_verified_listing ||
        (agent ? isVerifiedAgent(agent) || agent.verified_badge : false),
    );

  let roleLabel = options?.roleLabel ?? "Seller";
  if (!options?.roleLabel) {
    if (assetType === "PROPERTY") {
      roleLabel = agent?.company_name
        ? "Licensed Real Estate Agency"
        : "Property Representative";
    } else if (assetType === "VEHICLE") {
      roleLabel =
        agent?.account_type === "dealer" || agent?.company_name
          ? "Verified Auto Showroom"
          : "Verified Vehicle Owner";
    } else {
      roleLabel = "Electronics Seller";
    }
  }

  return {
    listingId: listing.id,
    assetType,
    sellerId,
    sellerName,
    sellerAvatar: agent?.avatar_url ?? null,
    verified,
    roleLabel,
    trustScoreLabel: agent ? trustScoreLabelFromAgent(agent) : null,
    responseLabel: agent ? responseLabelFromAgent(agent) : null,
    profileHref: agent ? agentPublicPath(agent) : `/agents/${sellerId}`,
  };
}
