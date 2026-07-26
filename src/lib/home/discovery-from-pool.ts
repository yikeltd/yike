/**
 * Presentation-only discovery helpers — slice existing listing pools.
 * No recommendation engine, no new queries beyond in-memory filters.
 */

import type { Property, Profile } from "@/types/database";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";
import { isVerifiedAgent } from "@/lib/utils";
import { agentPublicPath } from "@/lib/agent-slugs";
import {
  dedupeById,
  pickFeaturedRail,
} from "@/lib/home/inventory-rails";
import type {
  LocationRankResult,
  MarketplaceLocation,
} from "@/lib/marketplace-location";

export const BUDGET_UNDER_5M = 5_000_000;
export const BUDGET_5_TO_10M_MIN = 5_000_000;
export const BUDGET_5_TO_10M_MAX = 10_000_000;

export function pickByAutoCategory(
  items: Property[],
  category: string,
  limit = 6,
): Property[] {
  const matched = items.filter(
    (p) => (p.auto_category ?? "").toLowerCase() === category.toLowerCase(),
  );
  return matched.slice(0, limit);
}

export function pickBudgetUnder(
  items: Property[],
  maxPrice: number,
  limit = 6,
): Property[] {
  return [...items]
    .filter((p) => Number(p.price) > 0 && Number(p.price) <= maxPrice)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, limit);
}

export function pickBudgetRange(
  items: Property[],
  minPrice: number,
  maxPrice: number,
  limit = 6,
): Property[] {
  return [...items]
    .filter((p) => {
      const price = Number(p.price);
      return price >= minPrice && price <= maxPrice;
    })
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, limit);
}

export function pickPremiumRail(
  items: Property[],
  limit = 6,
  loc?: MarketplaceLocation | null,
): LocationRankResult {
  return pickFeaturedRail(items, limit, loc);
}

export function pickCommercialVehicles(items: Property[], limit = 6): Property[] {
  const commercial = items.filter((p) => {
    const cat = (p.auto_category ?? "").toLowerCase();
    return (
      cat === "commercial" ||
      cat === "truck" ||
      cat === "bus" ||
      cat === "van"
    );
  });
  return commercial.slice(0, limit);
}

export function pickPropertyByTypes(
  items: Property[],
  types: string[],
  limit = 6,
): Property[] {
  const set = new Set(types.map((t) => t.toLowerCase()));
  return items
    .filter((p) => set.has((p.property_type ?? "").toLowerCase()))
    .slice(0, limit);
}

export function countByAutoCategory(
  items: Property[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of items) {
    const cat = (p.auto_category ?? "").toLowerCase() || "other";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

export function countByPropertyType(
  items: Property[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of items) {
    const t = (p.property_type ?? "").toLowerCase() || "other";
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

export type DiscoveryDealerCard = {
  id: string;
  name: string;
  href: string;
  avatarUrl: string | null;
  location: string | null;
  listingCount: number;
  verified: boolean;
  isDealer: boolean;
  memberSince: string | null;
};

type AgentLite = Pick<
  Profile,
  | "id"
  | "full_name"
  | "company_name"
  | "avatar_url"
  | "account_type"
  | "verification_status"
  | "verified_badge"
  | "is_verified_agent"
  | "public_slug"
  | "created_at"
  | "role"
  | "listing_limit"
> & { city?: string | null; state?: string | null };

/** Derive dealer/verified seller cards from listing.agent embeds — existing data only. */
export function extractDealersFromListings(
  items: Property[],
  limit = 8,
): DiscoveryDealerCard[] {
  const byId = new Map<
    string,
    { agent: AgentLite; count: number; city?: string | null; state?: string | null }
  >();

  for (const listing of items) {
    const agent = listing.agent as AgentLite | null | undefined;
    if (!agent?.id) continue;
    const isDealer = agent.account_type === "dealer";
    const verified = isVerifiedAgent(agent);
    if (!isDealer && !verified) continue;

    const prev = byId.get(agent.id);
    if (prev) {
      prev.count += 1;
      if (!prev.city && listing.city) prev.city = listing.city;
      if (!prev.state && listing.state) prev.state = listing.state;
    } else {
      byId.set(agent.id, {
        agent,
        count: 1,
        city: listing.city,
        state: listing.state,
      });
    }
  }

  return [...byId.values()]
    .sort((a, b) => {
      const aDealer = a.agent.account_type === "dealer" ? 1 : 0;
      const bDealer = b.agent.account_type === "dealer" ? 1 : 0;
      if (bDealer !== aDealer) return bDealer - aDealer;
      return b.count - a.count;
    })
    .slice(0, limit)
    .map(({ agent, count, city, state }) => {
      const profile = agent as Profile;
      return {
        id: agent.id,
        name: agent.company_name || agent.full_name || "Verified seller",
        href: agentPublicPath(profile),
        avatarUrl: agent.avatar_url ?? null,
        location: [city, state].filter(Boolean).join(", ") || null,
        listingCount: count,
        verified: isVerifiedAgent(agent),
        isDealer: agent.account_type === "dealer",
        memberSince: agent.created_at ?? null,
      };
    });
}

export function formatMemberSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

/** Prefer unique inventory across rails so the page feels fuller. */
export function excludeIds(items: Property[], used: Set<string>): Property[] {
  return items.filter((p) => !used.has(p.id));
}

export function markUsed(used: Set<string>, items: Property[]) {
  for (const p of items) used.add(p.id);
}

export function featuredOrBoosted(items: Property[]): Property[] {
  return dedupeById(
    items.filter((p) => isBoostedActive(p) || isFeaturedActive(p)),
  );
}
