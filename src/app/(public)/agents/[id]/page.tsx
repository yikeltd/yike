import { getAgentById, getAgentListings } from "@/lib/agents";
import { AgentUnavailable } from "@/components/agent/agent-unavailable";
import { PropertyFeed } from "@/components/property/property-feed";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import { VerifiedBadge } from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import { isDemoProperty } from "@/lib/mock-listings";
import { Shield, AlertTriangle } from "lucide-react";
import { AgentReviewsSection } from "@/components/reviews/agent-reviews-section";
import { getReviewStats, formatReviewSummary } from "@/lib/reviews/queries";

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgentById(id);
  if (!agent) return <AgentUnavailable />;

  const [listings, reviewStats] = await Promise.all([
    getAgentListings(id),
    getReviewStats(id),
  ]);
  const verified = isVerifiedAgent(agent);
  const isDemo = listings.every((p) => isDemoProperty(p.id));
  const isAgency = agent.agent_type === "agency";
  const suspended = agent.profile_status === "suspended";
  const showListings = !suspended && agent.profile_status !== "deleted";

  return (
    <div className="space-y-6 px-3 pt-2 pb-8 lg:px-0 lg:pt-8">
      {suspended && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This profile is temporarily suspended. Listings and contact may be unavailable.
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <header className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04] lg:hidden">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {isAgency ? "Agency profile" : "Agent profile"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-navy">
              {agent.full_name ?? "Agent"}
            </h1>
            {agent.agent_type && (
              <p className="mt-1 text-sm capitalize text-muted">
                {agent.agent_type.replace("_", " ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {verified ? <VerifiedBadge /> : null}
              {reviewStats.total > 0 && (
                <span className="text-xs font-semibold text-navy">
                  {formatReviewSummary(reviewStats)}
                </span>
              )}
              {agent.trust_score > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-navy">
                  <Shield className="h-3 w-3 text-gold" />
                  {agent.trust_score}% trust
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-muted">
              {listings.length} active {listings.length === 1 ? "listing" : "listings"}
            </p>
          </header>

          <AgentReviewsSection agentId={id} isAgency={isAgency} />

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
