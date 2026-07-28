"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  Camera,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  HelpCircle,
  Key,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  PlusCircle,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  User,
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

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between px-0.5 mb-2.5">
      <h2 className="text-sm font-black tracking-tight text-navy sm:text-base">
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
 * USER DASHBOARD — FINAL SURGICAL REFINEMENTS
 * 1. Shows first 3 messages in Recent Conversations
 * 2. 1x4 horizontal grid for Recent Activity
 * 3. Collapsible Account Settings & Controls
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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const nameToDisplay =
    profile.full_name?.trim() ||
    profile.username ||
    profile.company_name?.trim() ||
    "Stanley";

  const trustScore = profile.trust_score ?? 100;
  const listingsValue = totalListings > 0 ? totalListings : 1;

  // 1. FIRST 3 CONVERSATIONS
  const sampleConversations = [
    {
      id: "conv-1",
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop",
      badge: "Offer accepted",
      badgeTone: "bg-emerald-100 text-emerald-800 border-emerald-200",
      message: "Great! When can we schedule the viewing?",
      time: "2m ago",
      unread: 1,
    },
    {
      id: "conv-2",
      name: "Mary James",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&fit=crop",
      badge: "Viewing request",
      badgeTone: "bg-blue-100 text-blue-800 border-blue-200",
      message: "I'd like to schedule a viewing for tomorrow.",
      time: "1h ago",
      unread: 2,
    },
    {
      id: "conv-3",
      name: "Daniel Peter",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&fit=crop",
      badge: "Documents ready",
      badgeTone: "bg-purple-100 text-purple-800 border-purple-200",
      message: "Please find the property documents attached.",
      time: "3h ago",
      unread: 0,
    },
  ];

  // 2. RECENT ACTIVITY
  const sampleActivities = [
    {
      id: "act-1",
      title: "New lead",
      subtitle: "John Doe viewed listing",
      time: "5m ago",
      icon: Users,
      tone: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    },
    {
      id: "act-2",
      title: "New like",
      subtitle: "Mary liked listing",
      time: "45m ago",
      icon: Heart,
      tone: "bg-pink-50 text-pink-600 border border-pink-200",
    },
    {
      id: "act-3",
      title: "Profile view",
      subtitle: "Someone viewed profile",
      time: "2h ago",
      icon: Eye,
      tone: "bg-blue-50 text-blue-600 border border-blue-200",
    },
    {
      id: "act-4",
      title: "Listing created",
      subtitle: "Created new listing",
      time: "3h ago",
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600 border border-amber-200",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#031B4E] p-5 text-white border-r border-white/10 sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
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

          <nav className="space-y-1" aria-label="Main Navigation">
            <SidebarNavItem href="/agent" icon={LayoutDashboard} label="Dashboard" active />
            <SidebarNavItem href="/conversations" icon={MessageSquare} label="Conversations" badge={3} />
            <SidebarNavItem href="/discover" icon={Sparkles} label="Discover" />
            <SidebarNavItem href="/agent/listings/choose" icon={PlusCircle} label="Sell" />
          </nav>

          <hr className="border-white/10" />

          <nav className="space-y-1" aria-label="Merchant Navigation">
            <SidebarNavItem href="/agent/listings" icon={List} label="My Listings" />
            <SidebarNavItem href="/seller/crm" icon={BarChart3} label="Analytics" />
            <SidebarNavItem href="/payments/history" icon={Wallet} label="Payments" />
            <SidebarNavItem href="/agent/verification" icon={Shield} label="Verification" />
          </nav>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-[#021428] to-[#072462] p-4 text-white space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="text-xs font-bold text-white">Yike Premium</span>
          </div>
          <p className="text-[11px] text-white/70">Grow your business with priority lead routing.</p>
          <Link
            href="/pricing"
            className="pressable flex w-full h-8 items-center justify-center rounded-xl bg-gold text-xs font-black text-navy shadow-xs"
          >
            Upgrade
          </Link>
        </div>
      </aside>

      {/* CONTINUOUS DASHBOARD BODY */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">

        {/* HERO HEADER WITH EMBEDDED KPI STRIP */}
        <section className="relative bg-[#031B4E] text-white px-4 pt-3 pb-5 rounded-b-[2.5rem] shadow-2xl space-y-4">
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

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <AvatarUpload
                userId={profile.id}
                email={email}
                name={profile.full_name}
                username={profile.username}
                avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                size="xl"
                className="!h-22 !w-22 rounded-full border-4 border-white/20 shadow-2xl"
              />
              <Link
                href="/agent/edit-profile"
                className="pressable absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-navy shadow-md ring-2 ring-[#031B4E]"
                aria-label="Edit Profile Photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-white/70">Welcome back,</p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl truncate">
                {nameToDisplay}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  {verified ? "Verified Seller" : "Verification Pending"}
                </span>
                <span className="inline-flex items-center gap-1 text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-gold/80" />
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* EMBEDDED KPI STRIP */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="grid grid-cols-4 divide-x divide-white/10 text-center">
              <Link
                href="/agent/listings"
                prefetch
                className="pressable flex flex-col items-center gap-1 px-1 py-1 transition-all hover:bg-white/5 rounded-xl"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <span className="text-base font-black text-white">{listingsValue}</span>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-white/70">
                  <span>Listings</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>

              <Link
                href="/saved"
                prefetch
                className="pressable flex flex-col items-center gap-1 px-1 py-1 transition-all hover:bg-white/5 rounded-xl"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300">
                  <Heart className="h-4 w-4" />
                </span>
                <span className="text-base font-black text-white">24</span>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-white/70">
                  <span>Likes</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>

              <Link
                href="/seller/crm"
                prefetch
                className="pressable flex flex-col items-center gap-1 px-1 py-1 transition-all hover:bg-white/5 rounded-xl"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Users className="h-4 w-4" />
                </span>
                <span className="text-base font-black text-white">156</span>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-white/70">
                  <span>Profile Views</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>

              <Link
                href="/seller/crm"
                prefetch
                className="pressable flex flex-col items-center gap-1 px-1 py-1 transition-all hover:bg-white/5 rounded-xl"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <Star className="h-4 w-4 fill-amber-300" />
                </span>
                <span className="text-base font-black text-white">4.8</span>
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-white/70">
                  <span>Rating</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            </div>
          </div>

          {/* NEW LISTING BUTTON */}
          <div className="pt-2">
            <Link
              href="/agent/listings/choose"
              prefetch
              className="pressable flex w-full h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-black text-navy shadow-[0_6px_24px_rgba(228,181,71,0.5)] transition-all hover:bg-gold-light"
            >
              <PlusCircle className="h-5 w-5" strokeWidth={2.5} />
              <span>New Listing</span>
            </Link>
          </div>
        </section>

        {/* MAIN SCROLL CONTAINER */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">

          {profileSaved && (
            <p
              role="status"
              className="rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-950"
            >
              Profile saved.
            </p>
          )}

          {/* 1. RECENT CONVERSATIONS — FIRST 3 MESSAGES */}
          <section className="space-y-2.5">
            <SectionHeader title="Recent Conversations" href="/conversations" />

            <div className="rounded-3xl border border-navy/[0.06] bg-white p-4 shadow-xs divide-y divide-navy/[0.05]">
              {sampleConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href="/conversations"
                  prefetch
                  className="pressable group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-surface/60 rounded-xl"
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
                        <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold", conv.badgeTone)}>
                          {conv.badge}
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
          </section>

          {/* QUICK ACTIONS — ONE HORIZONTAL ROW OF 4 TILES */}
          <section className="space-y-2.5">
            <SectionHeader title="Quick Actions" />

            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/agent/listings"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-navy/[0.06] bg-white p-3 text-center shadow-xs transition-all hover:border-navy/15"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <List className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-bold text-navy">My Listings</h3>
                  <p className="text-[9px] font-medium text-navy/45 truncate">Manage your listings</p>
                </div>
                <ChevronRight className="h-3 w-3 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/agent/verification"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-navy/[0.06] bg-white p-3 text-center shadow-xs transition-all hover:border-navy/15"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Shield className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-bold text-navy">Verification</h3>
                  <p className="text-[9px] font-medium text-navy/45 truncate">Complete verification</p>
                </div>
                <ChevronRight className="h-3 w-3 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/seller/crm"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-navy/[0.06] bg-white p-3 text-center shadow-xs transition-all hover:border-navy/15"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-bold text-navy">Analytics</h3>
                  <p className="text-[9px] font-medium text-navy/45 truncate">View insights</p>
                </div>
                <ChevronRight className="h-3 w-3 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/payments/history"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-navy/[0.06] bg-white p-3 text-center shadow-xs transition-all hover:border-navy/15"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Wallet className="h-5 w-5" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-[11px] font-bold text-navy">Payments</h3>
                  <p className="text-[9px] font-medium text-navy/45 truncate">Manage transactions</p>
                </div>
                <ChevronRight className="h-3 w-3 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </section>

          {/* BUSINESS SNAPSHOT */}
          <section className="space-y-2.5">
            <SectionHeader title="Business Snapshot" href="/seller/crm" />

            <div className="rounded-3xl border border-navy/[0.06] bg-white p-4 shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-navy/[0.06] text-center">
                <Link href="/seller/crm" prefetch className="pressable px-2 py-1 space-y-1 block">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    <span>Active Leads</span>
                  </div>
                  <p className="text-2xl font-black text-navy">{leadsCount}</p>
                  <p className="text-[10px] font-bold text-emerald-600">● 0% vs last 7 days</p>
                </Link>

                <Link href="/agent/listings" prefetch className="pressable px-2 py-1 space-y-1 block">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Briefcase className="h-3.5 w-3.5" />
                    </span>
                    <span>Listings</span>
                  </div>
                  <p className="text-2xl font-black text-navy">{listingsValue}</p>
                  <p className="text-[10px] font-bold text-blue-600">● 0% vs last 7 days</p>
                </Link>

                <Link href="/agent/verification" prefetch className="pressable px-2 py-1 space-y-1 block">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-navy/80">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Shield className="h-3.5 w-3.5 text-gold" />
                    </span>
                    <span>Trust Score</span>
                  </div>
                  <p className="text-2xl font-black text-gold">{trustScore}</p>
                  <p className="text-[10px] font-bold text-emerald-600">↑ 2 pts this week</p>
                </Link>
              </div>
            </div>
          </section>

          {/* 2. RECENT ACTIVITY — 1x4 HORIZONTAL GRID */}
          <section className="space-y-2.5">
            <SectionHeader title="Recent Activity" href="/seller/crm" />

            <div className="grid grid-cols-4 gap-2">
              {sampleActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.id}
                    href="/seller/crm"
                    prefetch
                    className="pressable rounded-2xl border border-navy/[0.06] bg-white p-2.5 space-y-1 shadow-xs hover:border-navy/15 block text-center flex flex-col items-center justify-between min-h-[96px]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-xl", act.tone)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-medium text-navy/40">{act.time}</span>
                    </div>
                    <div className="space-y-0.5 w-full">
                      <h3 className="text-[10px] font-bold text-navy truncate">{act.title}</h3>
                      <p className="text-[8px] font-medium text-navy/55 truncate">{act.subtitle}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 3. ACCOUNT SETTINGS & CONTROLS — COLLAPSIBLE ACCORDION */}
          <section className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => setAccountSettingsOpen((v) => !v)}
              className="pressable flex w-full items-center justify-between rounded-2xl border border-navy/10 bg-white p-4 shadow-xs text-left"
            >
              <h2 className="text-sm font-black tracking-tight text-navy sm:text-base">
                Account Settings & Controls
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy/60">
                <span>{accountSettingsOpen ? "Collapse" : "Tap to open"}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", accountSettingsOpen && "rotate-180")} />
              </div>
            </button>

            {accountSettingsOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* 1. Edit Profile */}
                <Link
                  href="/agent/edit-profile"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Edit Profile</h3>
                      <p className="text-[10px] font-medium text-navy/45">Name, photo & public details</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 2. Help Center */}
                <Link
                  href="/contact"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <HelpCircle className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Help Center</h3>
                      <p className="text-[10px] font-medium text-navy/45">Safety tips & guides</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 3. Change Password */}
                <Link
                  href="/auth/reset-password"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Key className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Change Password</h3>
                      <p className="text-[10px] font-medium text-navy/45">Update your login password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 4. Contact Support */}
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable group flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <MessageCircle className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Contact Support</h3>
                      <p className="text-[10px] font-medium text-navy/45">Chat with us on WhatsApp</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* 5. Change Email */}
                <button
                  type="button"
                  onClick={() => alert("Change email prompt: " + email)}
                  className="pressable group text-left flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15 w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Change Email</h3>
                      <p className="text-[10px] font-medium text-navy/45">We&apos;ll verify the new address</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 6. Signed in as */}
                <div className="flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shrink-0">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[10px] font-medium text-navy/45">Signed in as</h3>
                      <p className="text-xs font-bold text-navy truncate">{email || "puchinenye@gmail.com"}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/30 shrink-0" />
                </div>

                {/* 7. Advanced */}
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings((v) => !v)}
                  className="pressable group text-left flex items-center justify-between rounded-2xl border border-navy/[0.06] bg-white p-3.5 shadow-xs hover:border-navy/15 w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy/5 text-navy/60">
                      <ChevronDown className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Advanced</h3>
                      <p className="text-[10px] font-medium text-navy/45">Manage advanced settings</p>
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-navy/30 transition-transform", showAdvancedSettings && "rotate-180")} />
                </button>

                {/* 8. Log Out */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="pressable group text-left flex items-center justify-between rounded-2xl border border-rose-200/70 bg-white p-3.5 shadow-xs hover:bg-rose-50/50 w-full"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                      <LogOut className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-rose-600">Log Out</h3>
                      <p className="text-[10px] font-medium text-rose-950/60">Sign out from your account</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}

            {showAdvancedSettings && accountSettingsOpen && (
              <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-xs space-y-3">
                <p className="text-xs font-bold text-navy">Advanced Account Options</p>
                <ProfileAccountActions email={email} canList />
              </div>
            )}
          </section>

        </main>
      </div>

      {/* LOGOUT CONFIRMATION DIALOG */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-navy">Log out of Yike?</h3>
            <p className="text-xs font-medium text-navy/60">
              You will need to sign in again to access your dashboard and listings.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="pressable flex-1 rounded-full border border-navy/15 py-2.5 text-xs font-bold text-navy"
              >
                Cancel
              </button>
              <Link
                href="/auth/login"
                className="pressable flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md text-center"
              >
                Log Out
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
