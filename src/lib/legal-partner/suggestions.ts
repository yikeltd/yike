import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerSuggestion = {
  id: string;
  partnerCode: string;
  fullName: string | null;
  firmName: string;
  city: string;
  state: string;
  trustLevel: string;
  completedReviews: number;
  fraudFlagsCount: number;
  openAssignments: number;
  score: number;
  warnings: string[];
};

export async function suggestLegalPartners(
  client: SupabaseClient,
  params: {
    city?: string | null;
    state?: string | null;
    reviewType?: string;
    listingAgentId?: string | null;
    limit?: number;
  }
): Promise<PartnerSuggestion[]> {
  const { data: partners } = await client
    .from("legal_partners")
    .select(
      "id, partner_code, full_name, firm_name, assigned_city, assigned_state, trust_level, completed_reviews, fraud_flags_count, performance_score, profile_id, operating_cities"
    )
    .eq("status", "approved")
    .order("performance_score", { ascending: false })
    .limit(40);

  if (!partners?.length) return [];

  const city = params.city?.trim().toLowerCase() ?? "";
  const results: PartnerSuggestion[] = [];

  for (const p of partners) {
    const warnings: string[] = [];
    if (params.listingAgentId && p.profile_id === params.listingAgentId) {
      warnings.push("partner_is_listing_agent");
    }

    if (params.listingAgentId) {
      const { count } = await client
        .from("legal_verification_requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_legal_partner_id", p.id)
        .eq("listing_agent_id", params.listingAgentId)
        .in("status", ["completed", "reviewed", "delivered"]);

      if ((count ?? 0) >= 3) warnings.push("repeat_agent_pairing");
    }

    const { count: openCount } = await client
      .from("legal_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_legal_partner_id", p.id)
      .in("status", ["assigned", "in_progress"]);

    const openAssignments = openCount ?? 0;
    if (openAssignments >= 4) warnings.push("at_capacity");

    let score = Number(p.performance_score ?? 100);
    if (p.assigned_city?.toLowerCase() === city) score += 25;
    if (params.state && p.assigned_state?.toLowerCase() === params.state.toLowerCase()) score += 10;
    if (p.operating_cities?.toLowerCase().includes(city)) score += 15;
    score -= (p.fraud_flags_count ?? 0) * 10;
    score -= openAssignments * 4;
    score += Math.min(p.completed_reviews ?? 0, 15);

    if (params.reviewType === "level_3_registry" && p.trust_level === "basic") {
      warnings.push("registry_review_needs_verified_partner");
      score -= 15;
    }

    results.push({
      id: p.id,
      partnerCode: p.partner_code,
      fullName: p.full_name,
      firmName: p.firm_name,
      city: p.assigned_city,
      state: p.assigned_state,
      trustLevel: p.trust_level,
      completedReviews: p.completed_reviews ?? 0,
      fraudFlagsCount: p.fraud_flags_count ?? 0,
      openAssignments,
      score: Math.round(score * 10) / 10,
      warnings,
    });
  }

  return results
    .filter((r) => !r.warnings.includes("partner_is_listing_agent"))
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 8);
}
