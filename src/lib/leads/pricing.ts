import {
  isAgentLeadBillingEnabled,
  systemDefaultLeadPrice,
} from "@/lib/feature-flags";
import type { AgentRoutingProfile, ListingRoutingContext } from "./routing-types";

export function resolveLeadPrice(
  agent: AgentRoutingProfile,
  listing: ListingRoutingContext
): number {
  if (listing.lead_price_override != null && listing.lead_price_override > 0) {
    return Number(listing.lead_price_override);
  }
  if (listing.premium_lead && agent.premium_lead_price != null) {
    return Number(agent.premium_lead_price);
  }
  if (agent.default_lead_price != null && agent.default_lead_price > 0) {
    return Number(agent.default_lead_price);
  }
  const system = systemDefaultLeadPrice();
  if (system > 0) return system;
  return 0;
}

export function isLeadBillable(
  agent: AgentRoutingProfile,
  listing: ListingRoutingContext,
  chargeAmount: number
): boolean {
  if (!isAgentLeadBillingEnabled()) return false;
  if (!agent.lead_billing_enabled) return false;
  if (agent.billing_mode === "waived" || agent.billing_mode === "free") {
    return false;
  }
  if (agent.billing_mode !== "pay_per_lead") return false;
  return chargeAmount > 0;
}
