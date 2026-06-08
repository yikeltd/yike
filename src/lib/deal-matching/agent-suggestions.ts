import type { SupabaseClient } from "@supabase/supabase-js";

export type AgentSuggestion = {
  id: string;
  displayName: string;
  subtitle: string;
  avatarUrl: string | null;
  listingCount: number;
  verified: boolean;
  trustScore: number | null;
  trustLevel: string | null;
  score: number;
  warnings: string[];
};

type SuggestInput = {
  city?: string | null;
  state?: string | null;
  area?: string | null;
  propertyType?: string | null;
  limit?: number;
};

const AGENT_ROLES = ["agent_unverified", "agent_verified"] as const;

function locationOrFilter(city?: string | null, area?: string | null, state?: string | null): string[] {
  const filters: string[] = [];
  if (area?.trim()) filters.push(`area.ilike.%${area.trim()}%`);
  if (city?.trim()) filters.push(`city.ilike.%${city.trim()}%`);
  if (state?.trim()) filters.push(`state.ilike.%${state.trim()}%`);
  return filters;
}

export async function suggestAgentsForDeal(
  admin: SupabaseClient,
  input: SuggestInput
): Promise<AgentSuggestion[]> {
  const limit = Math.min(input.limit ?? 20, 40);
  const now = new Date().toISOString();

  let listingQuery = admin
    .from("properties")
    .select("agent_id, city, area, state, property_type")
    .eq("status", "approved")
    .gt("expires_at", now)
    .not("agent_id", "is", null);

  const locFilters = locationOrFilter(input.city, input.area, input.state);
  if (locFilters.length > 0) {
    listingQuery = listingQuery.or(locFilters.join(","));
  }
  if (input.propertyType?.trim()) {
    listingQuery = listingQuery.ilike("property_type", `%${input.propertyType.trim()}%`);
  }

  const { data: listings } = await listingQuery.limit(500);
  const agentCounts = new Map<string, number>();
  for (const row of listings ?? []) {
    const id = row.agent_id as string;
    agentCounts.set(id, (agentCounts.get(id) ?? 0) + 1);
  }

  const rankedIds = [...agentCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    .map(([id]) => id);

  if (rankedIds.length === 0) {
    const { data: fallbackAgents } = await admin
      .from("profiles")
      .select("id, full_name, company_name, email, phone, role, verification_status, avatar_url, office_address")
      .in("role", [...AGENT_ROLES])
      .eq("is_banned", false)
      .limit(limit);

    return scoreProfiles(admin, fallbackAgents ?? [], new Map(), input);
  }

  const { data: agents } = await admin
    .from("profiles")
    .select("id, full_name, company_name, email, phone, role, verification_status, avatar_url, office_address, company_verified")
    .in("id", rankedIds)
    .in("role", [...AGENT_ROLES])
    .eq("is_banned", false);

  const suggestions = await scoreProfiles(admin, agents ?? [], agentCounts, input);
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function scoreProfiles(
  admin: SupabaseClient,
  agents: Array<Record<string, unknown>>,
  listingCounts: Map<string, number>,
  input: SuggestInput
): Promise<AgentSuggestion[]> {
  const ids = agents.map((a) => a.id as string);
  const trustMap = new Map<string, { score: number | null; level: string | null }>();

  if (ids.length > 0) {
    const { data: trustRows } = await admin
      .from("trust_scores")
      .select("entity_id, score, trust_level")
      .eq("entity_type", "agent")
      .in("entity_id", ids);

    for (const row of trustRows ?? []) {
      trustMap.set(row.entity_id as string, {
        score: row.score as number | null,
        level: row.trust_level as string | null,
      });
    }
  }

  return agents.map((agent) => {
    const id = agent.id as string;
    const verified = agent.role === "agent_verified";
    const listings = listingCounts.get(id) ?? 0;
    const trust = trustMap.get(id);
    const warnings: string[] = [];

    let score = listings * 10;
    if (verified) score += 30;
    if (trust?.score != null) score += Math.min(trust.score, 40);
    if (trust?.level && ["critical_risk", "high_risk"].includes(trust.level)) {
      score -= 50;
      warnings.push("Elevated trust risk");
    }
    if (!verified) warnings.push("Not verified");
    if (listings === 0) warnings.push("No matching listings in area");

    const displayName =
      (agent.company_name as string | null)?.trim() ||
      (agent.full_name as string | null)?.trim() ||
      (agent.email as string | null)?.trim() ||
      "Agent";

    const subtitle = [
      verified ? "Verified" : "Unverified",
      `${listings} area listings`,
      trust?.level ? `Trust: ${trust.level.replace(/_/g, " ")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      id,
      displayName,
      subtitle,
      avatarUrl: (agent.avatar_url as string | null) ?? null,
      listingCount: listings,
      verified,
      trustScore: trust?.score ?? null,
      trustLevel: trust?.level ?? null,
      score,
      warnings,
    };
  });
}

export async function searchAgentsForDeal(
  admin: SupabaseClient,
  query: string,
  limit = 15
): Promise<AgentSuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, company_name, email, phone, role, verification_status, avatar_url")
    .in("role", [...AGENT_ROLES])
    .eq("is_banned", false)
    .or(
      `full_name.ilike.${pattern},company_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
    )
    .limit(limit);

  return scoreProfiles(admin, data ?? [], new Map(), {});
}
