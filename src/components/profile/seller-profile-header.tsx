"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
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
  trustBadge?: ReactNode;
  /** Short level shown in stats (e.g. BASIC) — display only */
  verifiedLevel?: string | null;
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
  trustBadge,
  verifiedLevel,
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
  const level =
    verifiedLevel?.trim() ||
    (trustBadge ? "Basic" : null);

  return (
    <section
      className={cn(
        "dashboard-fade-in relative overflow-hidden rounded-[28px] sm:rounded-[32px]",
        "border border-gold/40 bg-navy",
        "shadow-[0_16px_40px_color-mix(in_srgb,var(--navy)_35%,transparent)]"
      )}
    >
      {/* ZONE A — Cover / background image only (no avatar overlay) */}
      <div className="relative isolate border-b border-gold/25">
        <div className="relative h-36 w-full bg-navy-mid sm:h-40 lg:h-48">
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
            <div className="absolute inset-0 bg-gradient-to-br from-navy-light via-navy-mid to-navy" />
          )}
        </div>

        {coverControls ? (
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
            {coverControls}
          </div>
        ) : null}
      </div>

      {/* ZONE B — Avatar + identity beside each other, fully below cover */}
      <div className="profile-id relative bg-gradient-to-b from-navy via-navy to-navy-mid px-3.5 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5 lg:px-6 lg:pb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={cn(
              "shrink-0",
              "[&_#profile-photo_.rounded-full]:!border-2",
              "[&_#profile-photo_.rounded-full]:!border-gold",
              "[&_#profile-photo_.rounded-full]:!shadow-[0_0_0_1px_color-mix(in_srgb,var(--gold)_40%,transparent),0_10px_24px_color-mix(in_srgb,var(--navy-dark)_45%,transparent)]",
              "[&_#profile-photo_.rounded-full]:!ring-0",
              "[&_#profile-photo_.rounded-full]:hover:!scale-100",
              "[&_#profile-photo_button]:!border-[1.5px]",
              "[&_#profile-photo_button]:!border-gold",
              "[&_#profile-photo_button]:!bg-navy",
              "[&_#profile-photo_button]:!bg-none",
              "[&_#profile-photo_button]:!text-gold",
              "[&_#profile-photo_button]:!shadow-[0_4px_14px_color-mix(in_srgb,var(--navy-dark)_40%,transparent)]",
              "[&_#profile-photo_button]:hover:!scale-100"
            )}
          >
            {avatarSlot ?? (
              <AvatarCircle displayName={displayName} logo={logo} size="lg" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 space-y-1">
              {subtitle ? (
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                  {subtitle}
                </p>
              ) : null}
              <h1 className="font-[family-name:var(--font-display)] text-[1.25rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-[1.4rem] lg:text-[1.55rem]">
                {displayName}
              </h1>
              {username ? (
                <p className="font-[family-name:var(--font-display)] text-[12px] font-medium text-gold">
                  <span className="text-gold-light">@</span>
                  {username}
                </p>
              ) : null}

              {(trustBadge || badges) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  {trustBadge ? (
                    <div
                      className={cn(
                        "inline-flex",
                        "[&_[role=status]]:!min-h-0",
                        "[&_[role=status]]:!rounded-full",
                        "[&_[role=status]]:!border",
                        "[&_[role=status]]:!border-gold/55",
                        "[&_[role=status]]:![background-image:none]",
                        "[&_[role=status]]:!bg-transparent",
                        "[&_[role=status]]:!px-2.5",
                        "[&_[role=status]]:!py-1",
                        "[&_[role=status]]:!text-[10px]",
                        "[&_[role=status]]:!font-semibold",
                        "[&_[role=status]]:!tracking-[0.04em]",
                        "[&_[role=status]]:!text-white",
                        "[&_[role=status]]:!shadow-none",
                        "[&_[role=status]]:hover:!-translate-y-0",
                        "[&_[role=status]]:hover:!brightness-100",
                        "[&_[role=status]]:active:!scale-100",
                        "[&_[role=status]_svg]:!text-gold"
                      )}
                    >
                      {trustBadge}
                    </div>
                  ) : null}
                  {badges ? (
                    <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
                      {badges}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-start gap-2">
              {actions ? <div>{actions}</div> : null}
              {memberSince ? (
                <div className="flex flex-col items-end border-l border-gold/25 pl-2.5 sm:pl-4">
                  <CalendarDays
                    className="mb-0.5 h-3 w-3 text-gold sm:mb-1 sm:h-3.5 sm:w-3.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-gold sm:text-[9px] sm:tracking-[0.14em]">
                    Joined
                  </span>
                  <span className="mt-0.5 text-[11px] font-semibold tracking-tight text-white sm:text-sm">
                    {memberSince}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-5">
          <ProfileSocialStats
            stats={stats}
            showLinks={showSocialLinks}
            variant="executive"
            verifiedLevel={level}
          />
        </div>

        {bio ? (
          <p className="mt-3.5 max-w-xl text-xs leading-relaxed text-white/60 line-clamp-2 sm:text-sm sm:line-clamp-3">
            {bio}
          </p>
        ) : null}
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
  const dim = size === "xl" ? "h-24 w-24" : "h-20 w-20";
  const text = size === "xl" ? "text-2xl" : "text-xl";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border-2 border-gold bg-navy-mid",
        "shadow-[0_0_0_1px_color-mix(in_srgb,var(--gold)_40%,transparent),0_10px_24px_color-mix(in_srgb,var(--navy-dark)_45%,transparent)]",
        dim
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt={displayName}
          fill
          sizes={size === "xl" ? "96px" : "80px"}
          className="object-cover"
          decoding="async"
          unoptimized
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-light to-navy font-bold text-white",
            text
          )}
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
