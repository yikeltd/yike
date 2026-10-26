/**
 * Deterministic verified-dealer pools for unit/E2E tests only.
 * Never enabled in production — gated by `isVerifiedDealersHomeTestMode()`.
 */

import type { Property } from "@/types/database";
import { extractVerifiedDealersFromMarketplacePools } from "@/lib/home/discovery-from-pool";

const TEST_NAMESPACE = "yike-verified-dealers-test-fixture-v1";

function agent(
  id: string,
  partial: Record<string, unknown>,
): NonNullable<Property["agent"]> {
  return {
    id,
    full_name: "Test Seller",
    username: null,
    email: null,
    phone: null,
    phone_verified: true,
    email_verified: true,
    whatsapp: null,
    avatar_url: null,
    role: "agent_verified",
    verification_status: "approved",
    verified_badge: true,
    listing_limit: null,
    ranking_score: 100,
    is_banned: false,
    plan: "free",
    plan_expires_at: null,
    trust_score: 95,
    is_verified_agent: true,
    created_at: "2026-01-15T00:00:00.000Z",
    agent_type: "independent",
    ...partial,
  } as NonNullable<Property["agent"]>;
}

function listing(
  id: string,
  asset: "PROPERTY" | "VEHICLE" | "ELECTRONICS",
  agentProfile: NonNullable<Property["agent"]>,
): Property {
  return {
    id,
    asset_type: asset,
    agent_id: agentProfile.id,
    agent: agentProfile,
    city: "Lagos",
    state: "Lagos",
    status: "approved",
    expires_at: new Date(Date.now() + 86_400_000 * 30).toISOString(),
    attributes: { test_fixture: TEST_NAMESPACE },
  } as unknown as Property;
}

export const VERIFIED_DEALERS_TEST_LISTINGS: Property[] = [
  listing(
    "test-dealer-prop-1",
    "PROPERTY",
    agent("test-dealer-dev-1", {
      company_name: "Fixture Developer Ltd",
      account_type: "developer",
      developer_verified: true,
      public_slug: "fixture-developer-ltd",
    }),
  ),
  listing(
    "test-dealer-veh-1",
    "VEHICLE",
    agent("test-dealer-auto-1", {
      company_name: "Fixture Auto Dealer",
      account_type: "dealer",
      public_slug: "fixture-auto-dealer",
    }),
  ),
  listing(
    "test-dealer-elec-1",
    "ELECTRONICS",
    agent("test-dealer-tech-1", {
      company_name: "Fixture Tech Hub",
      account_type: "agency",
      agency_verified: true,
      public_slug: "fixture-tech-hub",
    }),
  ),
];

export function isVerifiedDealersHomeTestMode(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  const raw = searchParams.yike_test_verified_dealers;
  const flag = Array.isArray(raw) ? raw[0] : raw;
  return flag === "1";
}

export function verifiedDealersFromTestFixture(): ReturnType<
  typeof extractVerifiedDealersFromMarketplacePools
> {
  return extractVerifiedDealersFromMarketplacePools({
    property: VERIFIED_DEALERS_TEST_LISTINGS.filter(
      (p) => p.asset_type === "PROPERTY",
    ),
    vehicle: VERIFIED_DEALERS_TEST_LISTINGS.filter(
      (p) => p.asset_type === "VEHICLE",
    ),
    electronics: VERIFIED_DEALERS_TEST_LISTINGS.filter(
      (p) => p.asset_type === "ELECTRONICS",
    ),
    limit: 12,
  });
}
