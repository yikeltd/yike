import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/utils";
import type { AdminEntitySearchResult, ListingSearchFilters } from "./types";
import { buildIlikeOr, isUuid } from "./utils";

type AgentSnippet = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  verified_badge: boolean | null;
};

type ListingRow = {
  id: string;
  title: string;
  city: string;
  area: string;
  state: string;
  price: number;
  payment_period: string;
  listing_type: string;
  property_type: string | null;
  status: string;
  is_verified_listing: boolean;
  yike_verified: boolean | null;
  views_count: number;
  engagement_score: number | null;
  hidden_quality_score: number | null;
  media_urls: string[];
  agent?: AgentSnippet | AgentSnippet[] | null;
};

function resolveAgent(agent: ListingRow["agent"]): AgentSnippet | null {
  if (!agent) return null;
  return Array.isArray(agent) ? agent[0] ?? null : agent;
}

const LISTING_SELECT = `
  id, title, city, area, state, price, payment_period, listing_type,
  property_type, status, is_verified_listing, yike_verified,
  views_count, engagement_score, hidden_quality_score, media_urls,
  agent:profiles!properties_agent_id_fkey(id, full_name, company_name, role, verified_badge)
`;

function mapListing(row: ListingRow): AdminEntitySearchResult {
  const agent = resolveAgent(row.agent);
  const agentName =
    agent?.company_name?.trim() ||
    agent?.full_name?.trim() ||
    "Unknown agent";
  const location = [row.area, row.city, row.state].filter(Boolean).join(", ");
  const price = formatPrice(Number(row.price), row.payment_period, row.listing_type);
  const verified = row.yike_verified || row.is_verified_listing;

  return {
    id: row.id,
    display_name: row.title,
    subtitle: `${location} · ${price} · ${agentName}`,
    image_url: row.media_urls?.[0] ?? null,
    badge: verified ? "Verified" : row.status === "approved" ? "Approved" : row.status,
    meta: {
      city: row.city,
      area: row.area,
      property_type: row.property_type,
      views_count: row.views_count ?? 0,
      engagement_score: row.engagement_score,
      quality_score: row.hidden_quality_score,
      agent_name: agentName,
      status: row.status,
    },
  };
}

export async function searchAdminListings(
  admin: SupabaseClient,
  query: string,
  filters: ListingSearchFilters = {},
  limit = 15,
  excludeIds: string[] = []
): Promise<AdminEntitySearchResult[]> {
  const q = query.trim();
  if (q.length < 2 && !filters.status && !filters.city && !filters.property_type) {
    return [];
  }

  let dbQuery = admin.from("properties").select(LISTING_SELECT).limit(limit);

  if (q.length >= 2) {
    if (isUuid(q)) {
      dbQuery = dbQuery.eq("id", q);
    } else {
      const lower = q.toLowerCase();
      const orParts = buildIlikeOr(
        ["title", "city", "area", "state", "property_type"],
        q
      ).split(",");
      if (lower.includes("verified")) {
        dbQuery = dbQuery.eq("is_verified_listing", true);
      } else if (lower.includes("bed")) {
        const beds = lower.match(/(\d+)\s*bed/);
        if (beds) dbQuery = dbQuery.eq("bedrooms", Number(beds[1]));
      } else {
        dbQuery = dbQuery.or(orParts.join(","));
      }
    }
  }

  if (filters.status) dbQuery = dbQuery.eq("status", filters.status);
  if (filters.verified) dbQuery = dbQuery.eq("is_verified_listing", true);
  if (filters.city?.trim()) dbQuery = dbQuery.ilike("city", `%${filters.city.trim()}%`);
  if (filters.property_type?.trim()) {
    dbQuery = dbQuery.ilike("property_type", `%${filters.property_type.trim()}%`);
  }

  if (excludeIds.length > 0) {
    dbQuery = dbQuery.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await dbQuery.order("views_count", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapListing(row as unknown as ListingRow));
}

export async function fetchListingsByIds(
  admin: SupabaseClient,
  ids: string[]
): Promise<AdminEntitySearchResult[]> {
  if (ids.length === 0) return [];
  const { data, error } = await admin
    .from("properties")
    .select(LISTING_SELECT)
    .in("id", ids);
  if (error) throw new Error(error.message);
  const mapped = (data ?? []).map((row) => mapListing(row as unknown as ListingRow));
  const byId = new Map(mapped.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as AdminEntitySearchResult[];
}

/** Scored suggestions for hot picks — prep for future auto-curation. */
export async function suggestHotPickListings(
  admin: SupabaseClient,
  excludeIds: string[] = [],
  limit = 12
): Promise<AdminEntitySearchResult[]> {
  const now = new Date().toISOString();
  let dbQuery = admin
    .from("properties")
    .select(LISTING_SELECT)
    .eq("status", "approved")
    .gt("expires_at", now)
    .limit(Math.min(limit * 3, 60));

  if (excludeIds.length > 0) {
    dbQuery = dbQuery.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  const scored = (data ?? []).map((row) => {
    const r = row as unknown as ListingRow;
    const agent = resolveAgent(r.agent);
    const agentTrusted = agent?.verified_badge || agent?.role === "agent_verified";
    const score =
      (r.views_count ?? 0) * 2 +
      (r.engagement_score ?? 0) * 3 +
      (r.hidden_quality_score ?? 0) * 2 +
      (r.yike_verified || r.is_verified_listing ? 40 : 0) +
      (agentTrusted ? 25 : 0) +
      (r.media_urls?.length >= 3 ? 15 : 0);
    return { row: r, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => mapListing(row));
}
