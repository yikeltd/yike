"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Profile } from "@/types/database";
import { normalizeAccountStatus } from "@/lib/account-control";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { AdminListingLimitControl } from "@/components/admin/admin-listing-limit-control";
import { AdminUserNotes } from "@/components/admin/admin-user-notes";
import { AgentStatusActions } from "@/components/admin/agent-verification-actions";
import { AdminPinResetPanel } from "@/components/admin/admin-pin-reset-panel";
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
  "overview",
  "listings",
  "leads",
  "reports",
  "verification",
  "notes",
  "audit",
] as const;

type TabId = (typeof TABS)[number];

export function AdminUserDetail({
  profile,
  stats,
  backHref,
  backLabel,
  showListingLimit = false,
  auditLogs = [],
  listings = [],
  verificationSection,
}: {
  profile: Profile;
  stats: AdminProfileStats;
  backHref: string;
  backLabel: string;
  showListingLimit?: boolean;
  auditLogs?: UserAuditEntry[];
  listings?: ListingPreview[];
  verificationSection?: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const accountStatus = normalizeAccountStatus(profile);
  const isAgent =
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "agent";

  const visibleTabs = TABS.filter((t) => {
    if (t === "verification") return isAgent && verificationSection;
    if (t === "listings" || t === "leads" || t === "reports") return isAgent;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
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
              "shrink-0 rounded-lg px-3 py-2 text-xs font-bold capitalize transition-colors",
              tab === id ? "bg-navy text-white" : "text-muted hover:bg-surface"
            )}
          >
            {id === "audit" ? "Audit log" : id}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-navy">Overview</h2>
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
                <dd className="font-medium">{profile.whatsapp ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Account type</dt>
                <dd className="font-medium">{profile.account_type ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Listing limit</dt>
                <dd className="font-medium">
                  {profile.listing_limit ?? (isVerifiedAgentProfile(profile) ? "Unlimited" : "5 (default)")}
                </dd>
              </div>
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
              <div>
                <dt className="text-muted">Complaints</dt>
                <dd className="font-medium">{profile.complaint_count ?? 0}</dd>
              </div>
              <div>
                <dt className="text-muted">Rejected listings</dt>
                <dd className="font-medium">{stats.rejected_listings}</dd>
              </div>
              <div>
                <dt className="text-muted">Unresolved reports</dt>
                <dd className="font-medium">{stats.unresolved_reports}</dd>
              </div>
            </dl>
            {profile.profile_status_reason && (
              <p className="text-sm text-muted">
                Status note: {profile.profile_status_reason}
              </p>
            )}
            {profile.listing_limit_reason && (
              <p className="text-sm text-muted">
                Limit note: {profile.listing_limit_reason}
              </p>
            )}
          </section>

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

      {tab === "listings" && isAgent && (
        <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-navy">Listings</h2>
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

      {tab === "leads" && isAgent && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Leads</h2>
          <p className="mt-2 text-3xl font-black text-navy tabular-nums">{stats.leads}</p>
          <p className="mt-1 text-sm text-muted">Total leads routed to this agent.</p>
          <Link
            href={`/lex/auth/leads?agent=${profile.id}`}
            className="mt-4 inline-block text-xs font-bold text-gold-dark"
          >
            Open leads console →
          </Link>
        </section>
      )}

      {tab === "reports" && isAgent && (
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
          {stats.unresolved_reports >= 3 && stats.unresolved_reports < 5 && (
            <p className="mt-3 rounded-lg bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
              3+ open reports — flagged for admin review.
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

      {tab === "verification" && verificationSection}

      {tab === "notes" && <AdminUserNotes profileId={profile.id} />}

      {tab === "audit" && (
        <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-navy">Audit log</h2>
          {!auditLogs.length ? (
            <p className="text-sm text-muted">No admin actions recorded for this user yet.</p>
          ) : (
            <ul className="divide-y divide-navy/5 text-sm">
              {auditLogs.map((log) => (
                <li key={log.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-navy">{log.action}</span>
                    <time className="text-xs text-muted">
                      {new Date(log.created_at).toLocaleString("en-NG")}
                    </time>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="mt-1 text-xs text-muted">
                      {JSON.stringify(log.metadata).slice(0, 200)}
                      {JSON.stringify(log.metadata).length > 200 ? "…" : ""}
                    </p>
                  )}
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
      )}
    </div>
  );
}
