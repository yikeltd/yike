import Image from "next/image";
import type { Profile } from "@/types/database";
import {
  AgencyBadge,
  DeveloperBadge,
  ResponsiveBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import { isResponsiveAgent } from "@/lib/agent-response";
import {
  coverObjectPosition,
  getProfileCoverPositionY,
  getProfileCoverUrl,
} from "@/lib/profile/cover";

export function CompanyProfileHero({
  agent,
  listingCount,
  joinedLabel,
}: {
  agent: Profile;
  listingCount: number;
  joinedLabel: string | null;
}) {
  const isAgency = agent.account_type === "agency" || agent.agent_type === "agency";
  const isDeveloper = agent.account_type === "developer";
  const displayName = agent.company_name?.trim() || agent.full_name?.trim() || "Company";
  const verified = isVerifiedAgent(agent);
  const responsive = isResponsiveAgent(agent);
  const cover = getProfileCoverUrl(agent);
  const coverPositionY = getProfileCoverPositionY(agent);
  const logo = agent.company_logo_url ?? agent.avatar_url;

  if (!isAgency && !isDeveloper) return null;

  return (
    <header className="overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-black/[0.04]">
      <div className="relative h-36 w-full bg-navy sm:h-44">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 640px) 100vw, 720px"
            className="object-cover"
            style={{ objectPosition: coverObjectPosition(coverPositionY) }}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#021428] to-[#010d1f]" />
        )}
        <div className="absolute inset-0 bg-navy/50" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-navy/15"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" aria-hidden />
      </div>
      <div className="relative px-5 pb-5">
        <div className="-mt-10 mb-3 flex items-end gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-surface shadow-md">
            {logo ? (
              <Image src={logo} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-navy">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {isDeveloper ? "Developer" : "Agency"}
            </p>
            <h1 className="text-xl font-bold text-navy drop-shadow-sm sm:text-2xl">{displayName}</h1>
          </div>
        </div>
        {agent.company_bio ? (
          <p className="text-sm text-muted line-clamp-3">{agent.company_bio}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {verified ? <VerifiedBadge /> : null}
          {responsive ? <ResponsiveBadge size="sm" /> : null}
          {isDeveloper && agent.developer_verified ? <DeveloperBadge /> : null}
          {isAgency && (agent.agency_verified || agent.company_verified) ? (
            <AgencyBadge />
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          {listingCount} active {listingCount === 1 ? "listing" : "listings"}
          {joinedLabel ? ` · Joined ${joinedLabel}` : ""}
        </p>
      </div>
    </header>
  );
}
