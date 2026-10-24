import type { Property } from "@/types/database";
import { isMarketplaceNativeContactEnabled } from "@/lib/yike-coins/flags";

type AgentLike = NonNullable<Property["agent"]>;

/** Fields embedded in public listing queries for seller profile cards. */
export function publicListingAgentSelectSql(extraFields = ""): string {
  const contactFields = isMarketplaceNativeContactEnabled() ? "" : "phone, whatsapp, ";
  const extra = extraFields ? `, ${extraFields}` : "";
  return `id, full_name, ${contactFields}avatar_url, verification_status, agent_type, role, verified_badge, ranking_score, listing_limit, availability_status, performance_score, last_activity_at, is_verified_agent, verification_level, is_responsive, response_rate${extra}`;
}

export function redactListingAgentContact<T extends { agent?: AgentLike | null }>(
  listing: T
): T {
  if (!isMarketplaceNativeContactEnabled() || !listing.agent) {
    return listing;
  }
  const { phone: _p, whatsapp: _w, ...rest } = listing.agent as AgentLike & {
    phone?: string | null;
    whatsapp?: string | null;
  };
  return {
    ...listing,
    agent: rest as AgentLike,
  };
}

export function redactListingCollection<T extends { agent?: AgentLike | null }>(
  listings: T[]
): T[] {
  if (!isMarketplaceNativeContactEnabled()) return listings;
  return listings.map(redactListingAgentContact);
}
