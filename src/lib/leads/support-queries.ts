import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadQualityLabel } from "./operations-types";
import type { LeadWithListing } from "./queries";

export type SupportLeadFilters = {
  archived?: "active" | "archived" | "all";
  quality?: LeadQualityLabel | "spam" | "unresolved";
  leadType?: "whatsapp" | "call";
  agentId?: string;
  assignedTo?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export type ConciergeLeadFields = {
  lead_code?: string | null;
  public_listing_code?: string | null;
  public_agent_code?: string | null;
  listing_slug?: string | null;
  listing_url?: string | null;
  listing_title?: string | null;
  agent_name?: string | null;
  agent_whatsapp?: string | null;
  channel?: string | null;
  concierge_status?: string | null;
  handoff_url?: string | null;
  handoff_message?: string | null;
  source_surface?: string | null;
};

export type SupportLeadDetail = LeadWithListing &
  ConciergeLeadFields & {
  events?: {
    id: string;
    type: string;
    actor_id: string | null;
    actor_role: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
};

export async function getSupportLeads(
  admin: SupabaseClient,
  filters: SupportLeadFilters = {}
): Promise<{ rows: SupportLeadDetail[]; total: number }> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  let countQuery = admin.from("leads").select("id", { count: "exact", head: true });
  let dataQuery = admin
    .from("leads")
    .select(
      `*, listing:properties!leads_listing_id_fkey (
         id, title, city, area, slug, availability_status,
         price, payment_period, listing_type, bedrooms, property_type
       ),
       agent:profiles!leads_agent_id_fkey (id, full_name, whatsapp, phone, availability_status)`
    )
    .order("clicked_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.archived === "active") {
    countQuery = countQuery.is("archived_at", null);
    dataQuery = dataQuery.is("archived_at", null);
  } else if (filters.archived === "archived") {
    countQuery = countQuery.not("archived_at", "is", null);
    dataQuery = dataQuery.not("archived_at", "is", null);
  }

  if (filters.quality === "spam") {
    countQuery = countQuery.eq("lead_quality_label", "spam");
    dataQuery = dataQuery.eq("lead_quality_label", "spam");
  } else if (filters.quality === "unresolved") {
    countQuery = countQuery.is("archived_at", null).neq("status", "converted");
    dataQuery = dataQuery.is("archived_at", null).neq("status", "converted");
  } else if (filters.quality) {
    countQuery = countQuery.eq("lead_quality_label", filters.quality);
    dataQuery = dataQuery.eq("lead_quality_label", filters.quality);
  }

  if (filters.leadType) {
    countQuery = countQuery.eq("lead_type", filters.leadType);
    dataQuery = dataQuery.eq("lead_type", filters.leadType);
  }
  if (filters.agentId) {
    countQuery = countQuery.eq("agent_id", filters.agentId);
    dataQuery = dataQuery.eq("agent_id", filters.agentId);
  }
  if (filters.assignedTo) {
    countQuery = countQuery.eq("assigned_support_id", filters.assignedTo);
    dataQuery = dataQuery.eq("assigned_support_id", filters.assignedTo);
  }

  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q.replace(/[%_]/g, "")}%`;
    const orFilter = [
      `lead_code.ilike.${pattern}`,
      `public_listing_code.ilike.${pattern}`,
      `public_agent_code.ilike.${pattern}`,
      `yike_reference.ilike.${pattern}`,
      `listing_title.ilike.${pattern}`,
      `listing_slug.ilike.${pattern}`,
    ].join(",");
    countQuery = countQuery.or(orFilter);
    dataQuery = dataQuery.or(orFilter);
  }

  const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);

  return {
    rows: (data ?? []) as SupportLeadDetail[],
    total: count ?? 0,
  };
}

export async function getSupportLeadDetail(
  admin: SupabaseClient,
  leadId: string
): Promise<SupportLeadDetail | null> {
  const { data } = await admin
    .from("leads")
    .select(
      `*, listing:properties!leads_listing_id_fkey (
         id, title, city, area, slug, availability_status, public_listing_code,
         price, payment_period, listing_type, bedrooms, property_type
       ),
       agent:profiles!leads_agent_id_fkey (
         id, full_name, whatsapp, phone, availability_status, public_agent_code
       )`
    )
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;

  const { data: events } = await admin
    .from("lead_events")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  return { ...(data as SupportLeadDetail), events: events ?? [] };
}

export async function getSupportQuickReplies(admin: SupabaseClient, q?: string) {
  let query = admin
    .from("support_quick_replies")
    .select("*")
    .eq("active", true)
    .order("title", { ascending: true });

  if (q?.trim()) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data } = await query;
  return data ?? [];
}
