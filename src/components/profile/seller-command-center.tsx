"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  List,
  LogOut,
  MessageCircle,
  MessageSquare,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
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

function SectionHeader({ title, href, filterLabel }: { title: string; href?: string; filterLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-0.5 mb-3">
      <h2 className="text-sm font-black tracking-tight text-navy sm:text-base">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {filterLabel && (
          <span className="pressable flex items-center gap-1 text-xs font-bold text-navy/60 hover:text-navy">
            {filterLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        )}
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
      className="pressable group flex flex-col items-center justify-center gap-2 rounded-2xl border border-navy/[0.06] bg-white p-4 text-center shadow-[0_4px_18px_-14px_rgba(3,27,78,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-[0_10px_28px_-16px_rgba(3,27,78,0.22)]"
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl transition-colors", toneMap[iconTone])}>
        <Icon className="h-5.5 w-5.5" strokeWidth={2} aria-hidden />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-xs font-bold text-navy">{title}</h3>
        <p className="text-[10px] font-medium text-navy/45 truncate max-w-[110px]">{subtitle}</p>
      </div>
    </Link>
  );
}

function SidebarNavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  badge?: number | string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "pressable group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150",
        active
          ? "bg-gold/15 text-gold border border-gold/30 shadow-xs"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-white/60 group-hover:text-white")} strokeWidth={2.25} />
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-black text-navy shadow-xs">
          {badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Seller Business Control Center V1 — Exact Design Implementation
 */
export function SellerCommandCenter(props: Props) {
  const {
    profile,
    email,
    verified,
    totalListings,
    leadsCount,
    memberSince,
    profileSaved,
  } = props;

  const firstName =
    profile.full_name?.trim().split(/\s+/)[0] ||
    profile.username ||
    profile.company_name?.trim() ||
    "Patience";

  const trustScore = profile.trust_score ?? 100;
  const listingsValue = totalListings > 0 ? totalListings : 1;

  // Mock data for preview visual rendering
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
    },
  ];

  const sampleActivities = [
    {
      id: "act-1",
      icon: Plus,
      title: "Listing created",
      subtitle: "4 Bedroom Duplex in Lekki",
      time: "3h ago",
      tone: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      {/* LEFT SIDEBAR (DESKTOP ONLY - hidden lg:flex) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#031B4E] p-5 text-white border-r border-white/10 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Top Brand Logo */}
          <Link href="/" className="flex items-center gap-2 px-2 pt-1">
            <Image
              src="/images/logo.webp"
              alt="Yike Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain drop-shadow-md"
            />
            <span className="text-2xl font-black tracking-tight text-white">Yike</span>
          </Link>

          {/* Navigation Group 1 */}
          <nav className="space-y-1" aria-label="Main Navigation">
            <SidebarNavItem href="/agent" icon={LayoutDashboard} label="Dashboard" active />
            <SidebarNavItem href="/conversations" icon={MessageSquare} label="Conversations" badge={3} />
            <SidebarNavItem href="/discover" icon={Sparkles} label="Discover" />
            <SidebarNavItem href="/agent/listings/choose" icon={PlusCircle} label="Sell" />
          </nav>

          <hr className="border-white/10" />

          {/* Navigation Group 2 — Merchant Tools */}
          <nav className="space-y-1" aria-label="Merchant Navigation">
            <SidebarNavItem href="/agent/listings" icon={List} label="My Listings" />
            <SidebarNavItem href="/seller/crm" icon={BarChart3} label="Analytics" />
            <SidebarNavItem href="/payments/history" icon={Wallet} label="Payments" />
            <SidebarNavItem href="/agent/verification" icon={Shield} label="Verification" />
          </nav>

          <hr className="border-white/10" />

          {/* Navigation Group 3 — System & Help */}
          <nav className="space-y-1" aria-label="System Navigation">
            <SidebarNavItem href="/agent/edit-profile" icon={Settings} label="Settings" />
            <SidebarNavItem href="/contact" icon={HelpCircle} label="Help Center" />
            <SidebarNavItem href="/auth/login" icon={LogOut} label="Log out" />
          </nav>
        </div>

        {/* Bottom Yike Premium Card */}
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-[#021428] to-[#072462] p-4 text-white space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="text-xs font-bold text-white">Yike Premium</span>
          </div>
          <p className="text-[11px] text-white/70">Grow your business with priority lead routing.</p>
          <Link
            href="/pricing"
            className="pressable flex w-full h-8 items-center justify-center rounded-xl bg-gold text-xs font-black text-navy shadow-xs hover:bg-gold-light"
          >
            Upgrade
          </Link>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        
        {/* TOP HEADER (DESKTOP) */}
        <header className="sticky top-0 z-40 hidden lg:flex h-16 shrink-0 items-center justify-between border-b border-navy/10 bg-white/95 px-6 backdrop-blur-md">
          <h1 className="text-lg font-black text-navy">Dashboard</h1>

          <div className="relative w-96 items-center flex">
            <Search className="absolute left-3 h-4 w-4 text-navy/40" />
            <input
              type="text"
              placeholder="Search listings, conversations, insights..."
              className="w-full rounded-full border border-navy/10 bg-surface pl-9 pr-12 py-2 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none"
            />
            <kbd className="absolute right-3 rounded-md bg-navy/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-navy/60">
              ⌘ K
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/conversations"
              prefetch
              className="pressable relative flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy hover:bg-navy/10"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-white" />
            </Link>

            <Link
              href="/conversations"
              prefetch
              className="pressable relative flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy hover:bg-navy/10"
              aria-label="Messages"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-black text-navy">
                3
              </span>
            </Link>

            <div className="flex items-center gap-2.5 border-l border-navy/10 pl-3">
              <AvatarUpload
                userId={profile.id}
                email={email}
                name={profile.full_name}
                username={profile.username}
                avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                size="lg"
                className="!h-8 !w-8 rounded-full border border-white shadow-xs"
              />
              <div className="space-y-0.5 text-left">
                <p className="text-xs font-bold text-navy leading-none">{firstName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-navy/40" />
            </div>
          </div>
        </header>

        {/* 1. IDENTITY & HERO CONTAINER — EDGE TO EDGE DEEP NAVY */}
        <section className="relative overflow-hidden bg-[#031B4E] px-4 pb-12 pt-3 text-white shadow-2xl sm:px-6">
          {/* Top-Right Notification Bell */}
          <div className="flex justify-end pr-1">
            <Link
              href="/conversations"
              prefetch
              className="pressable relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-[#031B4E]" />
            </Link>
          </div>

          <div className="flex items-center gap-4 -mt-1">
            {/* Avatar Left */}
            <div className="relative shrink-0">
              <AvatarUpload
                userId={profile.id}
                email={email}
                name={profile.full_name}
                username={profile.username}
                avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                size="xl"
                className="!h-22 !w-22 rounded-full border-4 border-white/25 shadow-2xl ring-2 ring-gold/40 sm:!h-24 sm:!w-24"
              />
            </div>

            {/* Greeting Right */}
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-white/70">Welcome back,</p>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {firstName}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                  {verified ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                  )}
                  {verified ? "Verified Seller" : "Verification Pending"}
                </span>

                <span className="inline-flex items-center gap-1 text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-gold/80" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* 2. PRIMARY ACTION: FULL WIDTH GOLD NEW LISTING CTA */}
          <div className="mt-5">
            <Link
              href="/agent/listings/choose"
              prefetch
              className="pressable flex w-full h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-black text-navy shadow-[0_6px_24px_rgba(228,181,71,0.5)] transition-all hover:bg-gold-light hover:scale-[1.01]"
            >
              <PlusCircle className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              <span>New Listing</span>
            </Link>
          </div>
        </section>

        {/* MAIN BODY SCROLL AREA */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {profileSaved && (
            <p
              role="status"
              className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950"
            >
              Profile saved.
            </p>
          )}

          {/* 3. ELEVATED STATS / KPI CARD OVERLAPPING HEADER */}
          <section className="-mt-10 relative z-20">
            <div className="rounded-3xl border border-navy/10 bg-[#031B4E] p-4 text-white shadow-2xl">
              <div className="grid grid-cols-4 divide-x divide-white/10 text-center">
                {/* 1. Listings */}
                <div className="space-y-1 px-1 flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-black text-white">{listingsValue}</p>
                  <p className="text-[10px] font-bold text-white/60">Listings</p>
                  <span className="h-0.5 w-6 bg-purple-400 rounded-full" />
                </div>

                {/* 2. Likes */}
                <div className="space-y-1 px-1 flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-pink-300">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-black text-white">24</p>
                  <p className="text-[10px] font-bold text-white/60">Likes</p>
                  <span className="h-0.5 w-6 bg-pink-400 rounded-full" />
                </div>

                {/* 3. Profile Views */}
                <div className="space-y-1 px-1 flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <Users className="h-4 w-4" />
                  </span>
                  <p className="text-lg font-black text-white">156</p>
                  <p className="text-[10px] font-bold text-white/60">Profile Views</p>
                  <span className="h-0.5 w-6 bg-emerald-400 rounded-full" />
                </div>

                {/* 4. Rating */}
                <div className="space-y-1 px-1 flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                    <Star className="h-4 w-4 fill-amber-300" />
                  </span>
                  <p className="text-lg font-black text-white">4.8</p>
                  <p className="text-[10px] font-bold text-white/60">Rating</p>
                  <span className="h-0.5 w-6 bg-amber-400 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. PEOPLE WAITING FOR ME: RECENT CONVERSATIONS */}
          <section className="space-y-3">
            <SectionHeader title="Recent Conversations" href="/conversations" />

            <div className="rounded-2xl border border-navy/[0.06] bg-white p-4 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.18)]">
              <div className="divide-y divide-navy/[0.06]">
                {sampleConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href="/conversations"
                    prefetch
                    className="pressable group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-surface/80"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="h-10 w-10 rounded-full object-cover border border-navy/10 shadow-xs shrink-0"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-navy truncate">{conv.name}</h3>
                          <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-bold", conv.tagTone)}>
                            {conv.tag}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-navy/60 truncate">{conv.message}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="text-[10px] font-medium text-navy/40">{conv.time}</span>
                      {conv.unread > 0 && (
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold text-[9px] font-black text-navy shadow-xs">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 4. BUSINESS TOOLS: QUICK ACTIONS */}
          <section className="space-y-3">
            <SectionHeader title="Quick Actions" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* 5. BUSINESS HEALTH: BUSINESS SNAPSHOT ON WHITE CARD SURFACE */}
          <section className="space-y-3">
            <SectionHeader title="Business Snapshot" href="/seller/crm" />

            <div className="rounded-2xl border border-navy/[0.06] bg-white p-4 sm:p-5 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.18)]">
              <div className="grid grid-cols-3 gap-3 divide-x divide-navy/[0.08]">
                {/* Column 1: Active Leads */}
                <div className="space-y-1 px-2 first:pl-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    <span>Active Leads</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-navy">{leadsCount}</p>
                  <p className="text-[10px] font-medium text-emerald-600">● 0% vs last 7 days</p>
                </div>

                {/* Column 2: Listings */}
                <div className="space-y-1 px-3 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Briefcase className="h-3.5 w-3.5" />
                    </span>
                    <span>Listings</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-navy">{listingsValue}</p>
                  <p className="text-[10px] font-medium text-blue-600">● 0% vs last 7 days</p>
                </div>

                {/* Column 3: Trust Score */}
                <div className="space-y-1 pl-3 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Shield className="h-3.5 w-3.5 text-gold" />
                    </span>
                    <span>Trust Score</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums text-gold">{trustScore}</p>
                  <p className="text-[10px] font-medium text-emerald-600">↑ 2 pts this week</p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. HISTORY: RECENT ACTIVITY */}
          <section className="space-y-3">
            <SectionHeader title="Recent Activity" href="/seller/crm" />

            <div className="rounded-2xl border border-navy/[0.06] bg-white p-5 shadow-[0_4px_18px_-14px_rgba(3,27,78,0.18)]">
              <div className="divide-y divide-navy/[0.06]">
                {sampleActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="flex items-center justify-between gap-3 py-1 first:pt-0 last:pb-0">
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
            </div>
          </section>

          {/* ACCOUNT SETTINGS ACCORDION */}
          <section>
            <details className="group overflow-hidden rounded-2xl border border-navy/[0.06] bg-white shadow-[0_4px_18px_-14px_rgba(3,27,78,0.18)]">
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

        </main>
      </div>
    </div>
  );
}
