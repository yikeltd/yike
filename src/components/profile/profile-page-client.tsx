"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronRight,
  Heart,
  List,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { ProfileCoverHero } from "@/components/profile/profile-cover-hero";
import { VerifiedBadge, StatusBadge, SellerTypeBadge } from "@/components/ui/badge";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { ProfileUserActivityStats } from "@/components/profile/profile-user-activity-stats";
import { TrustCenterCard } from "@/components/profile/trust-center-card";
import { accountStatusMessage } from "@/lib/account-control";
import { cn } from "@/lib/utils";
import {
  formatListingSlots,
  getSellerType,
  profileRoleLabel,
  showAgentBadge,
} from "@/lib/profile-display";
import {
  getTrustStatusChip,
  shouldShowTrustCenter,
} from "@/lib/verification/trust-center";

export function ProfilePageClient({
  profile,
  email,
  canList,
  verified,
  activeCount,
  pending,
  limit,
  savedCount,
  expiringSoon = 0,
  expiredCount = 0,
  leadsCount = 0,
  verificationRequestsCount = 0,
  memberSince,
}: {
  profile: Profile;
  email: string;
  canList: boolean;
  verified: boolean;
  activeCount: number;
  pending: number;
  limit: number | null;
  savedCount: number;
  expiringSoon?: number;
  expiredCount?: number;
  leadsCount?: number;
  verificationRequestsCount?: number;
  memberSince: string;
}) {
  const displayName = profile.full_name ?? profile.username ?? "Your profile";
  const isLister = canList;
  const roleLabel = profileRoleLabel(profile, verified);
  const sellerType = getSellerType(profile);
  const statusMessage = accountStatusMessage(profile);
  const trustChip = getTrustStatusChip(profile, verified);
  const showTrust = shouldShowTrustCenter(profile, verified);
  const slotsLabel = formatListingSlots(activeCount, limit, verified);

  return (
    <div className="space-y-4 pb-4">
      <ProfileCoverHero
        profile={profile}
        email={email}
        displayName={displayName}
        memberSince={memberSince}
        badges={
          <>
            {showAgentBadge(profile, verified) ? <VerifiedBadge /> : null}
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
          <Link href="/agent/profile-setup" className="mt-1 inline-block text-xs font-semibold text-navy">
            Complete profile →
          </Link>
        </div>
      ) : null}

      {isLister ? (
        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={Heart} label="Saved homes" value={String(savedCount)} href="/saved" />
          <StatCard
            icon={List}
            label="Active listings"
            value={String(activeCount)}
            href="/agent/listings"
          />
          <StatCard icon={ShieldCheck} label="Pending review" value={String(pending)} href="/agent/listings" />
          <StatCard
            icon={MessageCircle}
            label="Inquiries"
            value={leadsCount > 0 ? String(leadsCount) : "0"}
            href="/agent/leads"
          />
          {expiringSoon > 0 && (
            <StatCard
              icon={Sparkles}
              label="Expiring soon"
              value={String(expiringSoon)}
              href="/agent/listings"
            />
          )}
          {expiredCount > 0 && (
            <StatCard
              icon={List}
              label="Expired"
              value={String(expiredCount)}
              href="/agent/listings"
            />
          )}
          <StatCard
            icon={List}
            label="Listing slots"
            value={slotsLabel}
            href="/agent/listings"
            smallValue
            className="col-span-2"
          />
        </section>
      ) : (
        <ProfileUserActivityStats
          savedCount={savedCount}
          verificationRequestsCount={verificationRequestsCount}
        />
      )}

      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Quick actions</p>
        {isLister ? (
          <>
            <ActionLink
              href="/agent/listings/new"
              icon={PlusCircle}
              title="List a property"
              subtitle="Post a new home on Yike"
              primary
            />
            <ActionLink href="/agent/listings" icon={List} title="My listings" />
            {expiringSoon > 0 && (
              <ActionLink
                href="/agent/listings"
                icon={Sparkles}
                title={`Renew ${expiringSoon} expiring`}
                accent
              />
            )}
            <ActionLink href="/agent/leads" icon={MessageCircle} title="Inquiries & leads" />
            <ActionLink href="/agent/notifications" icon={Bell} title="Notifications" />
            <ActionLink
              href="/agent/verification"
              icon={ShieldCheck}
              title="Verification center"
            />
            {(profile.account_type === "agency" ||
              profile.account_type === "developer" ||
              profile.company_name) && (
              <ActionLink href="/agent/company" icon={ShieldCheck} title="Company profile" />
            )}
          </>
        ) : (
          <>
            <ActionLink href="/saved" icon={Bookmark} title="Saved homes" />
            <ActionLink href="/search" icon={Search} title="Find a home" />
            <ActionLink
              href="/property-verification"
              icon={ShieldCheck}
              title="Verify a property"
            />
            <ActionLink
              href="/agent/become"
              icon={BadgeCheck}
              title="List a property"
              subtitle="Unlock listing on Yike"
              accent
            />
          </>
        )}
      </section>

      {showTrust ? (
        <TrustCenterCard profile={profile} verified={verified} />
      ) : null}

      <ProfileAccountActions email={email} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  smallValue,
  className,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  href: string;
  smallValue?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "pressable rounded-2xl border border-border bg-elevated p-4 shadow-float",
        className
      )}
    >
      <Icon className="h-4 w-4 text-gold-dark" />
      <p
        className={cn(
          "mt-3 font-bold text-navy",
          smallValue ? "text-sm leading-snug" : "text-xl"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </Link>
  );
}

function ActionLink({
  href,
  icon: Icon,
  title,
  subtitle,
  primary,
  accent,
}: {
  href: string;
  icon: typeof PlusCircle;
  title: string;
  subtitle?: string;
  primary?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "pressable flex items-center gap-3 rounded-2xl px-4 py-3.5",
        primary && "bg-primary text-white",
        accent && !primary && "border border-gold/35 bg-gold/10 text-navy",
        !primary && !accent && "border border-border bg-elevated"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", primary ? "text-white" : "text-gold-dark")} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold">{title}</span>
        {subtitle ? (
          <p className={cn("text-xs", primary ? "text-white/75" : "text-muted")}>{subtitle}</p>
        ) : null}
      </div>
      <ChevronRight className={cn("h-4 w-4 shrink-0", primary ? "text-white/60" : "text-muted")} />
    </Link>
  );
}
