import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { VerifiedBadge, StatusBadge } from "@/components/ui/badge";
import { isVerifiedAgent, canListProperties } from "@/lib/utils";
import { requireServerClient } from "@/lib/supabase/require-client";
import { PlusCircle, List, ShieldCheck } from "lucide-react";
import { AgentSignOut } from "./sign-out-button";

export default async function ProfilePage() {
  const user = await requireAuth("/auth/login?next=/agent");
  const profile = await getProfile(user.id);
  const supabase = await requireServerClient();

  if (!profile) {
    return <p className="pt-8 text-center text-muted">Profile not found.</p>;
  }

  const verified = isVerifiedAgent(profile.verification_status);
  const canList = canListProperties(profile.verification_status);

  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id);

  const { count: pending } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .eq("status", "pending");

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
            <p className="text-2xl font-bold">{count ?? 0}</p>
            <p className="text-xs text-muted">Total listings</p>
          </div>
          <div className="card-shadow rounded-xl border border-border p-4">
            <p className="text-2xl font-bold">{pending ?? 0}</p>
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
          </>
        ) : (
          <Link
            href="/agent/verification"
            className="flex items-center gap-3 rounded-xl bg-gold px-4 py-3 text-navy"
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="font-medium">Verify to list property</span>
          </Link>
        )}
        {!canList && (
          <p className="text-sm text-muted">
            To list properties on Yike, verify your identity first. This helps protect property seekers.
          </p>
        )}
        {canList && (
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
    </div>
  );
}
