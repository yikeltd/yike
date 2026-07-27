"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useStandaloneApp } from "@/hooks/use-standalone-app";
import {
  Bookmark,
  Home,
  List,
  MessageCircle,
  PlusCircle,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { openYikeSupportWhatsApp } from "@/lib/support";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { ProfileCoverHero } from "@/components/profile/profile-cover-hero";
import { SellerCommandCenter } from "@/components/profile/seller-command-center";
import { VerifiedBadge, StatusBadge, SellerTypeBadge } from "@/components/ui/badge";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { ProfileUserActivityStats } from "@/components/profile/profile-user-activity-stats";
import { TrustCenterCard } from "@/components/profile/trust-center-card";
import { accountStatusMessage } from "@/lib/account-control";
import {
  getSellerType,
  profileRoleLabel,
  showAgentBadge,
} from "@/lib/profile-display";
import { getTrustStatusChip, type TrustStatusChip } from "@/lib/verification/trust-center";
import { shouldShowTrustCenterOnDashboard } from "@/lib/verification/seller-dashboard-context";
import { SubscriptionPlanBadge } from "@/components/subscriptions/subscription-plan-badge";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { cn } from "@/lib/utils";

function TrustChipBadge({ chip }: { chip: TrustStatusChip }) {
  const label = chip.label
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const tone =
    chip.tone === "premium"
      ? "border-violet-700/50 from-violet-400 via-violet-500 to-violet-700 text-white shadow-[0_1px_0_rgb(255_255_255/0.28)_inset,0_3px_8px_rgb(139_92_246/0.4)]"
      : chip.tone === "success"
        ? "border-emerald-700/45 from-emerald-300 via-emerald-500 to-emerald-700 text-white shadow-[0_1px_0_rgb(255_255_255/0.3)_inset,0_3px_8px_rgb(16_185_129/0.35)]"
        : chip.tone === "warning"
          ? "border-amber-700/45 from-amber-200 via-amber-400 to-amber-600 text-amber-950 shadow-[0_1px_0_rgb(255_255_255/0.35)_inset,0_3px_8px_rgb(245_158_11/0.35)]"
          : "border-gold-dark/50 from-[#f8e7b4] via-gold to-gold-dark text-navy shadow-[0_1px_0_rgb(255_255_255/0.45)_inset,0_3px_8px_rgb(228_181_71/0.45)]";

  return (
    <span
      role="status"
      className={cn(
        "inline-flex min-h-[2.25rem] items-center gap-1.5 self-start rounded-full border bg-gradient-to-b px-3 py-1.5",
        "text-[11px] font-extrabold tracking-wide",
        "transition-all duration-150 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]",
        tone,
      )}
    >
      <Shield className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}

export function ProfilePageClient({
  profile,
  email,
  canList,
  verified,
  activeCount,
  pending,
  totalListings = 0,
  limit,
  savedCount,
  expiringSoon = 0,
  expiredCount = 0,
  draftCount = 0,
  rentedCount = 0,
  soldCount = 0,
  leadsCount = 0,
  missingPhotosCount = 0,
  incompleteListingsCount = 0,
  lowQualityListingsCount = 0,
  listingHealthScore = null,
  verificationRequestsCount = 0,
  memberSince,
  socialStats = { followersCount: 0, listingLikesCount: 0 },
  subscriptionPlanLabel = null,
  subscriptionExpiresInDays = null,
  profileSaved = false,
  analyticsPreviewData,
}: {
  profile: Profile;
  email: string;
  canList: boolean;
  verified: boolean;
  activeCount: number;
  pending: number;
  totalListings?: number;
  limit: number | null;
  savedCount: number;
  expiringSoon?: number;
  expiredCount?: number;
  draftCount?: number;
  rentedCount?: number;
  soldCount?: number;
  leadsCount?: number;
  missingPhotosCount?: number;
  incompleteListingsCount?: number;
  lowQualityListingsCount?: number;
  listingHealthScore?: number | null;
  verificationRequestsCount?: number;
  memberSince: string;
  socialStats?: ProfileSocialStats;
  subscriptionPlanLabel?: string | null;
  subscriptionExpiresInDays?: number | null;
  foundingMember?: boolean;
  profileSaved?: boolean;
  analyticsPreviewData?: SellerAnalyticsSummary | null;
}) {
  const { isApp } = useStandaloneApp();
  const displayName = profile.full_name ?? profile.username ?? "Your profile";
  const isLister = canList;
  const openSupport = () => openYikeSupportWhatsApp(undefined, { preferSameTab: isApp });
  const roleLabel = profileRoleLabel(profile, verified);
  const sellerType = getSellerType(profile);
  const statusMessage = accountStatusMessage(profile);
  const trustChip = getTrustStatusChip(profile, verified);
  const showTrust = shouldShowTrustCenterOnDashboard(profile, verified, {
    canList: isLister,
    totalListings,
  });

  if (isLister) {
    return (
      <SellerCommandCenter
        profile={profile}
        email={email}
        verified={verified}
        activeCount={activeCount}
        pending={pending}
        totalListings={totalListings}
        limit={limit}
        savedCount={savedCount}
        expiringSoon={expiringSoon}
        expiredCount={expiredCount}
        draftCount={draftCount}
        rentedCount={rentedCount}
        soldCount={soldCount}
        leadsCount={leadsCount}
        missingPhotosCount={missingPhotosCount}
        incompleteListingsCount={incompleteListingsCount}
        lowQualityListingsCount={lowQualityListingsCount}
        listingHealthScore={listingHealthScore}
        memberSince={memberSince}
        socialStats={socialStats}
        subscriptionPlanLabel={subscriptionPlanLabel}
        subscriptionExpiresInDays={subscriptionExpiresInDays}
        profileSaved={profileSaved}
        analyticsPreviewData={analyticsPreviewData}
      />
    );
  }

  return (
    <div className="dashboard-fade-in space-y-4 pb-6">
      {profileSaved ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-950"
        >
          Profile saved.
        </p>
      ) : null}

      <ProfileCoverHero
        profile={profile}
        email={email}
        displayName={displayName}
        memberSince={memberSince}
        socialStats={socialStats}
        showSocialStats
        badges={
          <>
            {showAgentBadge(profile, verified) ? <VerifiedBadge /> : null}
            <SubscriptionPlanBadge
              planCode={profile.subscription_plan_code as SubscriptionPlanCode | null}
              size="md"
            />
            {sellerType ? <SellerTypeBadge type={sellerType} /> : null}
            {roleLabel && !sellerType ? (
              <span className="rounded-full border border-navy/10 bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy">
                {roleLabel}
              </span>
            ) : null}
            {profile.verification_status !== "not_started" &&
              !verified &&
              !showTrust && (
                <StatusBadge status={profile.verification_status} />
              )}
          </>
        }
        trustBadge={<TrustChipBadge chip={trustChip} />}
        verifiedLevel={trustChip.label.split(/\s+/)[0] ?? "Basic"}
      />

      {statusMessage ? (
        <div
          className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-3.5 py-2.5 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">{statusMessage}</p>
        </div>
      ) : null}

      {showTrust ? (
        <DashboardSection title="Profile & verification">
          <TrustCenterCard profile={profile} verified={verified} />
        </DashboardSection>
      ) : null}

      <DashboardSection title="Your activity">
        <ProfileUserActivityStats
          savedCount={savedCount}
          verificationRequestsCount={verificationRequestsCount}
        />
      </DashboardSection>

      <DashboardSection title="Quick actions">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
          <Link
            href="/agent/become"
            prefetch
            className="dashboard-primary-cta pressable col-span-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold to-gold-dark px-3 text-sm font-semibold text-navy shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float hover:brightness-[1.03] active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            List on Yike
          </Link>
          <QuickAction href="/saved" icon={Bookmark} label="Saved" />
          <QuickAction href="/search" icon={Home} label="Browse" />
          <QuickAction
            href="/property-verification"
            icon={ShieldCheck}
            label="Verify"
          />
          <QuickAction icon={MessageCircle} label="Help" onClick={openSupport} />
        </div>
      </DashboardSection>

      <ProfileAccountActions email={email} canList={false} />
    </div>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        {title}
      </h2>
      {children}
    </section>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  onClick,
  className: extraClassName,
}: {
  href?: string;
  icon: typeof List;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  const className = cn(
    "dashboard-live-card pressable group flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-navy/[0.05] bg-navy/[0.02] p-2 text-left sm:gap-2 sm:p-3",
    "hover:border-navy/10 hover:bg-white",
    extraClassName,
  );

  const content = (
    <>
      <span className="dashboard-live-card__icon flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-navy shadow-sm sm:h-7 sm:w-7">
        <Icon
          className="h-3 w-3 transition-transform duration-200 group-hover:scale-110 sm:h-3.5 sm:w-3.5"
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
      <span className="w-full truncate text-[9px] font-semibold leading-tight text-navy transition-colors duration-200 group-hover:text-navy sm:text-xs">
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} data-tone="neutral" className={className}>
        {content}
      </button>
    );
  }

  if (!href) {
    return null;
  }

  return (
    <Link href={href} prefetch data-tone="neutral" className={className}>
      {content}
    </Link>
  );
}
