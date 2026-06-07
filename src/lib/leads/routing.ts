import { SITE_URL } from "@/lib/constants";
import {
  isDirectAgentWhatsAppEnabled,
  isLeadGatewayEnabled,
} from "@/lib/feature-flags";
import { handoffPath } from "@/lib/leads/gateway";
import {
  isAgentReachable,
  isListingDiscoverable,
  listingAvailability,
} from "@/lib/leads/availability";
import { isLeadBillable, resolveLeadPrice } from "@/lib/leads/pricing";
import type {
  AgentAvailabilityStatus,
  AgentProfileStatus,
  ListingAvailabilityStatus,
  PropertyStatus,
} from "@/types/database";
import type {
  AgentRoutingProfile,
  LeadChargeStatus,
  LeadRoutingDecision,
  ListingRoutingContext,
  VisitorContext,
} from "./routing-types";

export type RoutingInput = {
  agent: AgentRoutingProfile;
  listing: ListingRoutingContext;
  visitor: VisitorContext;
  yikeReference: string;
  sourceSurface?: string;
  isDuplicate?: boolean;
  walletBalance?: number | null;
};

function hasValidWhatsApp(agent: AgentRoutingProfile): boolean {
  const wa = agent.whatsapp || agent.phone;
  return !!wa?.trim();
}

function agentDirectEligible(agent: AgentRoutingProfile): string | null {
  if (!agent.allow_direct_whatsapp) return "direct_whatsapp_not_authorized";
  if (agent.direct_routing_health_status === "disabled") {
    return "direct_routing_disabled";
  }
  if (!hasValidWhatsApp(agent)) return "invalid_whatsapp";
  if (
    !isAgentReachable({
      is_banned: agent.is_banned ?? false,
      profile_status: (agent.profile_status as AgentProfileStatus | undefined) ?? undefined,
      availability_status:
        (agent.availability_status as AgentAvailabilityStatus | undefined) ?? undefined,
    })
  ) {
    return "agent_unavailable";
  }
  if (
    agent.routing_mode !== "direct_whatsapp" &&
    agent.routing_mode !== "hybrid"
  ) {
    return "routing_mode_concierge";
  }
  return null;
}

/** Core routing decision — never exposes billing to public consumers. */
export function decideLeadRouting(input: RoutingInput): LeadRoutingDecision {
  const { agent, listing, yikeReference, isDuplicate, walletBalance } = input;
  const chargeAmount = resolveLeadPrice(agent, listing);
  const billable = isLeadBillable(agent, listing, chargeAmount);
  const handoffUrl = handoffPath(yikeReference);
  const listingUrl = listing.slug
    ? `${SITE_URL}/properties/${listing.slug}`
    : `${SITE_URL}/search`;

  const base = {
    charge_amount: chargeAmount,
    handoff_url: handoffUrl,
    routing_mode_used: agent.routing_mode,
    listing_url: listingUrl,
  };

  if (isDuplicate) {
    return {
      ...base,
      route_to: "yike_support",
      reason: "duplicate_lead",
      charge_required: false,
      charge_status: "duplicate_no_charge",
    };
  }

  if (listing.requires_manual_review) {
    return {
      ...base,
      route_to: "yike_support",
      reason: "manual_review_required",
      charge_required: false,
      charge_status: billable ? "pending" : "not_chargeable",
    };
  }

  const listingForAvail = {
    availability_status:
      (listing.availability_status as ListingAvailabilityStatus | null | undefined) ??
      undefined,
    status: ((listing.status ?? "approved") as PropertyStatus),
  };
  if (!isListingDiscoverable(listingForAvail)) {
    const avail = listingAvailability(listingForAvail);
    if (avail !== "available") {
      return {
        ...base,
        route_to: "yike_support",
        reason: `listing_${avail}`,
        charge_required: false,
        charge_status: "not_chargeable",
      };
    }
  }

  // Global launch gate — Yike-first until owner enables direct routing
  if (!isDirectAgentWhatsAppEnabled()) {
    return {
      ...base,
      route_to: "yike_support",
      reason: "direct_routing_globally_disabled",
      charge_required: false,
      charge_status: resolveChargeStatus(billable, false, walletBalance, chargeAmount),
    };
  }

  const blockReason = agentDirectEligible(agent);
  if (blockReason) {
    return {
      ...base,
      route_to: "yike_support",
      reason: blockReason,
      charge_required: false,
      charge_status: resolveChargeStatus(billable, false, walletBalance, chargeAmount),
    };
  }

  if (billable) {
    const balance = walletBalance ?? 0;
    if (balance < chargeAmount) {
      return {
        ...base,
        route_to: "yike_support",
        reason: "insufficient_balance",
        charge_required: true,
        charge_status: "insufficient_balance",
      };
    }
  }

  // Hybrid: only direct when fully eligible (already checked)
  return {
    ...base,
    route_to: "direct_agent",
    reason: agent.routing_mode === "hybrid" ? "hybrid_eligible" : "direct_authorized",
    charge_required: billable,
    charge_status: billable ? "pending" : "not_chargeable",
  };
}

function resolveChargeStatus(
  billable: boolean,
  willCharge: boolean,
  balance: number | null | undefined,
  amount: number
): LeadChargeStatus {
  if (!billable) return "not_chargeable";
  if (willCharge) return "charged";
  if ((balance ?? 0) < amount) return "insufficient_balance";
  return "pending";
}

/** Launch: never bypass Yike-first routing for WhatsApp leads. */
export function shouldUseLegacyDirectBypass(): boolean {
  return false;
}
