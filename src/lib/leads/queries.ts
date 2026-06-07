import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadType } from "./types";

export type LeadWithListing = Lead & {
  listing?: {
    id?: string;
    title: string;
    city: string;
    area: string;
    slug?: string | null;
    availability_status?: string | null;
    price?: number;
    payment_period?: string;
    listing_type?: string;
    bedrooms?: number | null;
    property_type?: string | null;
  } | null;
  agent?: {
    id?: string;
    full_name: string | null;
    whatsapp?: string | null;
    phone?: string | null;
    availability_status?: string | null;
  } | null;
};

export async function getAgentLeadStats(
  admin: SupabaseClient,
  agentId: string
): Promise<{
  whatsapp: number;
  call: number;
  total: number;
  week: number;
  topListing: { id: string; title: string; count: number } | null;
}> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data: all } = await admin
    .from("leads")
    .select("id, lead_type, listing_id, clicked_at")
    .eq("agent_id", agentId);

  const rows = all ?? [];
  const whatsapp = rows.filter((r) => r.lead_type === "whatsapp").length;
  const call = rows.filter((r) => r.lead_type === "call").length;
  const week = rows.filter((r) => r.clicked_at >= weekAgo).length;

  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.listing_id, (counts.get(r.listing_id) ?? 0) + 1);
  }
  let topListing: { id: string; title: string; count: number } | null = null;
  for (const [id, count] of counts) {
    if (!topListing || count > topListing.count) {
      topListing = { id, title: "", count };
    }
  }

  if (topListing) {
    const { data: listing } = await admin
      .from("properties")
      .select("title")
      .eq("id", topListing.id)
      .maybeSingle();
    topListing.title = listing?.title ?? "Listing";
  }

  return { whatsapp, call, total: rows.length, week, topListing };
}

export async function getAgentLeads(
  admin: SupabaseClient,
  agentId: string,
  limit = 50
): Promise<LeadWithListing[]> {
  const { data } = await admin
    .from("leads")
    .select(
      `*, listing:properties!leads_listing_id_fkey (title, city, area)`
    )
    .eq("agent_id", agentId)
    .order("clicked_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as LeadWithListing[];
}

export async function getAdminLeads(
  admin: SupabaseClient,
  filters: {
    leadType?: LeadType;
    leadStatus?: string;
    city?: string;
    agentId?: string;
    listingId?: string;
    from?: string;
    limit?: number;
    offset?: number;
  }
): Promise<LeadWithListing[]> {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  let query = admin
    .from("leads")
    .select(
      `*, listing:properties!leads_listing_id_fkey (title, city, area, slug), agent:profiles!leads_agent_id_fkey (full_name)`
    )
    .order("clicked_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.leadType) query = query.eq("lead_type", filters.leadType);
  if (filters.leadStatus) query = query.eq("lead_status", filters.leadStatus);
  if (filters.agentId) query = query.eq("agent_id", filters.agentId);
  if (filters.listingId) query = query.eq("listing_id", filters.listingId);
  if (filters.from) query = query.gte("clicked_at", filters.from);

  const { data } = await query;
  let rows = (data ?? []) as LeadWithListing[];

  if (filters.city) {
    const city = filters.city.toLowerCase();
    rows = rows.filter((r) => r.listing?.city?.toLowerCase().includes(city));
  }

  return rows;
}

export async function getAgentRecentLeadsCount(
  admin: SupabaseClient,
  agentId: string,
  days = 7
): Promise<number> {
  const from = new Date(Date.now() - days * 86_400_000).toISOString();
  const { count } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agentId)
    .gte("clicked_at", from);
  return count ?? 0;
}
