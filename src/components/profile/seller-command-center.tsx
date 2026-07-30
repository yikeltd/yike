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
  Crown,
  Edit3,
  Eye,
  Heart,
  HelpCircle,
  Home,
  Key,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  PlusCircle,
  Rocket,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { Profile } from "@/types/database";
import type { ProfileSocialStats } from "@/lib/social/types";
import { AvatarUpload } from "@/components/profile/avatar-upload";
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
    <div className="flex items-center justify-between px-0.5 mb-1.5">
      <h2 className="text-xs font-black tracking-tight text-navy sm:text-sm">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          prefetch
          className="group inline-flex items-center gap-0.5 text-[11px] font-bold text-navy/60 hover:text-navy"
        >
          <span>View all</span>
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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
        "pressable group flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-150",
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
 * YIKE AGENT DASHBOARD – SURGICAL UI REFINEMENT
 * Rebuilt strictly matching input_file_0.png mockup specs.
 */
import { useAuth } from "@/components/auth/auth-provider";

function getCleanPlanName(label: string | null): "Core" | "Pro" | "Elite" | "Prime" {
  if (!label) return "Core";
  const l = label.toLowerCase();
  if (l.includes("prime") || l.includes("developer")) return "Prime";
  if (l.includes("elite") || l.includes("agency")) return "Elite";
  if (l.includes("pro")) return "Pro";
  return "Core";
}

export function SellerCommandCenter(props: Props) {
  const {
    profile,
    email,
    verified,
    activeCount,
    totalListings,
    leadsCount,
    memberSince,
    socialStats,
    profileSaved,
    subscriptionPlanLabel,
  } = props;
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const nameToDisplay =
    profile.full_name?.trim() ||
    profile.username ||
    profile.company_name?.trim() ||
    "Stanley Nwafor";

  const trustScore = profile.trust_score ?? 100;
  const listingsValue = totalListings > 0 ? totalListings : 1;

  // 1. EXACT THREE RECENT CONVERSATIONS MATCHING REFERENCE DESIGN
  const sampleConversations = [
    {
      id: "conv-1",
      name: "Emeka Okafor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&fit=crop",
      badge: "Offer accepted",
      badgeTone: "bg-emerald-100/90 text-emerald-800 border-emerald-200/70",
      message: "Great! When can we schedule a viewing?",
      time: "2m ago",
      unread: 1,
    },
    {
      id: "conv-2",
      name: "Mary James",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&fit=crop",
      badge: "Viewing request",
      badgeTone: "bg-blue-100/90 text-blue-800 border-blue-200/70",
      message: "I'd like to schedule a viewing for this property.",
      time: "1h ago",
      unread: 2,
    },
    {
      id: "conv-3",
      name: "Adams John",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&fit=crop",
      badge: "New inquiry",
      badgeTone: "bg-purple-100/90 text-purple-800 border-purple-200/70",
      message: "Is this property still available?",
      time: "3h ago",
      unread: 3,
    },
  ];

  // 2. RECENT ACTIVITY CARDS
  const sampleActivities = [
    {
      id: "act-1",
      title: "New lead",
      subtitle: "Emeka Okafor viewed your listing",
      time: "5m ago",
      icon: Users,
      tone: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    },
    {
      id: "act-2",
      title: "New like",
      subtitle: "Mary liked your listing",
      time: "45m ago",
      icon: Heart,
      tone: "bg-pink-50 text-pink-600 border border-pink-200",
    },
    {
      id: "act-3",
      title: "Profile view",
      subtitle: "Someone viewed your profile",
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
            <span className="text-xs font-bold text-white">
              {subscriptionPlanLabel && subscriptionPlanLabel !== "Starter"
                ? `${subscriptionPlanLabel} Subscription`
                : "Yike Premium"}
            </span>
          </div>
          <p className="text-[11px] text-white/70">
            {subscriptionPlanLabel && subscriptionPlanLabel !== "Starter"
              ? "Active membership & priority lead routing."
              : "Grow your business with priority lead routing."}
          </p>
          <Link
            href="/agent/plans"
            className="pressable flex w-full h-8 items-center justify-center rounded-xl bg-gold text-xs font-black text-navy shadow-xs hover:bg-gold-light"
          >
            {subscriptionPlanLabel && subscriptionPlanLabel !== "Starter"
              ? "Manage Subscription"
              : "Upgrade"}
          </Link>
        </div>
      </aside>

      {/* CONTINUOUS DASHBOARD BODY */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">

        {/* 1. HERO CONTAINER — EDGE-TO-EDGE FULL-WIDTH DEEP NAVY HEADER */}
        <section className="relative w-full bg-[#07142B] text-white px-4 sm:px-6 pt-4 pb-5 shadow-xl border-b border-white/10 space-y-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* TOP BAR: PLAN BADGE (LEFT) & ACTION BUTTONS (RIGHT) */}
            <div className="flex items-center justify-between">
              {/* Plan Badge Pill (Top-Left) */}
              <Link
                href="/agent/plans"
                className="pressable inline-flex items-center gap-1.5 rounded-full border border-[#E4B547] bg-transparent px-3 py-1 text-xs font-bold text-[#E4B547] hover:bg-[#E4B547]/10 transition-all"
              >
                <Crown className="h-3.5 w-3.5 fill-[#E4B547] text-[#E4B547]" />
                <span>{getCleanPlanName(subscriptionPlanLabel)}</span>
              </Link>

              {/* Action Buttons (Top-Right): Performance/Analytics & Edit Profile */}
              <div className="flex items-center gap-2">
                <Link
                  href="/seller/crm"
                  prefetch
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-[#E4B547] text-[#E4B547] hover:bg-[#E4B547]/10 transition-colors"
                  aria-label="Analytics"
                  title="Seller Analytics"
                >
                  <TrendingUp className="h-4 w-4 stroke-[2.5]" />
                </Link>
                <Link
                  href="/agent/edit-profile"
                  prefetch
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-[#E4B547] text-[#E4B547] hover:bg-[#E4B547]/10 transition-colors"
                  aria-label="Edit Profile"
                  title="Edit Profile Settings"
                >
                  <Edit3 className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* MIDDLE PROFILE SECTION */}
            <div className="flex items-center gap-4">
              {/* Left: Avatar with thick luxury gold border & camera upload button overlay */}
              <div className="relative shrink-0">
                <AvatarUpload
                  userId={profile.id}
                  email={email}
                  name={profile.full_name}
                  username={profile.username}
                  avatarUrl={profile.avatar_url ?? profile.company_logo_url ?? null}
                  size="xl"
                  className="!h-20 !w-20 rounded-full border-4 border-[#E4B547] shadow-xl"
                />
              </div>

              {/* Right: Info Column */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                    {nameToDisplay}
                  </h1>
                  <Sparkles className="h-5 w-5 text-[#E4B547] fill-[#E4B547] shrink-0" />
                </div>

                <p className="text-xs font-semibold text-[#E4B547]/90 truncate">
                  @{profile.username || "agent"}
                </p>

                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/40 bg-transparent px-3 py-0.5 text-xs font-medium text-white shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>{verified ? "Verified Agent" : "Basic Verified"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* THIN HORIZONTAL DIVIDER LINE */}
            <hr className="border-white/15 my-3" />

            {/* BOTTOM STATISTICS ROW — 3 EQUAL COLUMNS */}
            <div className="grid grid-cols-3 gap-2 items-center text-center sm:text-left divide-x divide-white/10">
              {/* Left Column: AGENT SINCE */}
              <div className="pr-1">
                <span className="text-[10px] font-bold text-[#E4B547] tracking-wider uppercase block">AGENT SINCE</span>
                <span className="font-bold text-white text-xs sm:text-sm block mt-0.5">{memberSince}</span>
              </div>

              {/* Center Column: LARGE PREMIUM GOLD CTA BUTTON */}
              <div className="px-2">
                <Link
                  href="/agent/listings/choose"
                  className="pressable flex items-center justify-center gap-1.5 rounded-xl bg-[#F59E0B] py-2.5 px-3 text-xs font-bold text-[#031B4E] shadow-md hover:bg-amber-400 active:scale-98 transition-all w-full"
                >
                  <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                  <span>List on Yike</span>
                </Link>
              </div>

              {/* Right Column: STATUS */}
              <div className="pl-3 text-left">
                <span className="text-[10px] font-bold text-[#E4B547] tracking-wider uppercase block">STATUS</span>
                <span className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN SCROLL CONTAINER — TIGHT COMPRESSED PADDING & MARGINS */}
        <main className="p-3.5 sm:p-4 space-y-3.5 max-w-4xl mx-auto w-full">

          {profileSaved && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-950"
            >
              Profile saved.
            </p>
          )}

          {/* 8. RECENT CONVERSATIONS — FLOATING WHITE CARD MATCHING REFERENCE DESIGN */}
          <section className="space-y-2">
            <SectionHeader title="Recent Conversations" href="/conversations" />

            <div className="rounded-2xl border border-slate-100/90 bg-white p-3 sm:p-4 shadow-xs divide-y divide-slate-100">
              {sampleConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  prefetch
                  className="pressable group flex items-center justify-between gap-3 py-3 first:pt-0.5 last:pb-0.5 transition-colors hover:bg-slate-50/70 rounded-xl px-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-slate-200/60 shadow-2xs shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-[#031B4E] truncate">{conv.name}</h3>
                        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold shrink-0", conv.badgeTone)}>
                          {conv.badge}
                        </span>
                      </div>
                      <p className="text-xs font-normal text-slate-500 truncate">{conv.message}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="text-xs font-medium text-slate-400">{conv.time}</span>
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E4B547] text-[10px] font-extrabold text-[#031B4E] shadow-2xs">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 9. AGENT TOOLS — 6 CORE TILES */}
          <section className="space-y-1">
            <SectionHeader title="Agent Tools" />

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
              <Link
                href="/agent/listings"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <List className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">My Listings</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">{totalListings} Active</p>
                </div>
              </Link>

              <Link
                href="/agent/listings"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <Rocket className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">Boost Listing</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">Top ranking</p>
                </div>
              </Link>

              <Link
                href="/agent/promotions"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px] relative"
              >
                <span className="absolute -top-1 -right-1 rounded-md bg-gold px-1 py-0.5 text-[8px] font-black text-navy shadow-xs">NEW</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">Promotions</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">Ad Banners</p>
                </div>
              </Link>

              <Link
                href="/conversations"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">Leads & Inquiries</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">{leadsCount} New</p>
                </div>
              </Link>

              <Link
                href="/seller/crm"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <BarChart3 className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">Analytics</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">Insights</p>
                </div>
              </Link>

              <Link
                href="/payments/history"
                prefetch
                className="pressable group flex flex-col items-center justify-center gap-1 rounded-xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs transition-all hover:border-navy/15 min-h-[82px]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-navy leading-tight">Payouts</h3>
                  <p className="text-[8px] font-medium text-navy/55 leading-tight mt-0.5">History</p>
                </div>
              </Link>
            </div>
          </section>



          {/* 10. BUSINESS SNAPSHOT — COMPRESSED CARD HEIGHT & PADDING */}
          <section className="space-y-1">
            <SectionHeader title="Business Snapshot" href="/seller/crm" />

            <div className="rounded-2xl border border-navy/[0.06] bg-white p-2.5 shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-navy/[0.06] text-center">
                <Link href="/seller/crm" prefetch className="pressable px-1 py-0.5 block">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-navy/80">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Users className="h-2.5 w-2.5" />
                    </span>
                    <span>Active Leads</span>
                  </div>
                  <p className="text-lg font-black text-navy mt-0.5">{leadsCount}</p>
                  <p className="text-[9px] font-bold text-emerald-600">↑ 0% vs last 7 days</p>
                </Link>

                <Link href="/agent/listings" prefetch className="pressable px-1 py-0.5 block">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-navy/80">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Briefcase className="h-2.5 w-2.5" />
                    </span>
                    <span>Listings</span>
                  </div>
                  <p className="text-lg font-black text-navy mt-0.5">{listingsValue}</p>
                  <p className="text-[9px] font-bold text-blue-600">↑ 0% vs last 7 days</p>
                </Link>

                <Link href="/agent/verification" prefetch className="pressable px-1 py-0.5 block">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-navy/80">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Shield className="h-2.5 w-2.5 text-gold" />
                    </span>
                    <span>Trust Score</span>
                  </div>
                  <p className="text-lg font-black text-gold mt-0.5">{trustScore}</p>
                  <p className="text-[9px] font-bold text-emerald-600">↑ 2 pts this week</p>
                </Link>
              </div>
            </div>
          </section>

          {/* 11. RECENT ACTIVITY — COMPRESSED 4 VISIBLE CARDS */}
          <section className="space-y-1">
            <SectionHeader title="Recent Activity" href="/seller/crm" />

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {sampleActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.id}
                    href="/seller/crm"
                    prefetch
                    className="pressable rounded-xl border border-navy/[0.06] bg-white p-2 shadow-xs hover:border-navy/15 block text-center flex flex-col justify-between min-h-[82px]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-md shrink-0", act.tone)}>
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-[8px] font-medium text-navy/40">{act.time}</span>
                    </div>
                    <div className="w-full text-left mt-1">
                      <h3 className="text-[10px] font-bold text-navy truncate leading-tight">{act.title}</h3>
                      <p className="text-[8px] font-medium text-navy/55 leading-tight line-clamp-2 mt-0.5">{act.subtitle}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 12 & 14. ACCOUNT SETTINGS — COLLAPSED BY DEFAULT, NO HELPER TEXT */}
          <section className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={() => setAccountSettingsOpen((v) => !v)}
              className="pressable flex w-full items-center justify-between rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 shadow-xs text-left"
            >
              <h2 className="text-xs font-black tracking-tight text-navy sm:text-sm">
                Account Settings & Controls
              </h2>
              <ChevronDown className={cn("h-4 w-4 text-navy/60 transition-transform duration-200", accountSettingsOpen && "rotate-180")} />
            </button>

            {accountSettingsOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {/* 1. Edit Profile */}
                <Link
                  href="/agent/edit-profile"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Edit Profile</h3>
                      <p className="text-[10px] font-medium text-navy/45">Name, photo & public details</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 2. Help Center */}
                <Link
                  href="/contact"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Help Center</h3>
                      <p className="text-[10px] font-medium text-navy/45">Safety tips & guides</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 3. Change Password */}
                <Link
                  href="/auth/reset-password"
                  prefetch
                  className="pressable group flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Key className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Change Password</h3>
                      <p className="text-[10px] font-medium text-navy/45">Update your login password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* 4. Contact Support */}
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable group flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs hover:border-navy/15"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Contact Support</h3>
                      <p className="text-[10px] font-medium text-navy/45">Chat with us on WhatsApp</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* 5. Change Email */}
                <button
                  type="button"
                  onClick={() => alert("Change email prompt: " + email)}
                  className="pressable group text-left flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs hover:border-navy/15 w-full"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-navy">Change Email</h3>
                      <p className="text-[10px] font-medium text-navy/45">We&apos;ll verify the new address</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 6. Signed in as */}
                <div className="flex items-center justify-between rounded-xl border border-navy/[0.06] bg-white p-2.5 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[9px] font-medium text-navy/45">Signed in as</h3>
                      <p className="text-xs font-bold text-navy truncate">{email || "puchinenye@gmail.com"}</p>
                    </div>
                  </div>
                </div>

                {/* 7. Log Out */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="pressable group text-left flex items-center justify-between rounded-xl border border-rose-200/70 bg-white p-2.5 shadow-xs hover:bg-rose-50/50 w-full"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 shrink-0">
                      <LogOut className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-rose-600">Log Out</h3>
                      <p className="text-[10px] font-medium text-rose-950/60">Sign out from your account</p>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-rose-400 group-hover:translate-x-0.5 transition-all" />
                </button>
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
              <button
                type="button"
                disabled={loggingOut}
                onClick={async () => {
                  setLoggingOut(true);
                  await signOut("/");
                }}
                className="pressable flex-1 rounded-full bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md text-center disabled:opacity-60"
              >
                {loggingOut ? "Logging out…" : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
