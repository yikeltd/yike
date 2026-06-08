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
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { VerifiedBadge, StatusBadge } from "@/components/ui/badge";
import { ProfileAccountActions } from "@/components/profile/profile-account-actions";
import { OptionalWhatsAppCard } from "@/components/profile/optional-whatsapp-card";
import { ProfileUserActivityStats } from "@/components/profile/profile-user-activity-stats";
import { ProfileVerificationJourney } from "@/components/profile/profile-verification-journey";
import { isPhoneOtpEnabledClient } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { accountStatusMessage } from "@/lib/account-control";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { VerificationTrustGate } from "@/components/verification/verification-trust-gate";
import {
  formatListingSlots,
  getProfilePersona,
  profileRoleLabel,
  showAgentBadge,
} from "@/lib/profile-display";

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
  const phoneOtpOn = isPhoneOtpEnabledClient();
  const persona = getProfilePersona(profile);
  const isLister = canList;
  const roleLabel = profileRoleLabel(profile, verified);

  const completionSteps = [
    Boolean(profile.avatar_url),
    Boolean(profile.full_name),
    phoneOtpOn
      ? profile.phone_verified
      : Boolean(profile.phone || profile.whatsapp),
    profile.email_verified,
  ];
  const completionPct = Math.round(
    (completionSteps.filter(Boolean).length / completionSteps.length) * 100
  );
  const statusMessage = accountStatusMessage(profile);
  const trustCaps = getTrustCapabilities(profile);
  const verificationTasks = getRequiredVerificationTasks(profile);
  const showTrustGate = trustCaps.verificationRequired && isLister;
  const slotsLabel = formatListingSlots(activeCount, limit, verified);

  return (
    <div className="space-y-5 pb-4">
      {showTrustGate ? (
        <VerificationTrustGate tasks={verificationTasks} />
      ) : statusMessage ? (
        <div
          className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-[1.75rem] bg-navy px-5 pb-6 pt-8 text-white shadow-float-lg">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col items-center text-center">
          <AvatarUpload
            userId={profile.id}
            email={email}
            name={profile.full_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
          />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{displayName}</h1>
          {profile.username && (
            <p className="mt-1 text-sm text-white/75">@{profile.username}</p>
          )}
          <p className="mt-2 text-xs text-white/60">Member since {memberSince}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {showAgentBadge(profile, verified) ? <VerifiedBadge /> : null}
            {roleLabel ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {roleLabel}
              </span>
            ) : null}
            {profile.verification_status !== "not_started" &&
              !verified &&
              isLister && (
                <StatusBadge status={profile.verification_status} />
              )}
          </div>
        </div>
      </section>

      <Link
        href={isLister ? "/agent/listings/new" : "/agent/become"}
        className="pressable block overflow-hidden rounded-2xl bg-gold shadow-glow-gold ring-1 ring-gold-dark/20"
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy">
            <PlusCircle className="h-6 w-6 text-gold" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-navy">List a property</p>
            <p className="text-xs font-medium text-navy/75">
              {isLister
                ? "Post a new home on Yike"
                : "Verify your profile to start listing"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-navy/60" />
        </div>
      </Link>

      {isLister && (
        <ProfileVerificationJourney profile={profile} verified={verified} />
      )}

      {completionPct < 100 && persona === "user" && (
        <section className="rounded-2xl border border-gold/25 bg-gold/8 p-3.5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 shrink-0 text-gold-dark" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">Profile {completionPct}% complete</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <OptionalWhatsAppCard
        userId={profile.id}
        phone={profile.phone}
        whatsapp={profile.whatsapp}
        phoneVerified={profile.phone_verified}
      />

      {isLister ? (
        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={Heart} label="Saved homes" value={String(savedCount)} href="/saved" />
          <StatCard
            icon={List}
            label="Listing slots"
            value={slotsLabel}
            href="/agent/listings"
            smallValue
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
              icon={List}
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
              title="Post new listing"
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
            {(profile.account_type === "agency" ||
              profile.account_type === "developer" ||
              profile.company_name) && (
              <ActionLink href="/agent/company" icon={ShieldCheck} title="Company profile" />
            )}
            <ActionLink
              href="/agent/verification"
              icon={verified ? BadgeCheck : ShieldCheck}
              title={verified ? "Manage verification" : "Get verified"}
              accent={!verified}
            />
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
              accent
            />
          </>
        )}
      </section>

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
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  href: string;
  smallValue?: boolean;
}) {
  return (
    <Link
      href={href}
      className="pressable rounded-2xl border border-border bg-elevated p-4 shadow-float"
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
  primary,
  accent,
}: {
  href: string;
  icon: typeof PlusCircle;
  title: string;
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
      <span className="font-semibold">{title}</span>
    </Link>
  );
}
