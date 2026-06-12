"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useStandaloneApp } from "@/hooks/use-standalone-app";
import {
  Bell,
  Bookmark,
  List,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { openYikeSupportWhatsApp } from "@/lib/support";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { ProfileCoverHero } from "@/components/profile/profile-cover-hero";
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
import { getTrustStatusChip } from "@/lib/verification/trust-center";
import { shouldShowTrustCenterOnDashboard } from "@/lib/verification/seller-dashboard-context";
import { SellerAnalyticsPanel } from "@/components/subscriptions/seller-analytics-panel";
import { PlansUpgradeCard } from "@/components/subscriptions/plans-upgrade-card";
import { SubscriptionPlanBadge } from "@/components/subscriptions/subscription-plan-badge";
import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { cn } from "@/lib/utils";

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
  leadsCount = 0,
  verificationRequestsCount = 0,
  memberSince,
  socialStats = { followersCount: 0, listingLikesCount: 0 },
  subscriptionPlanLabel = null,
  subscriptionExpiresInDays = null,
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
  leadsCount?: number;
  verificationRequestsCount?: number;
  memberSince: string;
  socialStats?: ProfileSocialStats;
  subscriptionPlanLabel?: string | null;
  subscriptionExpiresInDays?: number | null;
  foundingMember?: boolean;
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
  const showCompanyQuickAction =
    profile.account_type === "agency" ||
    profile.account_type === "developer" ||
    Boolean(profile.company_name);

  return (
    <div className="space-y-5 pb-4">
      <ProfileCoverHero
        profile={profile}
        email={email}
        displayName={displayName}
        memberSince={memberSince}
        socialStats={socialStats}
        showSocialStats={!isLister}
        badges={
          <>
            {showAgentBadge(profile, verified) ? <VerifiedBadge /> : null}
            <SubscriptionPlanBadge
              planCode={profile.subscription_plan_code as SubscriptionPlanCode | null}
              size="md"
            />
            {sellerType ? <SellerTypeBadge type={sellerType} /> : null}
            {roleLabel && !sellerType ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                {roleLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {trustChip.label}
            </span>
            {profile.verification_status !== "not_started" &&
              !verified &&
              isLister &&
              !showTrust && (
                <StatusBadge status={profile.verification_status} />
              )}
          </>
        }
      />

      {statusMessage ? (
        <div
          className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">{statusMessage}</p>
        </div>
      ) : null}

      {isLister ? (
        <>
          {showTrust ? (
            <DashboardSection title="Profile & verification">
              <TrustCenterCard profile={profile} verified={verified} />
            </DashboardSection>
          ) : null}

          <DashboardSection title="Plan & listings">
            <PlansUpgradeCard
              planLabel={subscriptionPlanLabel}
              activeCount={activeCount}
              limit={limit}
              expiresInDays={subscriptionExpiresInDays}
            />
          </DashboardSection>

          <DashboardSection title="Performance">
            <SellerAnalyticsPanel
              activeCount={activeCount}
              pending={pending}
              leadsCount={leadsCount}
              savedCount={savedCount}
            />
            {(expiringSoon > 0 || expiredCount > 0) && (
              <p className="px-0.5 text-xs text-muted">
                {expiringSoon > 0 ? `${expiringSoon} listing${expiringSoon === 1 ? "" : "s"} expiring soon. ` : ""}
                {expiredCount > 0 ? `${expiredCount} expired.` : ""}
                {" "}
                <Link href="/agent/listings" className="font-semibold text-navy">
                  Manage listings
                </Link>
              </p>
            )}
          </DashboardSection>

          <DashboardSection title="Quick actions">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/agent/listings/new"
                prefetch
                className="pressable col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3.5 text-sm font-bold text-white shadow-float"
              >
                <PlusCircle className="h-5 w-5" />
                List a property
              </Link>
              <QuickAction href="/agent/listings" icon={List} label="My listings" />
              <QuickAction href="/agent/leads" icon={MessageCircle} label="Leads" />
              <QuickAction href="/agent/notifications" icon={Bell} label="Notifications" />
              <QuickAction href="/agent/followers" icon={Users} label="Followers" />
              <QuickAction
                icon={MessageCircle}
                label="Get Help"
                subtitle="Contact support"
                onClick={openSupport}
                className={showCompanyQuickAction ? undefined : "col-span-2"}
              />
              {showCompanyQuickAction ? (
                <QuickAction href="/agent/company" icon={ShieldCheck} label="Company" />
              ) : null}
            </div>
          </DashboardSection>
        </>
      ) : (
        <>
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
            <div className="grid grid-cols-2 gap-2">
              <QuickAction href="/agent/become" icon={PlusCircle} label="List a Property" />
              <QuickAction href="/saved" icon={Bookmark} label="Saved Homes" />
              <QuickAction
                href="/property-verification"
                icon={ShieldCheck}
                label="Verify Property"
              />
              <QuickAction
                icon={MessageCircle}
                label="Get Help"
                subtitle="Contact support"
                onClick={openSupport}
              />
            </div>
          </DashboardSection>
        </>
      )}

      <ProfileAccountActions email={email} canList={isLister} onGetHelp={openSupport} />
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
      <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-navy/70">
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
  subtitle,
  onClick,
  className: extraClassName,
}: {
  href?: string;
  icon: typeof List;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}) {
  const className = cn(
    "pressable flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-elevated px-3 py-3.5 text-center shadow-float",
    extraClassName
  );

  const content = (
    <>
      <Icon className="h-5 w-5 text-navy" aria-hidden />
      <span className="text-xs font-semibold text-navy">{label}</span>
      {subtitle ? (
        <span className="text-[10px] font-medium leading-tight text-muted">{subtitle}</span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} prefetch className={className}>
      {content}
    </Link>
  );
}
