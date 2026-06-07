"use client";

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

export function AdminUserDetail({
  profile,
  stats,
  backHref,
  backLabel,
  showListingLimit = false,
}: {
  profile: Profile;
  stats: AdminProfileStats;
  backHref: string;
  backLabel: string;
  showListingLimit?: boolean;
}) {
  const accountStatus = normalizeAccountStatus(profile);
  const isAgent =
    profile.role === "agent_unverified" ||
    profile.role === "agent_verified" ||
    profile.role === "agent";

  return (
    <div className="space-y-8 pb-12">
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

      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-3">
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
        </dl>
        {profile.profile_status_reason && (
          <p className="text-sm text-muted">
            Status note: {profile.profile_status_reason}
          </p>
        )}
      </section>

      {showListingLimit && isAgent && (
        <AdminListingLimitControl profile={profile} activeCount={stats.active_listing_count} />
      )}

      <AdminUserNotes profileId={profile.id} />

      <AdminPinResetPanel profileId={profile.id} pinType="login" label="Reset login PIN" />

      {isAgent && (
        <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-navy">Quick links</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/lex/auth/listings?agent=${profile.id}`}
              className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
            >
              Listings
            </Link>
            <Link
              href={`/lex/auth/leads?agent=${profile.id}`}
              className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
            >
              Leads
            </Link>
            <Link
              href={`/lex/auth/reports`}
              className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
            >
              Reports
            </Link>
            <Link
              href={`/lex/auth/audit-logs`}
              className="rounded-lg bg-surface px-4 py-2 text-xs font-bold text-navy"
            >
              Audit log
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
