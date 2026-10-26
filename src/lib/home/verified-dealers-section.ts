import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";

export const VERIFIED_DEALERS_HOME_TITLE =
  "🛡️ Verified Dealers & Developers" as const;

export const VERIFIED_DEALERS_HOME_SUBTITLE =
  "Trusted businesses with live inventory on Yike" as const;

/** Dev/sample catalog only — never shown when live dealers exist. */
export const VERIFIED_DEALERS_SAMPLE_FIXTURE: DiscoveryDealerCard[] = [
  {
    id: "d-1",
    name: "Demo Auto Hub",
    href: "/agent/demo-auto-hub",
    avatarUrl:
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&q=80&fit=crop",
    verified: true,
    isDealer: true,
    categoryLabel: "Vehicles",
    location: "Lagos, Lagos",
    listingCount: 12,
    memberSince: "2026-07-01",
  },
  {
    id: "d-4",
    name: "BuildRight Estate",
    href: "/agent/buildright-estate",
    avatarUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&q=80&fit=crop",
    verified: true,
    isDealer: false,
    categoryLabel: "Property",
    location: "Lagos, Lagos",
    listingCount: 8,
    memberSince: "2025-05-01",
  },
  {
    id: "d-11",
    name: "TechPoint NG",
    href: "/agent/techpoint-ng",
    avatarUrl:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=120&q=80&fit=crop",
    verified: true,
    isDealer: false,
    categoryLabel: "Tech & Electronics",
    location: "Lagos, Lagos",
    listingCount: 6,
    memberSince: "2026-01-01",
  },
];

export function resolveVerifiedDealersForHome(input: {
  liveDealers: DiscoveryDealerCard[];
  showingSampleListingsFixture?: boolean;
  /** Dev/demo inventory rails — fixture dealers only when listings are demo-filled. */
  showingDemoFixtures?: boolean;
}): DiscoveryDealerCard[] {
  if (input.liveDealers.length > 0) return input.liveDealers;
  if (input.showingSampleListingsFixture || input.showingDemoFixtures) {
    return VERIFIED_DEALERS_SAMPLE_FIXTURE;
  }
  return [];
}
