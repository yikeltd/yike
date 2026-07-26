import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveAgentRoute,
  getAgentListings,
} from "@/lib/agents";
import { AgentUnavailable } from "@/components/agent/agent-unavailable";
import { PropertyFeed } from "@/components/property/property-feed";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import { isVerifiedAgent } from "@/lib/utils";
import { isDemoProperty } from "@/lib/mock-listings";
import { AlertTriangle } from "lucide-react";
import { AgentReviewsSection } from "@/components/reviews/agent-reviews-section";
import { PublicSellerProfileHeader } from "@/components/agent/public-seller-profile-header";
import { AgencyDeveloperProfileSections } from "@/components/agent/agency-developer-profile-sections";
import { getSession } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { getProfileSocialStats } from "@/lib/social/stats";
import { agentCanonical } from "@/lib/seo/utils";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { PassportReadinessNotice } from "@/components/marketplace/passport-readiness";
import {
  TrustModule,
  type TrustBadgeKind,
} from "@/components/marketplace/experience";
import { isResponsiveAgent } from "@/lib/agent-response";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { agent, redirectTo } = await resolveAgentRoute(slug);
  if (redirectTo || !agent) return { title: "Agent | Yike" };
  const name = agent.company_name?.trim() || agent.full_name?.trim() || "Agent";
  const roleLabel =
    agent.account_type === "dealer"
      ? "dealer"
      : agent.account_type === "agency"
        ? "agency"
        : "seller";
  const canonicalSlug = agent.public_slug ?? slug;
  return {
    title: `${name} | Yike`,
    description: `Browse marketplace listings from ${name} (${roleLabel}) on Yike.ng`,
    alternates: { canonical: agentCanonical(canonicalSlug) },
    robots:
      agent.profile_status === "suspended" || agent.profile_status === "deleted"
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { agent, redirectTo } = await resolveAgentRoute(slug);
  if (redirectTo) redirect(redirectTo);
  if (!agent) return <AgentUnavailable />;

  const agentId = agent.id;
  const supabase = await requireServerClient();
  const viewer = await getSession();
  const [listings, socialStats] = await Promise.all([
    getAgentListings(agentId),
    getProfileSocialStats(supabase, agentId),
  ]);
  const verified = isVerifiedAgent(agent);
  const isDemo = listings.every((p) => isDemoProperty(p.id));
  const suspended = agent.profile_status === "suspended";
  const showListings = !suspended && agent.profile_status !== "deleted";
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const propertyListings = listings.filter(
    (p) => normalizeAssetType(p.asset_type) === "PROPERTY",
  );
  const vehicleListings = listings.filter(
    (p) => normalizeAssetType(p.asset_type) === "VEHICLE",
  );
  const isDealer = agent.account_type === "dealer";
  const trustKinds: TrustBadgeKind[] = [];
  if (verified) {
    trustKinds.push(isDealer ? "verified_dealer" : "verified_seller");
  }
  trustKinds.push("media_protected");
  const listingCount = listings.length;
  const locationLabel = [agent.residential_city, agent.residential_state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6 px-3 pt-2 pb-8 lg:px-0 lg:pt-8">
      {suspended && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This profile is temporarily suspended. Listings and contact may be
          unavailable.
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <PublicSellerProfileHeader
            agent={agent}
            socialStats={socialStats}
            viewerId={viewer?.id}
          />

          <div className="rounded-[1.5rem] border border-navy/10 bg-gradient-to-b from-white to-[#f4f6fa] p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
              {isDealer ? "Dealership" : "Seller"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-navy/55">
              {locationLabel ? <span>{locationLabel}</span> : null}
              <span>
                {listingCount} live listing{listingCount === 1 ? "" : "s"}
              </span>
              {isResponsiveAgent(agent) ? (
                <span className="text-emerald-700">Responsive seller</span>
              ) : null}
            </div>
            <TrustModule kinds={trustKinds} className="mt-3" />
          </div>

          <PassportReadinessNotice accountType={agent.account_type} />

          <AgencyDeveloperProfileSections agent={agent} listings={listings} />

          <details className="rounded-2xl border border-navy/10 bg-white">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-navy [&::-webkit-details-marker]:hidden">
              Reviews
            </summary>
            <div className="border-t border-navy/8 px-2 pb-2">
              <AgentReviewsSection
                agentId={agentId}
                isAgency={agent.account_type === "agency" || agent.agent_type === "agency"}
              />
            </div>
          </details>

          {showListings && (
            <section className="space-y-6">
              {isDealer ? (
                <h2 className="border-l-[3px] border-gold pl-3 text-lg font-bold tracking-tight text-navy">
                  Showroom inventory
                </h2>
              ) : (
                <h2 className="border-l-[3px] border-gold pl-3 text-lg font-bold tracking-tight text-navy">
                  Listings
                </h2>
              )}
              {vehiclesOn && vehicleListings.length > 0 ? (
                <div>
                  <h3 className="mb-3 px-1 text-sm font-bold text-navy lg:text-base">
                    Vehicles ({vehicleListings.length})
                  </h3>
                  <ul className={BROWSE_GRID_CLASS}>
                    {vehicleListings.map((v) => (
                      <li key={v.id}>
                        <VehicleCard vehicle={v} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {propertyListings.length > 0 ? (
                <div>
                  <h3 className="mb-3 px-1 text-sm font-bold text-navy lg:text-base">
                    Properties ({propertyListings.length})
                  </h3>
                  <PropertyFeed
                    properties={propertyListings}
                    isDemo={isDemo}
                    emptyMessage="No active property listings."
                  />
                </div>
              ) : null}
              {propertyListings.length === 0 &&
              (!vehiclesOn || vehicleListings.length === 0) ? (
                <p className="text-sm text-muted">
                  No active listings from this {isDealer ? "dealer" : "seller"} right
                  now.
                </p>
              ) : null}
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <AgentTrustCard agent={agent} verified={verified} sticky />
        </aside>
      </div>
    </div>
  );
}
