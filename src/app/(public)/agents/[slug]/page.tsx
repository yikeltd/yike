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
import { getSession } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { getProfileSocialStats } from "@/lib/social/stats";

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

          <AgentReviewsSection
            agentId={agentId}
            isAgency={agent.account_type === "agency" || agent.agent_type === "agency"}
          />

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
