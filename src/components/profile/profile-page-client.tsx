"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  List,
  Bell,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { VerifiedBadge, StatusBadge } from "@/components/ui/badge";
import { AgentSignOut } from "@/app/agent/sign-out-button";
import { DeleteAccountLink } from "@/components/account/delete-account-link";
import { OptionalWhatsAppCard } from "@/components/profile/optional-whatsapp-card";
import { isPhoneOtpEnabledClient } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { accountStatusMessage } from "@/lib/account-control";

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
  memberSince: string;
}) {
  const displayName = profile.full_name ?? profile.username ?? "Your profile";
  const phoneOtpOn = isPhoneOtpEnabledClient();
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

  return (
    <div className="space-y-6 pb-4 pt-2">
      {statusMessage && (
        <div
          className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {statusMessage}
        </div>
      )}
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
            {verified ? (
              <VerifiedBadge />
            ) : canList ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Listing agent
              </span>
            ) : null}
            {profile.verification_status !== "not_started" && !verified && (
              <StatusBadge status={profile.verification_status} />
            )}
            {profile.phone_verified && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Phone ✓
              </span>
            )}
            {profile.email_verified && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Email ✓
              </span>
            )}
          </div>
        </div>
      </section>

      {completionPct < 100 && (
        <section className="rounded-2xl border border-gold/25 bg-gold/8 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">Make your profile stand out</p>
              <p className="mt-1 text-sm text-muted">
                A photo and verified contact details help agents and renters trust you faster.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-medium text-muted">{completionPct}% complete</p>
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

      <section className="grid grid-cols-2 gap-3">
        <StatCard icon={Heart} label="Saved homes" value={String(savedCount)} href="/saved" />
        {canList ? (
          <>
            <StatCard
              icon={List}
              label="Active listings"
              value={limit !== null ? `${activeCount}/${limit}` : String(activeCount)}
              href="/agent/listings"
            />
            <StatCard icon={ShieldCheck} label="Pending review" value={String(pending)} href="/agent/listings" />
            <StatCard
              icon={MessageCircle}
              label="Leads (30d)"
              value={leadsCount > 0 ? String(leadsCount) : "View"}
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
          </>
        ) : (
          <>
            <StatCard icon={Search} label="Browse homes" value="Explore" href="/search" />
            <StatCard icon={Heart} label="Request a home" value="Ask" href="/request-property" />
          </>
        )}
      </section>

      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Quick actions</p>
        {canList ? (
          <>
            <ActionLink
              href="/agent/listings/new"
              icon={PlusCircle}
              title="Post new listing"
              subtitle="Reach buyers and renters on Yike"
              primary
            />
            <ActionLink
              href="/agent/listings"
              icon={List}
              title="My listings"
              subtitle={
                expiredCount > 0
                  ? `${expiredCount} expired — reactivate when still available`
                  : "Active, expired, rented — manage lifecycle"
              }
            />
            {expiringSoon > 0 && (
              <ActionLink
                href="/agent/listings"
                icon={Sparkles}
                title="Renew expiring listings"
                subtitle={`${expiringSoon} listing${expiringSoon === 1 ? "" : "s"} expiring within 3 days`}
                accent
              />
            )}
            <ActionLink
              href="/agent/leads"
              icon={MessageCircle}
              title="Inquiries & leads"
              subtitle="WhatsApp and call leads from your listings"
            />
            <ActionLink
              href="/agent/notifications"
              icon={Bell}
              title="Notifications"
              subtitle="Updates from Yike about your account and listings"
            />
            {(profile.account_type === "agency" ||
              profile.account_type === "developer" ||
              profile.company_name) && (
              <ActionLink
                href="/agent/company"
                icon={ShieldCheck}
                title="Company profile"
                subtitle="Verification, branding, and business details"
              />
            )}
            {!verified && (
              <ActionLink
                href="/agent/verification"
                icon={ShieldCheck}
                title="Get verified badge"
                subtitle="Build trust — optional, apply when ready"
                accent
              />
            )}
          </>
        ) : (
          <>
            <ActionLink
              href="/saved"
              icon={Bookmark}
              title="Saved homes"
              subtitle="Pick up where you left off"
            />
            <ActionLink
              href="/search"
              icon={Search}
              title="Find a home"
              subtitle="Rent, buy, shortlet & land across Nigeria"
            />
            <ActionLink
              href="/agent/become"
              icon={BadgeCheck}
              title="List properties on Yike"
              subtitle="Start posting when you're ready — we'll guide you"
              accent
            />
          </>
        )}
      </section>

      {canList && (
        <section className="rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-4">
          <p className="text-sm font-semibold text-navy">Premium tools</p>
          <p className="mt-1 text-xs text-muted">
            Featured listings and boost placement — coming soon. Admin can assign boosts manually for now.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-elevated p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Account</p>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-navy">{email}</dd>
          </div>
          {profile.phone && (
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-navy">{profile.phone}</dd>
            </div>
          )}
        </dl>
      </section>

      <AgentSignOut />

      <div className="border-t border-border pt-4">
        <DeleteAccountLink />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="pressable rounded-2xl border border-border bg-elevated p-4 shadow-float"
    >
      <Icon className="h-4 w-4 text-gold-dark" />
      <p className="mt-3 text-xl font-bold text-navy">{value}</p>
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
  subtitle: string;
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
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className={cn("block text-xs", primary ? "text-white/80" : "text-muted")}>
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
