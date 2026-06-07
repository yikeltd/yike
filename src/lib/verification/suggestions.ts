import type { SupabaseClient } from "@supabase/supabase-js";
import { verifierAssignmentTrustBoost } from "@/lib/trust/score-engine/ranking";

export type VerifierSuggestion = {
  id: string;
  verifierCode: string;
  fullName: string | null;
  city: string;
  state: string;
  trustLevel: string;
  completedInspections: number;
  fraudFlagsCount: number;
  openAssignments: number;
  responseScore: number;
  performanceScore: number;
  score: number;
  warnings: string[];
};

export async function suggestVerifiersForRequest(
  client: SupabaseClient,
  params: {
    city?: string | null;
    state?: string | null;
    propertyId?: string | null;
    listingAgentId?: string | null;
    limit?: number;
  }
): Promise<VerifierSuggestion[]> {
  const { data: verifiers } = await client
    .from("field_verifiers")
    .select(
      "id, verifier_code, full_name, assigned_city, assigned_state, trust_level, completed_inspections, fraud_flags_count, response_score, performance_score, profile_id"
    )
    .eq("status", "approved")
    .order("performance_score", { ascending: false })
    .limit(40);

  if (!verifiers?.length) return [];

  const verifierIds = verifiers.map((v) => v.id);
  const { data: trustRows } = await client
    .from("trust_scores")
    .select("entity_id, trust_score, risk_score, confidence_score, trust_level")
    .eq("entity_type", "field_verifier")
    .in("entity_id", verifierIds);

  const trustMap = new Map(
    (trustRows ?? []).map((t) => [t.entity_id, t])
  );

  const city = params.city?.trim().toLowerCase() ?? "";
  const results: VerifierSuggestion[] = [];

  for (const v of verifiers) {
    const warnings: string[] = [];
    if (params.listingAgentId && v.profile_id === params.listingAgentId) {
      warnings.push("verifier_is_listing_agent");
    }

    if (params.listingAgentId) {
      const { count } = await client
        .from("property_verification_requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_verifier_id", v.id)
        .eq("listing_agent_id", params.listingAgentId)
        .in("status", ["completed", "reviewed", "delivered"]);

      if ((count ?? 0) >= 3) warnings.push("repeat_agent_pairing");
    }

    const { count: openCount } = await client
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_verifier_id", v.id)
      .in("status", ["assigned", "accepted", "in_progress"]);

    const openAssignments = openCount ?? 0;
    if (openAssignments >= 5) warnings.push("at_capacity");

    let score = Number(v.performance_score ?? 100);
    if (v.assigned_city?.toLowerCase() === city) score += 25;
    if (params.state && v.assigned_state?.toLowerCase() === params.state.toLowerCase()) score += 10;
    score -= (v.fraud_flags_count ?? 0) * 8;
    score -= openAssignments * 3;
    score += Math.min(v.completed_inspections ?? 0, 20);
    score += Number(v.response_score ?? 100) * 0.1;

    const trust = trustMap.get(v.id);
    if (trust) {
      score += verifierAssignmentTrustBoost(
        Number(trust.trust_score),
        Number(trust.risk_score),
        Number(trust.confidence_score)
      );
      if (["critical_risk", "high_risk"].includes(trust.trust_level)) {
        warnings.push("internal_trust_risk");
      }
    }

    results.push({
      id: v.id,
      verifierCode: v.verifier_code,
      fullName: v.full_name,
      city: v.assigned_city,
      state: v.assigned_state,
      trustLevel: v.trust_level,
      completedInspections: v.completed_inspections ?? 0,
      fraudFlagsCount: v.fraud_flags_count ?? 0,
      openAssignments,
      responseScore: Number(v.response_score ?? 100),
      performanceScore: Number(v.performance_score ?? 100),
      score: Math.round(score * 10) / 10,
      warnings,
    });
  }

  return results
    .filter((r) => !r.warnings.includes("verifier_is_listing_agent"))
    .filter((r) => !r.warnings.includes("internal_trust_risk"))
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 8);
}
