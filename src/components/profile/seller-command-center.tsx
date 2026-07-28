"use client";

import Link from "next/link";
import Image from "next/image";
import {
  List,
  MessageCircle,
  PlusCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

function QuickActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  href: string;
  icon: typeof List;
  title: string;
  subtitle: string;
  count?: number | null;
}) {
  const showBadge = count !== undefined && count !== null && count > 0;

  return (
    <Link
      href={href}
      prefetch
      className="pressable group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-navy/[0.06] bg-white p-5 text-center shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-[0_10px_28px_-16px_rgba(3,27,78,0.3)]"
    >
      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/[0.04] text-navy transition-colors group-hover:bg-gold/20">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>
        {showBadge && (
          <span className="absolute -top-1 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-black text-navy shadow-xs ring-2 ring-white">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <h3 className="text-xs font-bold text-navy">{title}</h3>
        <p className="text-[11px] font-medium text-navy/45">{subtitle}</p>
      </div>
    </Link>
  );
}

function getTrustLevelLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-400" };
  if (score >= 60) return { label: "Good", color: "text-emerald-300" };
  if (score >= 40) return { label: "Fair", color: "text-gold" };
  return { label: "Basic", color: "text-amber-400" };
}

/**
 * Seller Business Control Center — Refined with Yike Passport Hero
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

  const companyOrName =
    profile.company_name?.trim() ||
    profile.full_name?.trim() ||
    profile.username ||
    "Yike Merchant";

  const trustScore = profile.trust_score ?? 42;
  const trustLevel = getTrustLevelLabel(trustScore);
  const passportId = `KPY${profile.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

  const verificationStatusText = verified
    ? "Verified"
    : profile.verification_status === "pending"
    ? "Verification Pending"
    : "Unverified";

  const overview = [
    { label: "Active", value: activeCount, href: "/agent/listings" },
    { label: "Pending", value: pending, href: "/agent/listings" },
    { label: "Sold", value: soldCount, href: "/agent/listings" },
    { label: "Rented", value: rentedCount, href: "/agent/listings" },
    { label: "Expired", value: expiredCount, href: "/agent/listings" },
    { label: "Drafts", value: draftCount, href: "/agent/listings/new" },
  ];

  return (
    <div className="dashboard-fade-in space-y-7 pb-8">
      {profileSaved && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950"
        >
          Profile saved.
        </p>
      )}

      {/* 1. HERO SECTION — TWO COLUMN LAYOUT (Identity Left + Yike Passport Card Right) */}
      <section className="relative overflow-hidden rounded-[2rem] border border-navy/15 bg-navy shadow-[0_25px_60px_-25px_rgba(3,27,78,0.7)]">
        {/* Background Imagery with Premium Dark Brand Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: `url(${PAGE_IMAGERY.list})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#021428]/95 via-[#031B4E]/90 to-[#072462]/95" aria-hidden />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">

            {/* LEFT COLUMN — IDENTITY & GREETING */}
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {/* 96px Large Avatar with Floating Lower-Right Camera Icon */}
                <div className="relative shrink-0 self-start sm:self-auto">
                  <AvatarUpload
                    userId={profile.id}
                    email={email}
                    name={profile.full_name}
                    username={profile.username}
                    avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                    size="xl"
                    className="!h-24 !w-24 rounded-2xl border-4 border-white/20 shadow-2xl ring-2 ring-gold/40 sm:!h-28 sm:!w-28"
                  />
                </div>

                {/* Identity Info */}
                <div className="space-y-2 min-w-0">
                  <p className="text-[11px] font-extrabold tracking-[0.2em] text-gold uppercase">
                    Welcome back
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {firstName}
                  </h1>

                  {/* Compact Status Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-white/90">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium backdrop-blur-xs">
                      Member since {memberSince}
                    </span>
                    <Link
                      href={verified ? `/trust/${profile.id}` : "/agent/verification"}
                      className={cn(
                        "pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold backdrop-blur-xs transition-opacity hover:opacity-90",
                        verified
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/35"
                      )}
                    >
                      {verified ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      {verificationStatusText}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/agent/listings/choose"
                  prefetch
                  className="pressable inline-flex h-11 items-center gap-2 rounded-full bg-gold px-6 text-xs font-black text-navy shadow-[0_4px_20px_rgba(228,181,71,0.45)] transition-all hover:bg-gold-light hover:scale-[1.02]"
                >
                  <PlusCircle className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  <span>New Listing</span>
                </Link>

                <Link
                  href={`/trust/${profile.id}`}
                  prefetch
                  className="pressable inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <Shield className="h-4 w-4 text-gold" aria-hidden />
                  <span>View Passport</span>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN — YIKE PASSPORT CARD */}
            <div className="lg:col-span-5">
              <Link
                href={`/trust/${profile.id}`}
                prefetch
                className="group relative block overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-[#021428]/85 via-[#031B4E]/80 to-[#092b6e]/85 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-gold/60 hover:shadow-[0_12px_40px_-10px_rgba(228,181,71,0.3)]"
              >
                {/* Subtle Gold Contour Background Accents */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gold/10 blur-2xl transition-all duration-500 group-hover:bg-gold/20" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="relative z-10 space-y-5">
                  {/* Passport Header Row */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] font-extrabold tracking-[0.2em] text-gold uppercase">
                      Yike Passport
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        verified
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      )}
                    >
                      {verified ? "Verified Active" : "Pending"}
                    </span>
                  </div>

                  {/* Passport Main Identity Block */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 to-gold/5 text-gold shadow-inner">
                      <Image
                        src="/images/logo.webp"
                        alt="Yike Gold Logo"
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain drop-shadow-md"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h2 className="text-lg font-black text-white truncate">
                        {companyOrName}
                      </h2>
                      <p className="inline-flex rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider text-gold/90">
                        ID {passportId}
                      </p>
                    </div>
                  </div>

                  {/* Passport Trust Score Gauge Block */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white/70">Trust Score</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xl font-black text-gold tabular-nums">{trustScore}</span>
                        <span className={cn("text-xs font-bold", trustLevel.color)}>
                          {trustLevel.label}
                        </span>
                      </span>
                    </div>

                    {/* Progress Bar Gauge */}
                    <div className="h-2 w-full rounded-full bg-navy/80 p-0.5 border border-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-gold to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, trustScore))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BUSINESS CONTROL CENTER — 3-COLUMN KPI GRID */}
      <section className="space-y-3">
        <SectionLabel>Business Control Center</SectionLabel>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Active Leads */}
          <div className="pressable flex flex-col justify-between rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)] hover:border-navy/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy/70">Active Leads</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black tabular-nums text-navy">{leadsCount}</p>
              <p className="mt-1 text-[11px] font-medium text-emerald-600">
                ● 0% vs last 7 days
              </p>
            </div>
          </div>

          {/* Card 2: Listings */}
          <div className="pressable flex flex-col justify-between rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)] hover:border-navy/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy/70">Listings</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <List className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black tabular-nums text-navy">{totalListings}</p>
              <p className="mt-1 text-[11px] font-medium text-navy/50">
                ● 0% vs last 7 days
              </p>
            </div>
          </div>

          {/* Card 3: Trust Score */}
          <div className="pressable flex flex-col justify-between rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)] hover:border-navy/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy/70">Trust Score</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-black tabular-nums text-navy">{trustScore}</p>
              <p className="mt-1 text-[11px] font-medium text-emerald-600">
                ↑ 2 pts this week
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUICK ACTIONS — 4 UNIFORM CARDS */}
      <section className="space-y-3">
        <SectionLabel>Quick actions</SectionLabel>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuickActionCard
            href="/agent/listings"
            icon={List}
            title="My Listings"
            subtitle="Manage your listings"
            count={totalListings}
          />
          <QuickActionCard
            href="/agent/leads"
            icon={MessageCircle}
            title="Messages"
            subtitle="View conversations"
            count={leadsCount}
          />
          <QuickActionCard
            href="/saved"
            icon={Sparkles}
            title="Saved"
            subtitle="Saved listings"
            count={savedCount}
          />
          <QuickActionCard
            href={`/trust/${profile.id}`}
            icon={ShieldCheck}
            title="Passport"
            subtitle="Manage verification"
          />
        </div>
      </section>

      {/* 4. BUSINESS OVERVIEW (if totalListings > 0) */}
      {totalListings > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2 px-0.5">
            <SectionLabel>Inventory Breakdown</SectionLabel>
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

      {/* 5. PERFORMANCE & CAPACITY PANEL (if totalListings > 0) */}
      {totalListings > 0 && (
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="space-y-3 lg:col-span-8">
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

          <section className="space-y-3 lg:col-span-4">
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

      {/* 6. ACCOUNT SETTINGS ACCORDION */}
      <section>
        <details className="group overflow-hidden rounded-[1.25rem] border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)]">
          <summary className="pressable flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-navy marker:hidden">
            <span>Account Settings & Controls</span>
            <span className="text-xs font-bold text-navy/40 transition-transform duration-200 group-open:rotate-90">
              ▶
            </span>
          </summary>
          <div className="border-t border-navy/[0.05] p-5">
            <ProfileAccountActions email={email} canList />
          </div>
        </details>
      </section>
    </div>
  );
}
