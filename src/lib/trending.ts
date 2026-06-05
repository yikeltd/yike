import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Property } from "@/types/database";
import { MOCK_LISTINGS } from "@/lib/mock-listings";

const PUBLIC_SELECT = `
  *,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, phone, whatsapp, avatar_url,
    verification_status, agent_type, role
  )
`;

function mockTrending(city?: string, limit = 6): Property[] {
  let rows = [...MOCK_LISTINGS].sort(
    (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)
  );
  if (city) {
    rows = rows.filter(
      (p) => p.city.toLowerCase() === city.toLowerCase()
    );
  }
  return rows.slice(0, limit);
}

/** Listings with highest views — honest signal, no fake counts. */
export async function getMostViewedListings(
  limit = 6,
  city?: string
): Promise<Property[]> {
  if (!isSupabaseConfigured()) return mockTrending(city, limit);

  const supabase = await createClient();
  if (!supabase) return mockTrending(city, limit);

  let query = supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .gt("views_count", 0)
    .order("views_count", { ascending: false })
    .limit(limit);

  if (city) query = query.ilike("city", city);

  const { data } = await query;
  const rows = (data ?? []) as Property[];
  if (rows.length > 0) return rows;
  return mockTrending(city, limit);
}

/** Recently approved listings — marketplace activity feel. */
export async function getLatestListings(
  limit = 8,
  city?: string
): Promise<Property[]> {
  if (!isSupabaseConfigured()) {
    let rows = [...MOCK_LISTINGS].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (city) {
      rows = rows.filter(
        (p) => p.city.toLowerCase() === city.toLowerCase()
      );
    }
    return rows.slice(0, limit);
  }

  const supabase = await createClient();
  if (!supabase) return mockTrending(city, limit);

  let query = supabase
    .from("properties")
    .select(PUBLIC_SELECT)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (city) query = query.ilike("city", city);

  const { data } = await query;
  const rows = (data ?? []) as Property[];
  if (rows.length > 0) return rows;
  return mockTrending(city, limit);
}

/** Trending in a city — views + recency blend (simple, no fake numbers). */
export async function getTrendingInCity(
  city: string,
  limit = 6
): Promise<Property[]> {
  const viewed = await getMostViewedListings(limit * 2, city);
  const recent = await getLatestListings(limit * 2, city);
  const seen = new Set<string>();
  const out: Property[] = [];

  for (const p of [...viewed, ...recent]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
