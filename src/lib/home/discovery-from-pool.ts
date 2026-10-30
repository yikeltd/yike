/**
 * Presentation-only discovery helpers — slice existing listing pools.
 * No recommendation engine, no new queries beyond in-memory filters.
 */

import type { Property, Profile } from "@/types/database";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";
import { isVerifiedAgent } from "@/lib/utils";
import { agentPublicPath, companyPublicPath } from "@/lib/agent-slugs";
import { normalizeAssetType } from "@/lib/marketplace/listings";
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
  /** Primary live-inventory vertical for display (Property · Vehicles · Tech & Electronics). */
  categoryLabel: string;
  memberSince: string | null;
};

type AgentLite = Pick<
  Profile,
  | "id"
  | "full_name"
  | "company_name"
  | "avatar_url"
  | "account_type"
  | "agent_type"
  | "verification_status"
  | "verified_badge"
  | "is_verified_agent"
  | "developer_verified"
  | "agency_verified"
  | "public_slug"
  | "created_at"
  | "role"
  | "listing_limit"
> & { city?: string | null; state?: string | null };

function resolveAgentAccountType(
  agent: AgentLite,
): Profile["account_type"] | null {
  if (agent.account_type) return agent.account_type;
  if (agent.agent_type === "agency") return "agency";
  return null;
}

function agentStorefrontPath(agent: AgentLite): string {
  const profile = agent as Profile;
  const accountType = resolveAgentAccountType(agent);
  if (accountType === "agency" || accountType === "developer") {
    return companyPublicPath({ ...profile, account_type: accountType });
  }
  return agentPublicPath(profile);
}

type VerticalCounts = {
  property: number;
  vehicle: number;
  electronics: number;
};

function verticalForListing(listing: Property): keyof VerticalCounts | null {
  const asset = normalizeAssetType(listing.asset_type);
  if (asset === "PROPERTY") return "property";
  if (asset === "VEHICLE") return "vehicle";
  if (asset === "ELECTRONICS") return "electronics";
  return null;
}

/** Existing verification rules — dealers, verified sellers, verified developers/agencies. */
export function isEligibleVerifiedDiscoveryAgent(agent: AgentLite): boolean {
  const verified = isVerifiedAgent(agent);
  const accountType = resolveAgentAccountType(agent);
  const isDealer = accountType === "dealer";
  const isDeveloper =
    accountType === "developer" &&
    (Boolean(agent.developer_verified) || verified);
  const isAgency =
    accountType === "agency" && (Boolean(agent.agency_verified) || verified);
  if (isDealer) return true;
  if (isDeveloper) return true;
  if (isAgency) return true;
  return verified;
}

export function resolveDiscoveryDealerCategoryLabel(
  agent: AgentLite,
  counts: VerticalCounts,
): string {
  if (resolveAgentAccountType(agent) === "developer") return "Property";
  const entries: { key: keyof VerticalCounts; label: string }[] = [
    { key: "electronics", label: "Tech & Electronics" },
    { key: "vehicle", label: "Vehicles" },
    { key: "property", label: "Property" },
  ];
  let best = entries[2];
  let bestCount = counts.property;
  for (const entry of entries) {
    const n = counts[entry.key];
    if (n > bestCount) {
      bestCount = n;
      best = entry;
    }
  }
  if (bestCount > 0) return best.label;
  if (resolveAgentAccountType(agent) === "dealer") return "Vehicles";
  return "Property";
}

/** Derive dealer/verified seller cards from listing.agent embeds — live pool rows only. */
export function extractDealersFromListings(
  items: Property[],
  limit = 8,
): DiscoveryDealerCard[] {
  const byId = new Map<
    string,
    {
      agent: AgentLite;
      count: number;
      verticals: VerticalCounts;
      city?: string | null;
      state?: string | null;
    }
  >();

  for (const listing of items) {
    const agent = listing.agent as AgentLite | null | undefined;
    if (!agent?.id) continue;
    if (!isEligibleVerifiedDiscoveryAgent(agent)) continue;

    const vertical = verticalForListing(listing);
    if (!vertical) continue;

    const prev = byId.get(agent.id);
    if (prev) {
      prev.count += 1;
      prev.verticals[vertical] += 1;
      if (!prev.city && listing.city) prev.city = listing.city;
      if (!prev.state && listing.state) prev.state = listing.state;
    } else {
      const verticals: VerticalCounts = { property: 0, vehicle: 0, electronics: 0 };
      verticals[vertical] = 1;
      byId.set(agent.id, {
        agent,
        count: 1,
        verticals,
        city: listing.city,
        state: listing.state,
      });
    }
  }

  return [...byId.values()]
    .filter(({ count }) => count > 0)
    .sort((a, b) => {
      const aDealer = resolveAgentAccountType(a.agent) === "dealer" ? 1 : 0;
      const bDealer = resolveAgentAccountType(b.agent) === "dealer" ? 1 : 0;
      if (bDealer !== aDealer) return bDealer - aDealer;
      return b.count - a.count;
    })
    .slice(0, limit)
    .map(({ agent, count, verticals, city, state }) => {
      return {
        id: agent.id,
        name: agent.company_name || agent.full_name || "Verified seller",
        href: agentStorefrontPath(agent),
        avatarUrl: agent.avatar_url ?? null,
        location: [city, state].filter(Boolean).join(", ") || null,
        listingCount: count,
        verified: isVerifiedAgent(agent),
        isDealer: resolveAgentAccountType(agent) === "dealer",
        categoryLabel: resolveDiscoveryDealerCategoryLabel(agent, verticals),
        memberSince: agent.created_at ?? null,
      };
    });
}

/** Merge unique dealers from property, vehicle, and electronics live pools. */
export function extractVerifiedDealersFromMarketplacePools(input: {
  property: Property[];
  vehicle: Property[];
  electronics: Property[];
  limit?: number;
}): DiscoveryDealerCard[] {
  const merged = dedupeById([
    ...input.property,
    ...input.vehicle,
    ...input.electronics,
  ]);
  return extractDealersFromListings(merged, input.limit ?? 12);
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
