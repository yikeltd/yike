"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { normalizeAccountStatus } from "@/lib/account-control";
import { getListingLimit, isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { resolveStarterPlanInfo } from "@/lib/subscriptions/starter-plan";
import { AdminAccountTypeControl } from "@/components/admin/admin-account-type-control";
import { AdminListingLimitControl } from "@/components/admin/admin-listing-limit-control";
import {
  isListingSellerAccountType,
  listingSellerAccountTypeLabel,
} from "@/lib/profile/seller-account-types";
import { AdminUserNotes } from "@/components/admin/admin-user-notes";
import { AgentStatusActions } from "@/components/admin/agent-verification-actions";
import { AdminUserTrustActions } from "@/components/admin/admin-user-trust-actions";
import { AdminPinResetPanel } from "@/components/admin/admin-pin-reset-panel";
import { AdminProfileMediaPanel } from "@/components/admin/admin-profile-media-panel";
import { SupportViewPanel } from "@/components/admin/support-view-panel";
import type { SupportViewSession } from "@/lib/admin/support-view";
import { StatusBadge, VerifiedBadge } from "@/components/ui/badge";
import type { AdminProfileStats } from "@/lib/admin/profile-stats";
import type { UserAuditEntry } from "@/lib/admin/user-audit";
import { cn } from "@/lib/utils";

type ListingPreview = {
  id: string;
  title: string;
  status: string;
  city: string | null;
};

const TABS = [
  "profile",
  "verification",
  "listings",
  "activity",
  "payments",
  "trust_score",
  "reports",
  "audit",
  "sessions",
  "admin_actions",
] as const;

type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  profile: "Profile",
  verification: "Verification",
  listings: "Listings",
  activity: "Activity & Leads",
  payments: "Payments & Plan",
  trust_score: "Trust Score",
  reports: "Reports",
  audit: "Audit Timeline",
  sessions: "Sessions & Devices",
  admin_actions: "Admin Actions",
};

export function AdminUserDetail({
  profile,
  stats,
  backHref,
  backLabel,
  showListingLimit = false,
  auditLogs = [],
  listings = [],
  verificationSection,
  canViewAccounts = false,
  supportViewSession = null,
}: {
  profile: Profile;
  stats: AdminProfileStats;
  backHref: string;
  backLabel: string;
  showListingLimit?: boolean;
  auditLogs?: UserAuditEntry[];
  listings?: ListingPreview[];
  verificationSection?: ReactNode;
  canViewAccounts?: boolean;
  supportViewSession?: SupportViewSession | null;
}) {
  const [tab, setTab] = useState<TabId>("profile");
  const starterInfo = resolveStarterPlanInfo(profile);
  const effectiveListingLimit = getListingLimit(profile);
  const accountStatus = normalizeAccountStatus(profile);
  const isAgent =
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "agent";
  const canChangeSellerType =
    isAgent || isListingSellerAccountType(profile.account_type);

  const visibleTabs = TABS.filter((t) => {
    if (t === "verification") return isAgent || verificationSection;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <SupportViewPanel
        userId={profile.id}
        userName={profile.full_name ?? profile.username ?? "User"}
        canView={canViewAccounts}
        activeSession={supportViewSession}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={backHref} className="text-xs font-bold text-gold-dark">
            ← {backLabel}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            {profile.full_name ?? profile.username ?? "User"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={profile.role} />
            {isVerifiedAgentProfile(profile) && <VerifiedBadge />}
            <StatusBadge status={accountStatus} />
            {profile.verification_status && (
              <StatusBadge status={profile.verification_status} />
            )}
          </div>
          {profile.abuse_review_flag && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Abuse review flagged
              {profile.abuse_review_reason ? ` — ${profile.abuse_review_reason}` : ""}
              {stats.unresolved_reports > 0 &&
                ` · ${stats.unresolved_reports} open report(s)`}
            </p>
          )}
        </div>
        <AgentStatusActions agentId={profile.id} />
      </div>

      <AdminUserTrustActions userId={profile.id} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active listings", stats.active_listing_count],
          ["Total listings", stats.total_listings],
          ["Leads", stats.leads],
          ["Reports", stats.reports],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-black text-navy tabular-nums">{value}</p>
            <p className="text-xs font-semibold text-muted">{label}</p>
          </div>
        ))}
      </div>

      <nav
        className="flex gap-1 overflow-x-auto rounded-xl border border-navy/10 bg-white p-1 shadow-sm"
        aria-label="User detail sections"
      >
        {visibleTabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors",
              tab === id ? "bg-navy text-white" : "text-muted hover:bg-surface"
            )}
          >
            {TAB_LABELS[id] ?? id}
          </button>
        ))}
      </nav>

      {tab === "profile" && (
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-navy">Profile Details</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="font-medium">{profile.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="font-medium">{profile.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">WhatsApp</dt>
                <dd className="font-medium">{profile.whatsapp ?? profile.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">WhatsApp verification</dt>
                <dd className="font-medium capitalize">
                  {profile.whatsapp_verification_status?.replace(/_/g, " ") ?? "unverified"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">WhatsApp verified</dt>
                <dd className="font-medium">
                  {profile.whatsapp_verified_at
                    ? new Date(profile.whatsapp_verified_at).toLocaleString("en-NG")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Profile type</dt>
                <dd className="font-medium">
                  {listingSellerAccountTypeLabel(profile.account_type)}
                </dd>
              </div>
              {profile.company_name ? (
                <div>
                  <dt className="text-muted">Company</dt>
                  <dd className="font-medium">{profile.company_name}</dd>
                </div>
              ) : null}
              {profile.cac_document_path ? (
                <div>
                  <dt className="text-muted">CAC</dt>
                  <dd className="font-medium text-emerald-700">On file</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted">Joined</dt>
                <dd className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString("en-NG")}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Last active</dt>
                <dd className="font-medium">
                  {profile.last_active_at || profile.last_activity_at
                    ? new Date(
                        profile.last_active_at ?? profile.last_activity_at!
                      ).toLocaleDateString("en-NG")
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <AdminProfileMediaPanel profile={profile} />
        </div>
      )}

      {tab === "verification" && (
        <div className="space-y-6">
          {verificationSection ?? (
            <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-navy">Verification Status</h2>
              <p className="mt-2 text-sm text-muted">
                Status: <strong className="capitalize text-navy">{profile.verification_status ?? "unverified"}</strong>
              </p>
            </section>
          )}
        </div>
      )}

      {tab === "listings" && (
        <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-navy">Listings ({stats.total_listings})</h2>
            <Link
              href={`/lex/auth/listings?agent=${profile.id}`}
              className="text-xs font-bold text-gold-dark"
            >
              View all →
            </Link>
          </div>
          {!listings.length ? (
            <p className="text-sm text-muted">No listings yet.</p>
          ) : (
            <ul className="divide-y divide-navy/5 text-sm">
              {listings.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                  <Link
                    href={`/lex/auth/listings/${l.id}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {l.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted">{l.city ?? "—"}</span>
                    <StatusBadge status={l.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "activity" && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Activity & Leads</h2>
          <p className="mt-2 text-3xl font-black text-navy tabular-nums">{stats.leads}</p>
          <p className="mt-1 text-sm text-muted">Total leads routed to this user account.</p>
          <Link
            href={`/lex/auth/leads?agent=${profile.id}`}
            className="mt-4 inline-block text-xs font-bold text-gold-dark"
          >
            Open leads console →
          </Link>
        </section>
      )}

      {tab === "payments" && (
        <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Payments & Plan</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Listing limit</dt>
              <dd className="font-medium">
                {effectiveListingLimit != null
                  ? effectiveListingLimit
                  : isVerifiedAgentProfile(profile)
                    ? "Unlimited"
                    : "5 (default)"}
              </dd>
            </div>
            {starterInfo.isStarter && (
              <>
                <div>
                  <dt className="text-muted">Starter plan month</dt>
                  <dd className="font-medium">Month {starterInfo.month}</dd>
                </div>
                <div>
                  <dt className="text-muted">Active listings limit</dt>
                  <dd className="font-medium">
                    {stats.active_listing_count} / {starterInfo.listingLimit}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <Link
            href={`/lex/auth/revenue/transactions?user=${profile.id}`}
            className="inline-block text-xs font-bold text-gold-dark"
          >
            View transaction history →
          </Link>
        </section>
      )}

      {tab === "trust_score" && (
        <div className="space-y-6">
          <AdminUserTrustActions userId={profile.id} />
          <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-navy">Trust Metrics</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Complaints</dt>
                <dd className="font-bold text-navy">{profile.complaint_count ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted">Rejected listings</dt>
                <dd className="font-bold text-navy">{stats.rejected_listings}</dd>
              </div>
              <div>
                <dt className="text-muted">Unresolved reports</dt>
                <dd className="font-bold text-navy">{stats.unresolved_reports}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {tab === "reports" && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Reports</h2>
          <p className="mt-2 text-sm text-muted">
            <strong className="text-navy">{stats.reports}</strong> total ·{" "}
            <strong className="text-navy">{stats.unresolved_reports}</strong> open
          </p>
          {stats.unresolved_reports >= 5 && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              5+ open reports — consider putting account on hold for review.
            </p>
          )}
          <Link
            href="/lex/auth/reports"
            className="mt-4 inline-block text-xs font-bold text-gold-dark"
          >
            Open reports queue →
          </Link>
        </section>
      )}

      {tab === "audit" && (
        <div className="space-y-6">
          <AdminUserNotes profileId={profile.id} />
          <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-navy">Audit Timeline</h2>
            {!auditLogs.length ? (
              <p className="text-sm text-muted">No admin actions recorded for this user yet.</p>
            ) : (
              <ul className="divide-y divide-navy/5 text-sm">
                {auditLogs.map((log) => (
                  <li key={log.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-navy">
                        {log.summary ?? log.action}
                      </span>
                      <time className="text-xs text-muted">
                        {new Date(log.created_at).toLocaleString("en-NG")}
                      </time>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{log.action}</p>
                    {log.reason ? (
                      <p className="mt-1 text-xs text-muted">Reason: {log.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/lex/auth/audit-logs"
              className="inline-block text-xs font-bold text-gold-dark"
            >
              Full audit log →
            </Link>
          </section>
        </div>
      )}

      {tab === "sessions" && (
        <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Sessions & Devices</h2>
          <p className="text-sm text-muted">Active support sessions and authentication security events.</p>
          <Link
            href={`/lex/auth/security-events?user=${profile.id}`}
            className="inline-block text-xs font-bold text-gold-dark"
          >
            View user security logs →
          </Link>
        </section>
      )}

      {tab === "admin_actions" && (
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-navy">Admin Actions & Controls</h2>
            <AgentStatusActions agentId={profile.id} />
          </section>

          {canChangeSellerType ? <AdminAccountTypeControl profile={profile} /> : null}

          {showListingLimit && isAgent && (
            <AdminListingLimitControl
              profile={profile}
              activeCount={stats.active_listing_count}
            />
          )}

          <AdminPinResetPanel
            profileId={profile.id}
            pinType="login"
            label="Reset login PIN"
          />
        </div>
      )}
    </div>
  );
}
