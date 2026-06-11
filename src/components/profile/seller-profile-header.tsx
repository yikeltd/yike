"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import {
  coverObjectPosition,
  getProfileCoverPositionY,
  getProfileCoverUrl,
} from "@/lib/profile/cover";
import { coverDisplayUrl, avatarDisplayUrl } from "@/lib/profile/media-urls";
import { useMobileCover } from "@/hooks/use-mobile-cover";
import { ProfileSocialStats } from "@/components/profile/profile-social-stats";
import type { ProfileSocialStats as SocialStats } from "@/lib/social/types";
import { cn } from "@/lib/utils";

type SellerProfileHeaderProps = {
  displayName: string;
  username?: string | null;
  subtitle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverProfile?: {
    cover_url?: string | null;
    company_cover_url?: string | null;
    cover_position_y?: number | null;
    avatar_url?: string | null;
    company_logo_url?: string | null;
  };
  socialStats?: SocialStats;
  badges?: ReactNode;
  actions?: ReactNode;
  avatarSlot?: ReactNode;
  coverControls?: ReactNode;
  showSocialLinks?: boolean;
  memberSince?: string | null;
};

export function SellerProfileHeader({
  displayName,
  username,
  subtitle,
  bio,
  avatarUrl,
  coverProfile,
  socialStats,
  badges,
  actions,
  avatarSlot,
  coverControls,
  showSocialLinks = false,
  memberSince,
}: SellerProfileHeaderProps) {
  const mobileCover = useMobileCover();
  const cover = coverProfile ? getProfileCoverUrl(coverProfile) : null;
  const coverPositionY = coverProfile
    ? getProfileCoverPositionY({
        cover_position_y: coverProfile.cover_position_y ?? undefined,
      })
    : 50;
  const coverSrc = cover
    ? coverDisplayUrl(cover, mobileCover ? "medium" : "large")
    : null;
  const logo =
    avatarUrl ??
    (coverProfile
      ? avatarDisplayUrl(coverProfile.company_logo_url ?? coverProfile.avatar_url)
      : null);

  const stats = socialStats ?? { followersCount: 0, listingLikesCount: 0 };

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-float ring-1 ring-black/[0.04] lg:rounded-2xl">
      <div className="relative">
        <div className="relative h-40 w-full bg-navy sm:h-44 lg:h-52">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 767px) 100vw, 960px"
              className="object-cover"
              style={{ objectPosition: coverObjectPosition(coverPositionY) }}
              decoding="async"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#021428] to-[#010d1f]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" aria-hidden />
        </div>

        {coverControls ? (
          <div className="absolute right-3 top-3 z-10">{coverControls}</div>
        ) : null}
      </div>

      {/* Mobile: centered stack */}
      <div className="relative px-5 pb-5 lg:hidden">
        <div className="-mt-14 flex flex-col items-center text-center">
          <div className="relative">
            {avatarSlot ?? (
              <AvatarCircle displayName={displayName} logo={logo} size="lg" />
            )}
          </div>
          {subtitle ? (
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
              {subtitle}
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{displayName}</h1>
          {username ? <p className="mt-0.5 text-sm text-muted">@{username}</p> : null}
          <ProfileSocialStats stats={stats} centered className="mt-2" showLinks={showSocialLinks} />
          {memberSince ? (
            <p className="mt-1 text-xs text-muted">Member since {memberSince}</p>
          ) : null}
          {badges ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">{badges}</div>
          ) : null}
          {actions ? <div className="mt-4 flex justify-center">{actions}</div> : null}
          {bio ? (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{bio}</p>
          ) : null}
        </div>
      </div>

      {/* Desktop: breathing room below cover before profile row */}
      <div className="hidden lg:block lg:h-2 xl:h-3 2xl:h-3" aria-hidden />

      {/* Desktop: left overlap — avatar overlaps cover; details sit in white area below */}
      <div className="relative hidden px-6 pb-6 lg:block lg:px-8 xl:px-8 2xl:px-10">
        <div className="flex items-start gap-5 xl:gap-6">
          <div className="-mt-16 shrink-0 lg:-mt-16 xl:-mt-16 2xl:-mt-16">
            {avatarSlot ?? (
              <AvatarCircle displayName={displayName} logo={logo} size="xl" />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-6 lg:pt-7 xl:pt-8 2xl:pt-9">
            {subtitle ? (
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{subtitle}</p>
            ) : null}
            <div className="flex flex-wrap items-start justify-between gap-3 xl:gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-navy xl:text-3xl">
                  {displayName}
                </h1>
                {username ? <p className="mt-0.5 text-sm text-muted">@{username}</p> : null}
                <ProfileSocialStats stats={stats} className="mt-1.5" showLinks={showSocialLinks} />
                {memberSince ? (
                  <p className="mt-1 text-xs text-muted">Member since {memberSince}</p>
                ) : null}
              </div>
              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            {badges ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>
            ) : null}
            {bio ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted line-clamp-3">{bio}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarCircle({
  displayName,
  logo,
  size,
}: {
  displayName: string;
  logo: string | null;
  size: "lg" | "xl";
}) {
  const dim = size === "xl" ? "h-28 w-28" : "h-24 w-24";
  const text = size === "xl" ? "text-3xl" : "text-2xl";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border-4 border-white bg-surface shadow-float-lg ring-2 ring-[#1877F2]/80",
        dim
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt={displayName}
          fill
          sizes={size === "xl" ? "112px" : "96px"}
          className="object-cover"
          decoding="async"
          unoptimized
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-bold text-navy",
            text
          )}
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
