import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, Property } from "@/types/database";
import {
  getMockAgentById,
  getMockListingsByAgent,
  MOCK_LISTINGS,
} from "@/lib/mock-listings";
import { isUuidParam } from "@/lib/agent-slugs";
import { agentPublicPath } from "@/lib/agent-slugs";

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
    .maybeSingle();

  if (!data) return mock;
  const profile = data as Profile;
  if (profile.profile_status === "deleted") return null;
  return profile;
}

export async function getAgentBySlug(slug: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    const agents = getUniqueMockAgents();
    return agents.find((a) => a.public_slug === slug || a.id === slug) ?? null;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!data) return null;
  const profile = data as Profile;
  if (profile.profile_status === "deleted") return null;
  return profile;
}

export async function resolveAgentRoute(slugOrId: string): Promise<{
  agent: Profile | null;
  redirectTo?: string;
}> {
  if (isUuidParam(slugOrId)) {
    const agent = await getAgentById(slugOrId);
    if (!agent) return { agent: null };
    if (agent.public_slug && agent.public_slug !== slugOrId) {
      return { agent, redirectTo: agentPublicPath(agent) };
    }
    return { agent };
  }
  const agent = await getAgentBySlug(slugOrId);
  return { agent };
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
