import type { Profile, Property } from "@/types/database";

export const UNVERIFIED_AGENT_LISTING_LIMIT = 5;

export type AgentProfileSlice = Pick<
  Profile,
  "role" | "verification_status" | "verified_badge" | "listing_limit"
> & {
  ranking_score?: number;
};

const LISTER_ROLES = new Set([
  "agent",
  "agent_unverified",
  "agent_verified",
  "admin",
  "super_admin",
]);

export function isAgentRole(role: string | null | undefined): boolean {
  return !!role && LISTER_ROLES.has(role);
}

export function isListerProfile(
  profile: AgentProfileSlice | null | undefined
): boolean {
  if (!profile) return false;
  return isAgentRole(profile.role);
}

export function isVerifiedAgentProfile(
  profile: AgentProfileSlice | null | undefined
): boolean {
  if (!profile) return false;
  if (profile.verified_badge) return true;
  if (profile.role === "agent_verified") return true;
  return (
    profile.verification_status === "approved" ||
    profile.verification_status === "verified"
  );
}

export function canListProperties(
  profile: AgentProfileSlice | null | undefined
): boolean {
  return isListerProfile(profile);
}

export function getListingLimit(
  profile: AgentProfileSlice | null | undefined
): number | null {
  if (!profile) return UNVERIFIED_AGENT_LISTING_LIMIT;
  if (isVerifiedAgentProfile(profile)) return null;
  return profile.listing_limit ?? UNVERIFIED_AGENT_LISTING_LIMIT;
}

export function countAsActiveListing(
  status: string,
  expiresAt: string
): boolean {
  return (
    (status === "pending" || status === "approved") &&
    new Date(expiresAt) > new Date()
  );
}

export function isFeaturedActive(property: Property): boolean {
  if (!property.is_featured) return false;
  if (!property.featured_until) return true;
  return new Date(property.featured_until) > new Date();
}

/** Search / feed ranking: verified agents first, then quality signals. */
export function propertyMarketRank(property: Property): number {
  const agent = property.agent;
  let score = 0;

  if (agent && isVerifiedAgentProfile(agent)) score += 10_000;
  score += (agent?.ranking_score ?? 0) * 10;

  if (isFeaturedActive(property)) score += 5_000;
  score += (property.boost_score ?? 0) * 50;

  if (property.sponsored_status === "sponsored") score += 2_000;
  if (property.sponsored_status === "boosted") score += 1_000;

  if (property.is_verified_listing) score += 500;

  const ageDays =
    (Date.now() - new Date(property.created_at).getTime()) / 86_400_000;
  score += Math.max(0, 120 - ageDays);

  return score;
}

export function sortPropertiesByMarketRank(
  properties: Property[]
): Property[] {
  return [...properties].sort(
    (a, b) =>
      propertyMarketRank(b) - propertyMarketRank(a) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function agentTierLabel(profile: AgentProfileSlice): string {
  if (isVerifiedAgentProfile(profile)) return "Verified agent";
  if (isListerProfile(profile)) return "Agent";
  return "User";
}
