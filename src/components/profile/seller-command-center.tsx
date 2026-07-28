"use client";

import Link from "next/link";
import {
  Heart,
  List,
  MessageCircle,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { SellerAnalyticsPanel } from "@/components/subscriptions/seller-analytics-panel";
import { PlansUpgradeCard } from "@/components/subscriptions/plans-upgrade-card";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { cn } from "@/lib/utils";

type Props = {
  profile: Profile;
  email: string;
  verified: boolean;
  activeCount: number;
  pending: number;
  totalListings: number;
  limit: number | null;
  savedCount: number;
  expiringSoon: number;
  expiredCount: number;
  draftCount?: number;
  rentedCount: number;
  soldCount: number;
  leadsCount: number;
  missingPhotosCount?: number;
  incompleteListingsCount?: number;
  lowQualityListingsCount?: number;
  listingHealthScore?: number | null;
  memberSince: string;
  socialStats: ProfileSocialStats;
  subscriptionPlanLabel: string | null;
  subscriptionExpiresInDays: number | null;
  profileSaved: boolean;
  analyticsPreviewData?: SellerAnalyticsSummary | null;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-navy/40">
      {children}
    </h2>
  );
}

function ActionTile({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: typeof List;
  label: string;
  count?: number | string | null;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="pressable group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-navy/[0.06] bg-white p-4 text-center shadow-[0_4px_18px_-14px_rgba(3,27,78,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/10 hover:shadow-[0_10px_28px_-16px_rgba(3,27,78,0.35)]"
    >
      <div className="relative">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/[0.04] text-navy transition-colors group-hover:bg-gold/20">
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </span>
        {count !== undefined && count !== null && (
          <span className="absolute -top-1.5 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-black text-navy shadow-xs ring-2 ring-white">
            {count}
          </span>
        )}
      </div>
      <span className="text-xs font-bold text-navy">{label}</span>
    </Link>
  );
}

/**
 * Seller Business Command Center — Surgical Clean UI (Phase 1.9Polish)
 */
export function SellerCommandCenter(props: Props) {
  const {
    profile,
    email,
    verified,
    activeCount,
    pending,
    totalListings,
    limit,
    savedCount,
    expiredCount,
    draftCount = 0,
    rentedCount,
    soldCount,
    leadsCount,
    memberSince,
    socialStats,
    subscriptionPlanLabel,
    subscriptionExpiresInDays,
    profileSaved,
    analyticsPreviewData,
  } = props;

  const firstName =
    profile.full_name?.trim().split(/\s+/)[0] ||
    profile.username ||
    profile.company_name?.trim() ||
    "Seller";

  const verificationStatusText = verified
    ? "Verified Seller"
    : profile.verification_status === "pending"
    ? "Verification Pending"
    : "Unverified Seller";

  const overview = [
    { label: "Active", value: activeCount, href: "/agent/listings" },
    { label: "Pending", value: pending, href: "/agent/listings" },
    { label: "Sold", value: soldCount, href: "/agent/listings" },
    { label: "Rented", value: rentedCount, href: "/agent/listings" },
    { label: "Expired", value: expiredCount, href: "/agent/listings" },
    { label: "Drafts", value: draftCount, href: "/agent/listings/new" },
  ];

  return (
    <div className="dashboard-fade-in space-y-6 pb-8">
      {profileSaved && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950"
        >
          Profile saved.
        </p>
      )}

      {/* 1. Hero Banner with Background Image & Dark Brand Overlay */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-navy/10 shadow-[0_20px_50px_-28px_rgba(3,27,78,0.65)]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${PAGE_IMAGERY.list})` }}
          aria-hidden
        />
        {/* Dark Brand Overlay */}
        <div className="absolute inset-0 bg-navy/85 backdrop-blur-xs" aria-hidden />

        <div className="relative z-10 p-6 text-white lg:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Profile Avatar & Info Stack */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0 self-start sm:self-auto">
                <AvatarUpload
                  userId={profile.id}
                  email={email}
                  name={profile.full_name}
                  username={profile.username}
                  avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                  size="lg"
                  className="!h-16 !w-16 rounded-2xl border-2 border-white/25 shadow-float ring-2 ring-gold/40 sm:!h-20 sm:!w-20"
                />
              </div>

              <div className="space-y-2 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Welcome back, {firstName}
                </h1>

                {/* Compact Stat Chips Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/90">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium backdrop-blur-xs">
                    Member since {memberSince}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold backdrop-blur-xs",
                      verified
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    )}
                  >
                    {verified ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    {verificationStatusText}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium backdrop-blur-xs">
                    <Users className="h-3.5 w-3.5 text-gold" />
                    {socialStats.followersCount} Followers
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium backdrop-blur-xs">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    {socialStats.listingLikesCount ?? 0} Likes
                  </span>
                </div>
              </div>
            </div>

            {/* Hero CTAs Row */}
            <div className="flex items-center gap-3 pt-2 md:pt-0">
              <Link
                href="/agent/listings/choose"
                prefetch
                className="pressable inline-flex h-11 items-center gap-2 rounded-full bg-gold px-6 text-xs font-bold text-navy shadow-[0_4px_16px_rgba(228,181,71,0.4)] hover:bg-gold-light"
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                <span>New Listing</span>
              </Link>

              <Link
                href="/agent/edit-profile"
                prefetch
                className="pressable inline-flex h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/20"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Verification Pending Banner (if unverified or pending) */}
      {!verified && (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-950 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">Verification Pending</h3>
                <p className="mt-0.5 text-xs text-amber-900/80">
                  Complete verification to unlock full selling privileges.
                </p>
              </div>
            </div>

            <Link
              href="/agent/verification"
              prefetch
              className="pressable inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-amber-700 px-5 text-xs font-bold text-white shadow-xs hover:bg-amber-800"
            >
              Complete Verification
            </Link>
          </div>
        </section>
      )}

      {/* 3. Quick Actions Bar — 4 Clean Equal Height Tiles with Numbers */}
      <section className="space-y-2.5">
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ActionTile href="/agent/listings" icon={List} label="My Listings" count={totalListings} />
          <ActionTile href="/agent/leads" icon={MessageCircle} label="Messages" count={leadsCount} />
          <ActionTile href="/saved" icon={Sparkles} label="Saved" count={savedCount} />
          <ActionTile href="/agent/edit-profile" icon={Users} label="Profile" />
        </div>
      </section>

      {/* 4. Business Overview (if totalListings > 0) */}
      {totalListings > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-end justify-between gap-2 px-0.5">
            <SectionLabel>Business overview</SectionLabel>
            <Link
              href="/agent/listings"
              className="text-[11px] font-bold text-navy/55 hover:text-navy"
            >
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            {overview.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="pressable rounded-2xl border border-navy/[0.06] bg-white px-4 py-3.5 shadow-[0_4px_16px_-14px_rgba(3,27,78,0.22)] hover:border-navy/15"
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-navy/40">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-navy">{item.value}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Performance & Capacity Panel (if totalListings > 0) */}
      {totalListings > 0 && (
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="space-y-2.5 lg:col-span-8">
            <SectionLabel>Performance</SectionLabel>
            <div className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]">
              <SellerAnalyticsPanel
                activeCount={activeCount}
                pending={pending}
                leadsCount={leadsCount}
                savedCount={savedCount}
                responseRate={profile.response_rate ?? null}
                averageResponseTimeMinutes={profile.avg_response_time_minutes ?? null}
                initialData={analyticsPreviewData}
                variant="command"
              />
            </div>
          </section>

          <section className="space-y-2.5 lg:col-span-4">
            <SectionLabel>Plan & capacity</SectionLabel>
            <PlansUpgradeCard
              planLabel={subscriptionPlanLabel}
              activeCount={activeCount}
              limit={limit}
              expiresInDays={subscriptionExpiresInDays}
              variant="command"
            />
          </section>
        </div>
      )}

      {/* 6. Account Settings Accordion */}
      <section>
        <details className="group overflow-hidden rounded-[1.25rem] border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)]">
          <summary className="pressable flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-navy marker:hidden">
            <span>Account Settings & Controls</span>
            <span className="text-xs font-bold text-navy/40 transition-transform duration-200 group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="border-t border-navy/[0.05] p-4">
            <ProfileAccountActions email={email} canList />
          </div>
        </details>
      </section>
    </div>
  );
}
