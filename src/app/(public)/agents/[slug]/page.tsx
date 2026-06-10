import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  resolveAgentRoute,
  getAgentListings,
} from "@/lib/agents";
import { AgentUnavailable } from "@/components/agent/agent-unavailable";
import { PropertyFeed } from "@/components/property/property-feed";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import {
  VerifiedBadge,
  ResponsiveBadge,
  DeveloperBadge,
  AgencyBadge,
  SellerTypeBadge,
} from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import { isDemoProperty } from "@/lib/mock-listings";
import { AlertTriangle } from "lucide-react";
import { AgentReviewsSection } from "@/components/reviews/agent-reviews-section";
import { CompanyProfileHero } from "@/components/agent/company-profile-hero";
import { getReviewStats, formatReviewSummary } from "@/lib/reviews/queries";
import { isResponsiveAgent } from "@/lib/agent-response";
import { getSellerType, profileTypeHeading } from "@/lib/profile-display";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { agent, redirectTo } = await resolveAgentRoute(slug);
  if (redirectTo || !agent) return { title: "Agent | Yike" };
  const name = agent.company_name?.trim() || agent.full_name?.trim() || "Agent";
  return {
    title: `${name} | Yike`,
    description: `Browse verified property listings from ${name} on Yike.ng`,
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
  const [listings, reviewStats] = await Promise.all([
    getAgentListings(agentId),
    getReviewStats(agentId),
  ]);
  const verified = isVerifiedAgent(agent);
  const responsive = isResponsiveAgent(agent);
  const isDemo = listings.every((p) => isDemoProperty(p.id));
  const isAgency =
    agent.account_type === "agency" || agent.agent_type === "agency";
  const isDeveloper = agent.account_type === "developer";
  const sellerType = getSellerType(agent);
  const displayName =
    agent.company_name?.trim() || agent.full_name?.trim() || "Agent";
  const suspended = agent.profile_status === "suspended";
  const showListings = !suspended && agent.profile_status !== "deleted";
  const joinedLabel = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric",
      })
    : null;

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
          {(isAgency || isDeveloper) && (
            <CompanyProfileHero
              agent={agent}
              listingCount={listings.length}
              joinedLabel={joinedLabel}
            />
          )}
          <header
            className={`rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04] lg:hidden ${
              isAgency || isDeveloper ? "hidden" : ""
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {sellerType
                ? profileTypeHeading(sellerType)
                : isAgency
                  ? "Agency profile"
                  : isDeveloper
                    ? "Developer profile"
                    : "Agent profile"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-navy">{displayName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sellerType ? <SellerTypeBadge type={sellerType} /> : null}
              {verified ? <VerifiedBadge /> : null}
              {responsive ? <ResponsiveBadge size="sm" /> : null}
              {isDeveloper && agent.developer_verified ? (
                <DeveloperBadge />
              ) : null}
              {isAgency && agent.agency_verified ? <AgencyBadge /> : null}
              {reviewStats.total > 0 && (
                <span className="text-xs font-semibold text-navy">
                  {formatReviewSummary(reviewStats)}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-muted">
              {listings.length} active{" "}
              {listings.length === 1 ? "listing" : "listings"}
              {joinedLabel ? ` · Joined ${joinedLabel}` : ""}
            </p>
          </header>

          <AgentReviewsSection agentId={agentId} isAgency={isAgency} />

          {showListings && (
            <section>
              <h2 className="mb-3 px-1 text-sm font-bold text-navy lg:text-base">
                Active listings
              </h2>
              <PropertyFeed
                properties={listings}
                isDemo={isDemo}
                emptyMessage="No active listings from this agent right now."
              />
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
