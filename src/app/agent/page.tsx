import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { VerifiedBadge, StatusBadge } from "@/components/ui/badge";
import {
  canListProperties,
  getListingLimit,
  isVerifiedAgentProfile,
  countAsActiveListing,
} from "@/lib/agent-tiers";
import { requireServerClient } from "@/lib/supabase/require-client";
import { PlusCircle, List, ShieldCheck, BadgeCheck } from "lucide-react";
import { AgentSignOut } from "./sign-out-button";
import { DeleteAccountLink } from "@/components/account/delete-account-link";
import type { Property } from "@/types/database";

export default async function ProfilePage() {
  const user = await requireAuth("/auth/login?next=/agent");
  const profile = await getProfile(user.id);
  const supabase = await requireServerClient();

  if (!profile) {
    return <p className="pt-8 text-center text-muted">Profile not found.</p>;
  }

  const verified = isVerifiedAgentProfile(profile);
  const canList = canListProperties(profile);
  const limit = getListingLimit(profile);

  const { data: listings } = await supabase
    .from("properties")
    .select("status, expires_at")
    .eq("agent_id", user.id);

  const rows = (listings ?? []) as Pick<Property, "status" | "expires_at">[];
  const activeCount = rows.filter((p) =>
    countAsActiveListing(p.status, p.expires_at)
  ).length;
  const pending = rows.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-xl font-bold">
          {profile.full_name ?? profile.username ?? "Your profile"}
        </h1>
        {profile.username && (
          <p className="text-sm text-muted">@{profile.username}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {verified ? (
            <VerifiedBadge />
          ) : canList ? (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              Unverified agent
            </span>
          ) : profile.verification_status !== "not_started" ? (
            <StatusBadge status={profile.verification_status} />
          ) : null}
          {(profile.phone_verified ?? false) && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              Phone verified
            </span>
          )}
          {(profile.email_verified ?? false) && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
              Email verified
            </span>
          )}
        </div>
      </div>

      {canList && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-shadow rounded-xl border border-border p-4">
            <p className="text-2xl font-bold">
              {limit !== null ? `${activeCount}/${limit}` : rows.length}
            </p>
            <p className="text-xs text-muted">
              {limit !== null ? "Active listings" : "Total listings"}
            </p>
          </div>
          <div className="card-shadow rounded-xl border border-border p-4">
            <p className="text-2xl font-bold">{pending}</p>
            <p className="text-xs text-muted">Pending review</p>
          </div>
        </div>
      )}

      <nav className="space-y-2">
        {canList ? (
          <>
            <Link
              href="/agent/listings/new"
              className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-white"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="font-medium">Post new listing</span>
            </Link>
            <Link
              href="/agent/listings"
              className="card-shadow flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              <List className="h-5 w-5 text-muted" />
              <span className="font-medium">My listings</span>
            </Link>
            <Link
              href="/agent/leads"
              className="card-shadow flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              <ShieldCheck className="h-5 w-5 text-muted" />
              <span className="font-medium">My leads</span>
            </Link>
          </>
        ) : (
          <Link
            href="/agent/become"
            className="flex items-center gap-3 rounded-xl bg-gold px-4 py-3 text-navy"
          >
            <BadgeCheck className="h-5 w-5" />
            <span className="font-medium">Become an agent</span>
          </Link>
        )}
        {!canList && (
          <p className="text-sm text-muted">
            Verify phone & email, then become an agent to list properties. No NIN required to start.
          </p>
        )}
        {canList && !verified && (
          <Link
            href="/agent/verification"
            className="flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-navy"
          >
            <ShieldCheck className="h-5 w-5 text-gold-dark" />
            <span className="font-medium">Get verified badge (optional)</span>
          </Link>
        )}
        {canList && verified && (
          <Link
            href="/agent/verification"
            className="card-shadow flex items-center gap-3 rounded-xl border border-border px-4 py-3"
          >
            <ShieldCheck className="h-5 w-5 text-muted" />
            <span className="font-medium">Verification</span>
          </Link>
        )}
      </nav>

      <AgentSignOut />

      <div className="border-t border-border pt-4">
        <DeleteAccountLink />
      </div>
    </div>
  );
}
