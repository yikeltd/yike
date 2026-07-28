"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  List,
  MessageCircle,
  Plus,
  PlusCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { SellerAnalyticsPanel } from "@/components/subscriptions/seller-analytics-panel";
import { PlansUpgradeCard } from "@/components/subscriptions/plans-upgrade-card";
import type { SellerAnalyticsSummary } from "@/lib/subscriptions/analytics";
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

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <h2 className="text-sm font-extrabold tracking-tight text-navy sm:text-base">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          prefetch
          className="group inline-flex items-center gap-0.5 text-xs font-bold text-navy/60 hover:text-navy"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function QuickActionTile({
  href,
  icon: Icon,
  iconTone,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof List;
  iconTone: "blue" | "emerald" | "purple" | "gold";
  title: string;
  subtitle: string;
}) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
    gold: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  };

  return (
    <Link
      href={href}
      prefetch
      className="pressable group flex flex-col items-center justify-center gap-2 rounded-2xl border border-navy/[0.06] bg-white p-5 text-center shadow-[0_4px_18px_-14px_rgba(3,27,78,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-[0_10px_28px_-16px_rgba(3,27,78,0.25)]"
    >
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-colors", toneMap[iconTone])}>
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-xs font-bold text-navy">{title}</h3>
        <p className="text-[11px] font-medium text-navy/45">{subtitle}</p>
      </div>
    </Link>
  );
}

/**
 * Seller Business Control Center — V3 (Conversation-First Business Operating System)
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

  const trustScore = profile.trust_score ?? 42;

  // Mock sample recent conversations for preview & workspace demo
  const sampleConversations = [
    {
      id: "conv-1",
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop",
      tag: "Offer accepted",
      tagTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      message: "Great! When can we schedule the viewing?",
      time: "2m ago",
      unread: 1,
      online: true,
    },
    {
      id: "conv-2",
      name: "Mary James",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&fit=crop",
      tag: "Viewing request",
      tagTone: "bg-blue-50 text-blue-700 border-blue-200",
      message: "I'd like to schedule a viewing for tomorrow.",
      time: "1h ago",
      unread: 2,
      online: true,
    },
    {
      id: "conv-3",
      name: "Chidi Okonkwo",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&fit=crop",
      tag: "Inquiry",
      tagTone: "bg-purple-50 text-purple-700 border-purple-200",
      message: "Is the vehicle still available for inspection?",
      time: "3h ago",
      unread: 1,
      online: false,
    },
  ];

  const sampleActivities = [
    {
      id: "act-1",
      icon: Plus,
      title: "Listing created",
      subtitle: "4 Bedroom Duplex in Lekki Phase 1",
      time: "3h ago",
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "act-2",
      icon: CheckCircle2,
      title: "Offer received",
      subtitle: "₦45,000,000 offer on Lekki Duplex",
      time: "5h ago",
      tone: "bg-blue-100 text-blue-700",
    },
    {
      id: "act-3",
      icon: Clock,
      title: "Viewing scheduled",
      subtitle: "Tomorrow at 2:00 PM with Mary James",
      time: "1d ago",
      tone: "bg-amber-100 text-amber-700",
    },
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

      {/* SECTION 1 & SECTION 2 — HERO & PRIMARY ACTION CONTAINER */}
      <section className="relative overflow-hidden rounded-[2rem] border border-navy/15 bg-gradient-to-br from-[#021428] via-[#031B4E] to-[#072462] p-6 text-white shadow-[0_25px_60px_-25px_rgba(3,27,78,0.7)] sm:p-8">
        
        {/* Top Header Row — Bell Notification */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-[10px] font-extrabold tracking-[0.2em] text-gold uppercase">
            Business Control Center
          </span>
          <Link
            href="/conversations"
            prefetch
            className="pressable relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-[#031B4E]" />
          </Link>
        </div>

        {/* Hero Main Block — Avatar & Greeting */}
        <div className="py-6 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-5">
          {/* 96px Avatar with floating camera icon */}
          <div className="relative shrink-0">
            <AvatarUpload
              userId={profile.id}
              email={email}
              name={profile.full_name}
              username={profile.username}
              avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
              size="xl"
              className="!h-24 !w-24 rounded-full border-4 border-white/25 shadow-2xl ring-2 ring-gold/40 sm:!h-28 sm:!w-28"
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-white/70">Welcome back,</p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {firstName}
            </h1>

            {/* Status & Member Since Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-white/90">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                {verified ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
                {verified ? "Verified Seller" : "Verification Pending"}
              </span>

              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Calendar className="h-3.5 w-3.5 text-gold/80" />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2 — PRIMARY CTA (FULL WIDTH GOLD NEW LISTING BUTTON) */}
        <div className="pt-2">
          <Link
            href="/agent/listings/choose"
            prefetch
            className="pressable flex w-full h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-black text-navy shadow-[0_6px_24px_rgba(228,181,71,0.5)] transition-all hover:bg-gold-light hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlusCircle className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            <span>New Listing</span>
          </Link>
        </div>
      </section>

      {/* SECTION 3 — BUSINESS SNAPSHOT (DARK HORIZONTAL KPI CONTAINER) */}
      <section className="space-y-3">
        <SectionHeader title="Business Snapshot" href="/seller/crm" />

        <div className="rounded-2xl border border-navy/15 bg-[#0a225c]/95 p-4 sm:p-5 text-white shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-3 gap-3 divide-x divide-white/10">
            {/* Panel 1: Active Leads */}
            <div className="space-y-1.5 px-2 first:pl-0">
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                  <Users className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">Active Leads</span>
              </div>
              <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">{leadsCount}</p>
              <p className="text-[10px] font-medium text-emerald-400 sm:text-xs">
                ● 0% <span className="hidden sm:inline">vs last 7 days</span>
              </p>
            </div>

            {/* Panel 2: Listings */}
            <div className="space-y-1.5 px-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                  <Briefcase className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">Listings</span>
              </div>
              <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">{totalListings}</p>
              <p className="text-[10px] font-medium text-white/50 sm:text-xs">
                ● 0% <span className="hidden sm:inline">vs last 7 days</span>
              </p>
            </div>

            {/* Panel 3: Trust Score */}
            <div className="space-y-1.5 pl-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                  <Shield className="h-4 w-4 text-gold" />
                </span>
                <span className="hidden sm:inline">Trust Score</span>
              </div>
              <p className="text-2xl font-black tabular-nums text-gold sm:text-3xl">{trustScore}</p>
              <p className="text-[10px] font-medium text-emerald-400 sm:text-xs">
                ↑ 2 pts <span className="hidden sm:inline">this week</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — RECENT CONVERSATIONS (HIGH PRIORITY WORKSPACE) */}
      <section className="space-y-3">
        <SectionHeader title="Recent Conversations" href="/conversations" />

        <div className="divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.2)]">
          {sampleConversations.map((conv) => (
            <Link
              key={conv.id}
              href="/conversations"
              prefetch
              className="pressable group flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface/80"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Buyer Avatar */}
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="h-11 w-11 rounded-full object-cover border border-navy/10 shadow-xs"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>

                {/* Conversation Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-navy truncate">{conv.name}</h3>
                    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold", conv.tagTone)}>
                      {conv.tag}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-navy/60 truncate">{conv.message}</p>
                </div>
              </div>

              {/* Timestamp & Unread Badge */}
              <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                <span className="text-[11px] font-medium text-navy/40">{conv.time}</span>
                {conv.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-black text-navy shadow-xs">
                    {conv.unread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5 — QUICK ACTIONS (4 UNIFORM CARDS) */}
      <section className="space-y-3">
        <SectionHeader title="Quick Actions" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionTile
            href="/agent/listings"
            icon={List}
            iconTone="blue"
            title="My Listings"
            subtitle="Manage your listings"
          />
          <QuickActionTile
            href="/agent/verification"
            icon={Shield}
            iconTone="emerald"
            title="Verification"
            subtitle="Complete verification"
          />
          <QuickActionTile
            href="/seller/crm"
            icon={BarChart3}
            iconTone="purple"
            title="Analytics"
            subtitle="View business insights"
          />
          <QuickActionTile
            href="/payments/history"
            icon={Wallet}
            iconTone="gold"
            title="Payments"
            subtitle="Manage transactions"
          />
        </div>
      </section>

      {/* SECTION 6 — RECENT ACTIVITY */}
      <section className="space-y-3">
        <SectionHeader title="Recent Activity" href="/seller/crm" />

        <div className="divide-y divide-navy/[0.06] overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.2)]">
          {sampleActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", act.tone)}>
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-xs font-bold text-navy truncate">{act.title}</h3>
                    <p className="text-xs font-medium text-navy/55 truncate">{act.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-navy/40">{act.time}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ACCOUNT SETTINGS & CONTROLS ACCORDION */}
      <section>
        <details className="group overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.2)]">
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
