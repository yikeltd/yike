"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Car,
  Check,
  ChevronRight,
  Circle,
  Clock,
  CreditCard,
  LayoutGrid,
  List,
  Lock,
  MessageCircle,
  PlusCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { SellerAnalyticsPanel } from "@/components/subscriptions/seller-analytics-panel";
import { PlansUpgradeCard } from "@/components/subscriptions/plans-upgrade-card";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
import { openYikeSupportWhatsApp } from "@/lib/support";
import { useStandaloneApp } from "@/hooks/use-standalone-app";
import {
  getSellerType,
  profileRoleLabel,
  showAgentBadge,
} from "@/lib/profile-display";
import {
  getTrustProgressItems,
  getTrustStatusChip,
  trustProgressPercent,
  type TrustItemStatus,
} from "@/lib/verification/trust-center";
import { accountStatusMessage } from "@/lib/account-control";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
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

function statusLabel(status: TrustItemStatus): string {
  switch (status) {
    case "complete":
      return "Verified";
    case "under_review":
    case "pending":
      return "Pending";
    default:
      return "Not started";
  }
}

function StatusDot({ status }: { status: TrustItemStatus }) {
  if (status === "complete") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (status === "under_review" || status === "pending") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
        <Clock className="h-3 w-3" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy/[0.06] text-navy/35">
      <Circle className="h-3 w-3" aria-hidden />
    </span>
  );
}

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
  onClick,
}: {
  href?: string;
  icon: typeof List;
  label: string;
  onClick?: () => void;
}) {
  const className =
    "pressable group flex flex-col items-start gap-2.5 rounded-2xl border border-navy/[0.06] bg-white p-3 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/10 hover:shadow-[0_10px_28px_-16px_rgba(3,27,78,0.35)]";

  const body = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy/[0.04] text-navy transition-colors group-hover:bg-gold/20">
        <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="text-[11px] font-bold leading-tight text-navy">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  if (!href) return null;
  return (
    <Link href={href} prefetch className={className}>
      {body}
    </Link>
  );
}

function composeDashboardGreeting(props: {
  name: string;
  pending: number;
  expiringSoon: number;
  expiredCount: number;
  leadsCount: number;
  viewsCount?: number | null;
  trustScore: number;
  verified: boolean;
  activeCount: number;
  savedCount: number;
  location: string | null;
}): { prefix: string; summary: string } {
  const firstName = props.name.trim().split(/\s+/)[0] || props.name;
  const hour = new Date().getHours();
  let prefix = `Welcome back, ${firstName}.`;
  if (hour >= 5 && hour < 12) prefix = `Good morning, ${firstName}.`;
  else if (hour >= 12 && hour < 17) prefix = `Good afternoon, ${firstName}.`;
  else if (hour >= 17 && hour < 22) prefix = `Good evening, ${firstName}.`;

  const sentences: string[] = [];

  if (props.pending > 0 && props.expiringSoon > 0) {
    sentences.push(
      `You have ${props.pending} listing${props.pending === 1 ? "" : "s"} awaiting approval and ${props.expiringSoon} expiring soon.`
    );
  } else if (props.pending > 0) {
    sentences.push(
      `You have ${props.pending} listing${props.pending === 1 ? "" : "s"} currently awaiting moderation review.`
    );
  } else if (props.expiringSoon > 0) {
    sentences.push(
      `You have ${props.expiringSoon} listing${props.expiringSoon === 1 ? "" : "s"} expiring soon and ready for renewal.`
    );
  } else if (props.expiredCount > 0) {
    sentences.push(
      `You have ${props.expiredCount} expired listing${props.expiredCount === 1 ? "" : "s"} available for instant renewal.`
    );
  }

  if (sentences.length < 2) {
    if (props.leadsCount > 0 && props.viewsCount && props.viewsCount > 0) {
      sentences.push(
        `Your portfolio recorded ${props.viewsCount.toLocaleString()} views and ${props.leadsCount} new enquiry lead${props.leadsCount === 1 ? "" : "s"} over the last 30 days.`
      );
    } else if (props.leadsCount > 0) {
      sentences.push(
        `You received ${props.leadsCount} new enquiry lead${props.leadsCount === 1 ? "" : "s"} over the last 30 days.`
      );
    } else if (props.viewsCount && props.viewsCount > 0) {
      sentences.push(
        `Your active portfolio recorded ${props.viewsCount.toLocaleString()} listing view${props.viewsCount === 1 ? "" : "s"} this month.`
      );
    } else if (props.savedCount > 0) {
      sentences.push(
        `Buyers have saved your listings ${props.savedCount} time${props.savedCount === 1 ? "" : "s"}.`
      );
    }
  }

  if (sentences.length === 0) {
    if (props.verified && props.trustScore > 0) {
      sentences.push(
        `Your verified account holds a Trust Score of ${props.trustScore} with ${props.activeCount} active listing${props.activeCount === 1 ? "" : "s"}.`
      );
    } else if (props.activeCount > 0) {
      sentences.push(
        `Your command center is active with ${props.activeCount} live listing${props.activeCount === 1 ? "" : "s"}${props.location ? ` in ${props.location}` : ""}.`
      );
    } else {
      sentences.push(
        "Your business command center is online. Publish your first listing to start receiving buyer leads."
      );
    }
  }

  return {
    prefix,
    summary: sentences.slice(0, 2).join(" "),
  };
}

/**
 * Seller Business Command Center — presentation only.
 * Reuses existing metrics, trust helpers, analytics panel, and plan card.
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
    expiringSoon,
    expiredCount,
    draftCount = 0,
    rentedCount,
    soldCount,
    leadsCount,
    missingPhotosCount = 0,
    incompleteListingsCount = 0,
    lowQualityListingsCount = 0,
    listingHealthScore = null,
    memberSince,
    socialStats,
    subscriptionPlanLabel,
    subscriptionExpiresInDays,
    profileSaved,
    analyticsPreviewData,
  } = props;

  const { isApp } = useStandaloneApp();
  const openSupport = () => openYikeSupportWhatsApp(undefined, { preferSameTab: isApp });
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  const displayName =
    profile.company_name?.trim() ||
    profile.full_name ||
    profile.username ||
    "Your business";
  const location =
    [profile.residential_city, profile.residential_state]
      .filter(Boolean)
      .join(", ") ||
    profile.office_address ||
    null;
  const trustScore = Math.round(Number(profile.trust_score ?? 0));
  const planName = subscriptionPlanLabel ?? "Starter";
  const sellerType = getSellerType(profile);
  const roleLabel = profileRoleLabel(profile, verified);
  const trustChip = getTrustStatusChip(profile, verified);
  const statusMessage = accountStatusMessage(profile);

  const greeting = composeDashboardGreeting({
    name: profile.full_name || profile.username || displayName,
    pending,
    expiringSoon,
    expiredCount,
    leadsCount,
    viewsCount: analyticsPreviewData?.listingViews ?? null,
    trustScore,
    verified,
    activeCount,
    savedCount,
    location,
  });
  const trustItems = getTrustProgressItems(profile, verified);
  const progress = trustProgressPercent(trustItems);
  const profileCompletionItems: {
    label: string;
    status: TrustItemStatus;
    href: string;
  }[] = [
    {
      label: "Phone",
      status: profile.phone_verified || profile.whatsapp_verified_at ? "complete" : "action_needed",
      href: "/agent/verification",
    },
    {
      label: "Email",
      status: profile.email_verified ? "complete" : "action_needed",
      href: "/auth/verify-email",
    },
    {
      label: "Address",
      status: profile.residential_address || profile.office_address ? "complete" : "action_needed",
      href: "/agent/edit-profile",
    },
    {
      label: "Government ID",
      status: verified
        ? "complete"
        : profile.verification_status === "pending"
          ? "under_review"
          : "optional",
      href: "/agent/verification",
    },
    {
      label: "Business verification",
      status: profile.company_verified ? "complete" : profile.company_name ? "pending" : "optional",
      href: "/agent/company",
    },
  ];
  const profileCompletionProgress = Math.round(
    (profileCompletionItems.filter((item) => item.status === "complete").length /
      profileCompletionItems.length) *
      100,
  );
  const profileActionHref =
    profileCompletionProgress >= 100 ? "/agent/edit-profile" : "/agent/verification";
  const profileActionLabel =
    profileCompletionProgress >= 100 ? "Manage profile" : "Complete profile";
  const showCompany =
    profile.account_type === "agency" ||
    profile.account_type === "developer" ||
    Boolean(profile.company_name);
  const businessVerified = Boolean(
    profile.company_verified ||
      profile.agency_verified ||
      profile.developer_verified ||
      profile.seller_verification_level === "business",
  );
  const verificationItems: {
    label: string;
    status: TrustItemStatus;
    href: string;
  }[] = [
    {
      label: "Phone",
      status: profile.phone_verified || profile.whatsapp_verified_at ? "complete" : "action_needed",
      href: "/agent/verification",
    },
    {
      label: "Email",
      status: profile.email_verified ? "complete" : "action_needed",
      href: "/auth/verify-email",
    },
    {
      label: "Identity",
      status: verified
        ? "complete"
        : profile.verification_status === "pending"
          ? "under_review"
          : "optional",
      href: "/agent/verification",
    },
    {
      label: "Business",
      status: businessVerified ? "complete" : profile.company_name ? "pending" : "optional",
      href: "/agent/company",
    },
    {
      label: "Office",
      status: profile.office_address || profile.residential_address ? "complete" : "optional",
      href: "/agent/edit-profile",
    },
    {
      label: "Bank",
      status: profile.bank_verified ? "complete" : profile.bank_account_number ? "pending" : "optional",
      href: "/agent/plans",
    },
  ];
  const verificationProgress = Math.round(
    (verificationItems.filter((item) => item.status === "complete").length /
      verificationItems.length) *
      100,
  );

  const overview = [
    { label: "Active", value: activeCount, href: "/agent/listings" },
    { label: "Pending", value: pending, href: "/agent/listings" },
    { label: "Sold", value: soldCount, href: "/agent/listings" },
    { label: "Rented", value: rentedCount, href: "/agent/listings" },
    { label: "Expired", value: expiredCount, href: "/agent/listings" },
    { label: "Drafts", value: draftCount, href: "/agent/listings/new" },
  ];

  const attention: { text: string; href: string }[] = [];
  if (pending > 0) {
    attention.push({
      text: `${pending} listing${pending === 1 ? "" : "s"} awaiting review`,
      href: "/agent/listings",
    });
  }
  if (expiringSoon > 0) {
    attention.push({
      text: `${expiringSoon} listing${expiringSoon === 1 ? "" : "s"} expiring soon`,
      href: "/agent/listings",
    });
  }
  if (expiredCount > 0) {
    attention.push({
      text: `${expiredCount} expired listing${expiredCount === 1 ? "" : "s"} to renew`,
      href: "/agent/listings",
    });
  }
  if (lowQualityListingsCount > 0) {
    attention.push({
      text: `${lowQualityListingsCount} listing${lowQualityListingsCount === 1 ? "" : "s"} need quality fixes`,
      href: "/agent/listings",
    });
  }
  if (profile.verification_status === "pending") {
    attention.push({
      text: "Verification pending",
      href: "/agent/verification",
    });
  }
  if (progress < 100) {
    attention.push({
      text: "Complete your profile to raise buyer trust",
      href: "/agent/verification",
    });
  }

  const healthIssues = [
    pending > 0
      ? { label: "Pending review", value: pending, href: "/agent/listings" }
      : null,
    expiredCount > 0
      ? { label: "Expired listings", value: expiredCount, href: "/agent/listings" }
      : null,
    expiringSoon > 0
      ? { label: "Expiring soon", value: expiringSoon, href: "/agent/listings" }
      : null,
    missingPhotosCount > 0
      ? { label: "Missing photos", value: missingPhotosCount, href: "/agent/listings" }
      : null,
    incompleteListingsCount > 0
      ? { label: "Incomplete listings", value: incompleteListingsCount, href: "/agent/listings" }
      : null,
    lowQualityListingsCount > 0
      ? { label: "Low quality listings", value: lowQualityListingsCount, href: "/agent/listings" }
      : null,
    progress < 80
      ? { label: "Profile incomplete", value: `${progress}%`, href: "/agent/verification" }
      : null,
  ].filter(Boolean) as { label: string; value: string | number; href: string }[];

  const computedHealthScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        pending * 4 -
        expiredCount * 8 -
        expiringSoon * 3 -
        (progress < 100 ? Math.round((100 - progress) * 0.25) : 0),
    ),
  );
  const healthScore = listingHealthScore ?? computedHealthScore;
  const healthLabel =
    healthScore >= 90 ? "Excellent" : healthScore >= 70 ? "Good" : "Needs attention";

  const insights: string[] = [];
  if (progress < 100) {
    insights.push("Complete verification to increase buyer trust.");
  }
  if (expiredCount > 0) {
    insights.push("Renew expired listings to restore marketplace visibility.");
  }
  if (activeCount > 0 && leadsCount === 0) {
    insights.push("Boost a strong listing to get more enquiries this week.");
  }
  if (activeCount > 0) {
    insights.push("Listings with 10+ clear photos receive more enquiries.");
  }
  if (missingPhotosCount > 0) {
    insights.push("Add more clear photos to listings missing visual proof.");
  }
  if (insights.length === 0) {
    insights.push("Keep listings fresh — renew before expiry to stay visible.");
  }

  const recentActivity = [
    verified
      ? {
          title: "Verification approved",
          detail: "Your seller trust badge is active.",
          meta: "Trust",
          icon: ShieldCheck,
          tone: "success",
        }
      : null,
    leadsCount > 0
      ? {
          title: "Lead received",
          detail: `${leadsCount} enquiry${leadsCount === 1 ? "" : "ies"} in the last 30 days.`,
          meta: "30d",
          icon: MessageCircle,
          tone: "success",
        }
      : null,
    savedCount > 0
      ? {
          title: "Buyer saved listing",
          detail: `${savedCount} saved listing${savedCount === 1 ? "" : "s"} tied to your account.`,
          meta: "Saved",
          icon: Sparkles,
          tone: "neutral",
        }
      : null,
    pending > 0
      ? {
          title: "Listing awaiting review",
          detail: `${pending} listing${pending === 1 ? "" : "s"} with moderation.`,
          meta: "Now",
          icon: Clock,
          tone: "warning",
        }
      : null,
    expiringSoon > 0
      ? {
          title: "Listing expiring soon",
          detail: `${expiringSoon} listing${expiringSoon === 1 ? "" : "s"} should be renewed.`,
          meta: "Soon",
          icon: AlertTriangle,
          tone: "warning",
        }
      : null,
    activeCount > 0
      ? {
          title: "Inventory live",
          detail: `${activeCount} active listing${activeCount === 1 ? "" : "s"} visible to buyers.`,
          meta: "Live",
          icon: Check,
          tone: "success",
        }
      : {
          title: "Command center ready",
          detail: "Publish your first listing to activate business metrics.",
          meta: "Start",
          icon: PlusCircle,
          tone: "neutral",
        },
  ].filter(Boolean) as {
    title: string;
    detail: string;
    meta: string;
    icon: typeof Check;
    tone: "success" | "warning" | "neutral";
  }[];

  return (
    <div className="dashboard-fade-in grid gap-5 pb-8 lg:grid-cols-12">
      {profileSaved ? (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950 lg:col-span-12"
        >
          Profile saved.
        </p>
      ) : null}

      {/* 1. Business header */}
      <section className="overflow-hidden rounded-[1.75rem] border border-navy/10 bg-gradient-to-br from-navy via-[#072462] to-[#031B4E] p-4 text-white shadow-[0_20px_50px_-28px_rgba(3,27,78,0.65)] sm:p-5 lg:col-span-12 lg:p-6">
        {/* Living Dashboard Contextual Greeting */}
        <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-gold">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {greeting.prefix}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium leading-relaxed text-white/90 sm:text-sm">
            {greeting.summary}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="shrink-0">
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
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold/90">
                Business command center
              </p>
              <h1 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-3xl">
                {displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {showAgentBadge(profile, verified) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    Verified
                  </span>
                ) : null}
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/90">
                  {trustChip.label}
                </span>
                {sellerType ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold capitalize text-white/80">
                    {sellerType}
                  </span>
                ) : roleLabel ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/80">
                    {roleLabel}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/70">
                <span>
                  Trust score{" "}
                  <strong className="tabular-nums text-gold">{trustScore || "—"}</strong>
                </span>
                <span>
                  Plan <strong className="text-white">{planName}</strong>
                </span>
                {location ? <span>{location}</span> : null}
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[15rem] sm:justify-end">
            <Link
              href="/agent/plans"
              prefetch
              className="pressable inline-flex h-10 items-center rounded-full bg-gold px-4 text-xs font-bold text-navy shadow-[0_4px_14px_rgba(228,181,71,0.35)]"
            >
              {subscriptionPlanLabel ? "Manage plan" : "Upgrade"}
            </Link>
            <Link
              href="/agent/edit-profile"
              prefetch
              className="pressable inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-xs font-bold text-white ring-1 ring-white/15"
            >
              Edit profile
            </Link>
            <Link
              href="/agent/listings/choose"
              prefetch
              className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-xs font-bold text-white ring-1 ring-white/15"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
              New listing
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Followers
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{socialStats.followersCount}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Likes
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">
              {socialStats.listingLikesCount}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">
              Listings
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{totalListings}</p>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <div
          className="rounded-2xl border border-amber-200/60 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 lg:col-span-12"
          role="status"
        >
          <p className="font-medium">{statusMessage}</p>
        </div>
      ) : null}

      {/* Attention */}
      {attention.length > 0 ? (
        <section className="space-y-2 lg:col-span-4">
          <SectionLabel>Notifications</SectionLabel>
          <ul className="overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)]">
            {attention.slice(0, 4).map((item) => (
              <li key={item.text} className="border-b border-navy/[0.05] last:border-0">
                <Link
                  href={item.href}
                  className="pressable flex items-center gap-3 px-3.5 py-3 text-sm text-navy hover:bg-navy/[0.02]"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <span className="flex-1 font-medium">{item.text}</span>
                  <ChevronRight className="h-4 w-4 text-navy/30" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 2. Quick actions */}
      <section
        className={cn(
          "space-y-2.5",
          attention.length > 0 ? "lg:col-span-8" : "lg:col-span-12",
        )}
      >
        <SectionLabel>Quick actions</SectionLabel>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {vehiclesOn ? (
            <ActionTile
              href="/agent/listings/new/vehicle"
              icon={Car}
              label="New vehicle"
            />
          ) : null}
          <ActionTile
            href="/agent/listings/new"
            icon={Building2}
            label="New property"
          />
          <ActionTile href="/agent/listings" icon={Zap} label="Boost" />
          <ActionTile href="/agent/listings" icon={List} label="My listings" />
          <ActionTile href="/agent/leads" icon={MessageCircle} label="Leads" />
          <ActionTile href="/agent/notifications" icon={Bell} label="Alerts" />
          <ActionTile href="/agent/plans" icon={BarChart3} label="Analytics" />
          <ActionTile href="/agent/plans" icon={CreditCard} label="Payments" />
          <ActionTile
            href="/agent/verification"
            icon={ShieldCheck}
            label="Verification"
          />
          <ActionTile href="/agent/followers" icon={Users} label="Followers" />
          {showCompany ? (
            <ActionTile href="/agent/company" icon={LayoutGrid} label="Company" />
          ) : null}
          <ActionTile icon={MessageCircle} label="Help" onClick={openSupport} />
        </div>
      </section>

      {/* 3. Business overview */}
      <section className="space-y-2.5 lg:col-span-12">
        <div className="flex items-end justify-between gap-2 px-0.5">
          <SectionLabel>Business overview</SectionLabel>
          <Link
            href="/agent/listings"
            className="text-[11px] font-bold text-navy/55 hover:text-navy"
          >
            Manage
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {overview.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="pressable rounded-2xl border border-navy/[0.06] bg-white px-3.5 py-3 shadow-[0_4px_16px_-14px_rgba(3,27,78,0.22)]"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-navy/40">
                {item.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-navy">{item.value}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Profile completion */}
      <section className="space-y-2.5 lg:col-span-4">
          <SectionLabel>Profile completion</SectionLabel>
          <div className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy">Profile</p>
                <p className="mt-0.5 text-xs text-navy/55">
                  Complete verification to increase buyer trust.
                </p>
              </div>
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 h-14 w-14 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-navy/[0.06]"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(profileCompletionProgress / 100) * 97.4} 97.4`}
                    className="text-gold transition-[stroke-dasharray] duration-700"
                  />
                </svg>
                <span className="text-xs font-extrabold tabular-nums text-navy">
                  {profileCompletionProgress}%
                </span>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {profileCompletionItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm">
                  <StatusDot status={item.status} />
                  <span
                    className={cn(
                      "flex-1",
                      item.status === "complete" ? "text-navy/45" : "font-medium text-navy",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-navy/40">
                    {statusLabel(item.status)}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={profileActionHref}
              prefetch
              className="pressable mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-navy text-xs font-bold text-gold"
            >
              {profileActionLabel}
            </Link>
          </div>
      </section>

      {/* 4. Performance */}
      <section className="space-y-2.5 lg:col-span-8">
        <SectionLabel>Performance</SectionLabel>
        <div className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-3.5 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)] sm:p-4">
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

      {/* 5. Listing health */}
      <section className="space-y-2.5 lg:col-span-4">
        <SectionLabel>Listing health</SectionLabel>
        <div className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-navy">Overall listing health</p>
              <p
                className={cn(
                  "mt-1 text-xs font-semibold",
                  healthScore >= 90
                    ? "text-emerald-700"
                    : healthScore >= 70
                      ? "text-navy/60"
                      : "text-amber-700",
                )}
              >
                {healthLabel}
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-navy">
              {healthScore}
              <span className="text-base font-semibold text-navy/35">%</span>
            </p>
          </div>

          {healthIssues.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {healthIssues.map((issue) => (
                <li key={issue.label}>
                  <Link
                    href={issue.href}
                    className="pressable flex items-center justify-between rounded-xl bg-navy/[0.03] px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-navy">{issue.label}</span>
                    <span className="tabular-nums font-bold text-navy/70">{issue.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-navy/55">
              Inventory looks healthy. Keep photos fresh and renew before expiry.
            </p>
          )}
        </div>
      </section>

      {/* 6. Verification strip */}
      <section className="space-y-2.5 lg:col-span-8">
        <SectionLabel>Verification</SectionLabel>
        <div className="rounded-[1.5rem] border border-navy/[0.06] bg-white p-4 shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold-dark" aria-hidden />
              <p className="text-sm font-bold text-navy">Trust checklist</p>
            </div>
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-12 w-12 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-navy/[0.06]"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(verificationProgress / 100) * 97.4} 97.4`}
                  className="text-gold transition-[stroke-dasharray] duration-700"
                />
              </svg>
              <span className="text-[10px] font-extrabold tabular-nums text-navy">
                {verificationProgress}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {verificationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="pressable rounded-xl border border-navy/[0.05] bg-navy/[0.02] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={item.status} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-navy">{item.label}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-navy/40">
                      {statusLabel(item.status)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Plan */}
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

      {/* 8. Insights */}
      <section className="space-y-2.5 lg:col-span-4">
        <SectionLabel>Seller insights</SectionLabel>
        <ul className="space-y-2">
          {insights.slice(0, 3).map((tip) => (
            <li
              key={tip}
              className="flex gap-3 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-white px-3.5 py-3"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden />
              <p className="text-sm font-medium leading-snug text-navy/85">{tip}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Premium aspirational */}
      <section className="overflow-hidden rounded-[1.5rem] border border-navy/[0.08] bg-gradient-to-br from-[#f7f8fb] via-white to-gold/10 p-4 lg:col-span-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-gold">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy">Premium insights</p>
            <p className="mt-1 text-xs leading-relaxed text-navy/55">
              Unlock deeper funnel analytics, channel breakdown, and conversion trends when
              you are ready.
            </p>
            <Link
              href="/agent/plans"
              className="pressable mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-navy px-3.5 text-[11px] font-bold text-gold"
            >
              <Lock className="h-3 w-3" aria-hidden />
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-2.5 lg:col-span-8">
        <SectionLabel>Recent activity</SectionLabel>
        <ol className="overflow-hidden rounded-[1.5rem] border border-navy/[0.06] bg-white shadow-[0_8px_28px_-18px_rgba(3,27,78,0.28)]">
          {recentActivity.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={`${item.title}-${item.meta}`}
                className="relative border-b border-navy/[0.05] last:border-0"
              >
                <div className="flex gap-3 px-4 py-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      item.tone === "success"
                        ? "bg-emerald-500/12 text-emerald-700"
                        : item.tone === "warning"
                          ? "bg-amber-500/14 text-amber-700"
                          : "bg-navy/[0.05] text-navy/60",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-navy">{item.title}</p>
                      <span className="shrink-0 rounded-full bg-navy/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-navy/40">
                        {item.meta}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-navy/55">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="lg:col-span-12">
        <details className="group overflow-hidden rounded-[1.25rem] border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.22)]">
          <summary className="pressable flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-navy marker:hidden">
            <span>Account settings</span>
            <ChevronRight
              className="h-4 w-4 text-navy/35 transition-transform duration-200 group-open:rotate-90"
              aria-hidden
            />
          </summary>
          <div className="border-t border-navy/[0.05] p-3">
            <ProfileAccountActions email={email} canList />
          </div>
        </details>
      </section>
    </div>
  );
}
