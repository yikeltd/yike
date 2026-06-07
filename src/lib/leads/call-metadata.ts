import { createAdminClient } from "@/lib/supabase/admin";
import type { CallRoutingDecision } from "./call-routing-types";
import type { AgentValidation } from "./validation";

export function agentToCallProfile(agent: AgentValidation) {
  return {
    id: agent.id,
    allow_direct_calls: agent.allow_direct_calls ?? false,
    call_routing_mode: (agent.call_routing_mode ?? "whatsapp_only") as
      | "whatsapp_only"
      | "direct_calls"
      | "hybrid",
    phone: agent.phone,
    whatsapp: agent.whatsapp,
    profile_status: agent.profile_status,
    is_banned: agent.is_banned,
    availability_status: agent.availability_status,
    direct_routing_health_status: agent.direct_routing_health_status,
    default_call_lead_price: agent.default_call_lead_price ?? null,
  };
}

export async function persistCallLeadMetadata(
  leadId: string,
  decision: CallRoutingDecision
): Promise<void> {
  const admin = createAdminClient();
  if (!admin || !leadId) return;

  await admin
    .from("leads")
    .update({
      inquiry_type: decision.inquiry_type,
      call_allowed: decision.allow_direct_call,
      call_route_reason: decision.reason,
      call_routing_mode_snapshot: decision.call_routing_mode_snapshot,
      call_charge_status: "not_chargeable",
      charged_for_call: false,
    })
    .eq("id", leadId);
}
