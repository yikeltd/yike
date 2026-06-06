import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, Property } from "@/types/database";
import {
  getMockAgentById,
  getMockListingsByAgent,
  MOCK_LISTINGS,
} from "@/lib/mock-listings";

const AGENT_SELECT = `
  *,
  agent:profiles!properties_agent_id_fkey (
    id, full_name, phone, whatsapp, avatar_url,
    verification_status, agent_type, role, trust_score, verified_badge, ranking_score
  )
`;

export async function getAgentById(id: string): Promise<Profile | null> {
  const mock = getMockAgentById(id);
  if (!isSupabaseConfigured()) return mock;

  const supabase = await createClient();
  if (!supabase) return mock;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_banned", false)
    .maybeSingle();

  if (data) return data as Profile;
  return mock;
}

export async function getAgentListings(
  agentId: string,
  limit = 48
): Promise<Property[]> {
  if (!isSupabaseConfigured()) {
    return getMockListingsByAgent(agentId, limit);
  }

  const supabase = await createClient();
  if (!supabase) return getMockListingsByAgent(agentId, limit);

  const { data } = await supabase
    .from("properties")
    .select(AGENT_SELECT)
    .eq("agent_id", agentId)
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Property[];
  if (rows.length > 0) return rows;
  return getMockListingsByAgent(agentId, limit);
}

export function getUniqueMockAgents(): Profile[] {
  const map = new Map<string, Profile>();
  for (const p of MOCK_LISTINGS) {
    if (p.agent) map.set(p.agent.id, p.agent);
  }
  return [...map.values()];
}
