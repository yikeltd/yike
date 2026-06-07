import { isDirectAgentCallsEnabled } from "@/lib/feature-flags";
import { formatPhoneForTel } from "@/lib/utils";
import {
  isAgentReachable,
  isListingDiscoverable,
} from "@/lib/leads/availability";
import type {
  AgentCallProfile,
  CallInquiryType,
  CallRouteType,
  CallRoutingDecision,
  CallRoutingMode,
} from "./call-routing-types";
import type { ListingRoutingContext } from "./routing-types";
import type {
  AgentAvailabilityStatus,
  AgentProfileStatus,
  ListingAvailabilityStatus,
  PropertyStatus,
} from "@/types/database";

export type DecideCallRoutingInput = {
  agent: AgentCallProfile;
  listing: ListingRoutingContext;
  globalEnabled?: boolean;
  isDuplicate?: boolean;
};

function resolveAgentPhone(agent: AgentCallProfile): string | null {
  const phone = agent.phone?.trim();
  if (phone) return phone;
  const wa = agent.whatsapp?.trim();
  return wa || null;
}

function modePermitsDirectCall(mode: CallRoutingMode): boolean {
  return mode === "direct_calls" || mode === "hybrid";
}

export function decideCallRouting(
  input: DecideCallRoutingInput
): CallRoutingDecision {
  const globalEnabled = input.globalEnabled ?? isDirectAgentCallsEnabled();
  const agent = input.agent;
  const listing = input.listing;
  const phone = resolveAgentPhone(agent);
  const routingMode = (agent.call_routing_mode ?? "whatsapp_only") as CallRoutingMode;

  const base = {
    phone_number: null as string | null,
    call_routing_mode_snapshot: routingMode,
  };

  if (input.isDuplicate) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "duplicate_lead",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (listing.requires_manual_review) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "manual_review_required",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (!globalEnabled) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "global_direct_calls_disabled",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (!agent.allow_direct_calls) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "direct_calls_not_authorized",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (!modePermitsDirectCall(routingMode)) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "call_routing_mode_whatsapp_only",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (agent.direct_routing_health_status === "disabled") {
    return {
      ...base,
      allow_direct_call: false,
      reason: "direct_routing_disabled",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (
    !isAgentReachable({
      is_banned: agent.is_banned ?? false,
      profile_status:
        (agent.profile_status as AgentProfileStatus | undefined) ?? undefined,
      availability_status:
        (agent.availability_status as AgentAvailabilityStatus | undefined) ??
        undefined,
    })
  ) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "agent_unavailable",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (
    agent.profile_status === "suspended" ||
    agent.is_banned
  ) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "agent_suspended",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (
    !isListingDiscoverable({
      status: (listing.status as PropertyStatus | undefined) ?? "approved",
      availability_status:
        (listing.availability_status as ListingAvailabilityStatus | undefined) ??
        "available",
    })
  ) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "listing_unavailable",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  if (!phone) {
    return {
      ...base,
      allow_direct_call: false,
      reason: "no_valid_phone",
      route_type: "whatsapp_fallback",
      inquiry_type: "concierge_call",
    };
  }

  return {
    allow_direct_call: true,
    reason: "direct_call_eligible",
    phone_number: phone,
    route_type: "direct_call",
    inquiry_type: "direct_call" as CallInquiryType,
    call_routing_mode_snapshot: routingMode,
  };
}

export function buildTelUrl(phone: string): string {
  return `tel:${formatPhoneForTel(phone)}`;
}
