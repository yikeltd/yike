import type { Profile } from "@/types/database";
import { SellerProfileHeader } from "@/components/profile/seller-profile-header";
import { FollowButton } from "@/components/social/follow-button";
import type { ProfileSocialStats } from "@/lib/social/types";
import { getSellerType, profileTypeHeading } from "@/lib/profile-display";
import {
  AgencyBadge,
  DeveloperBadge,
  ResponsiveBadge,
  SellerTypeBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import { isResponsiveAgent } from "@/lib/agent-response";

export function PublicSellerProfileHeader({
  agent,
  socialStats,
  viewerId,
}: {
  agent: Profile;
  socialStats: ProfileSocialStats;
  viewerId?: string | null;
}) {
  const isAgency = agent.account_type === "agency" || agent.agent_type === "agency";
  const isDeveloper = agent.account_type === "developer";
  const sellerType = getSellerType(agent);
  const displayName = agent.company_name?.trim() || agent.full_name?.trim() || "Agent";
  const verified = isVerifiedAgent(agent);
  const responsive = isResponsiveAgent(agent);
  const subtitle = sellerType
    ? profileTypeHeading(sellerType)
    : isDeveloper
      ? "Developer profile"
      : isAgency
        ? "Agency profile"
        : "Agent profile";

  const joinedLabel = agent.created_at
    ? new Date(agent.created_at).toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <SellerProfileHeader
      displayName={displayName}
      username={agent.username}
      subtitle={subtitle}
      bio={agent.company_bio}
      avatarUrl={agent.company_logo_url ?? agent.avatar_url}
      coverProfile={agent}
      socialStats={socialStats}
      memberSince={joinedLabel}
      badges={
        <>
          {sellerType ? <SellerTypeBadge type={sellerType} /> : null}
          {verified ? <VerifiedBadge /> : null}
          {responsive ? <ResponsiveBadge size="sm" /> : null}
          {isDeveloper && agent.developer_verified ? <DeveloperBadge /> : null}
          {isAgency && (agent.agency_verified || agent.company_verified) ? (
            <AgencyBadge />
          ) : null}
        </>
      }
      actions={
        viewerId && viewerId !== agent.id ? <FollowButton userId={agent.id} /> : null
      }
    />
  );
}
