import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LeadValidationResult =
  | { ok: true; listing: ListingValidation; agent: AgentValidation }
  | { ok: false; code: string; publicMessage?: string; useFallback?: boolean };

export type ListingValidation = {
  id: string;
  slug: string | null;
  title: string;
  status: string;
  availability_status: string;
  agent_id: string;
  expires_at: string;
  lead_price_override: number | null;
  premium_lead: boolean;
  requires_manual_review: boolean;
  public_listing_code?: string | null;
};

export type AgentValidation = {
  id: string;
  profile_status: string | null;
  is_banned: boolean;
  availability_status: string;
  whatsapp: string | null;
  phone: string | null;
  routing_mode: string;
  allow_direct_whatsapp: boolean;
  billing_mode: string;
  default_lead_price: number | null;
  premium_lead_price: number | null;
  lead_billing_enabled: boolean;
  direct_routing_health_status: string;
  complaint_count: number;
  public_agent_code?: string | null;
  full_name?: string | null;
  allow_direct_calls?: boolean;
  call_routing_mode?: string;
  default_call_lead_price?: number | null;
};

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

const BLOCKED_LISTING_STATUS = new Set([
  "hidden",
  "archived",
  "rejected",
  "pending",
]);

const BLOCKED_AVAILABILITY = new Set(["hidden", "unavailable"]);

export async function validateLeadRequest(
  supabase: SupabaseClient,
  listingId: string,
  agentId: string
): Promise<LeadValidationResult> {
  if (!listingId.trim() || !agentId.trim()) {
    return { ok: false, code: "missing_ids" };
  }

  if (!isValidUuid(listingId) || !isValidUuid(agentId)) {
    return { ok: false, code: "invalid_ids" };
  }

  const [{ data: listing }, { data: agent }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        `id, slug, title, status, availability_status, agent_id, expires_at,
         lead_price_override, premium_lead, requires_manual_review, public_listing_code`
      )
      .eq("id", listingId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        `id, profile_status, is_banned, availability_status, whatsapp, phone,
         routing_mode, allow_direct_whatsapp, billing_mode, default_lead_price,
         premium_lead_price, lead_billing_enabled, direct_routing_health_status,
         complaint_count, public_agent_code, full_name, public_slug, company_name,
         allow_direct_calls, call_routing_mode, default_call_lead_price`
      )
      .eq("id", agentId)
      .maybeSingle(),
  ]);

  if (!listing) {
    return { ok: false, code: "listing_not_found", useFallback: true };
  }

  if (!agent) {
    return { ok: false, code: "agent_not_found", useFallback: true };
  }

  if (listing.agent_id !== agentId) {
    return { ok: false, code: "agent_listing_mismatch" };
  }

  if (BLOCKED_LISTING_STATUS.has(listing.status)) {
    return {
      ok: false,
      code: "listing_unavailable",
      useFallback: true,
      publicMessage: undefined,
    };
  }

  if (new Date(listing.expires_at) <= new Date()) {
    return { ok: false, code: "listing_expired", useFallback: true };
  }

  if (BLOCKED_AVAILABILITY.has(listing.availability_status)) {
    return { ok: false, code: "listing_not_available", useFallback: true };
  }

  if (agent.is_banned || agent.profile_status === "deleted") {
    return { ok: false, code: "agent_blocked", useFallback: true };
  }

  if (
    agent.profile_status === "suspended" ||
    agent.profile_status === "on_hold" ||
    agent.profile_status === "pending_verification"
  ) {
    return { ok: false, code: "agent_suspended", useFallback: true };
  }

  return {
    ok: true,
    listing: listing as ListingValidation,
    agent: agent as AgentValidation,
  };
}
