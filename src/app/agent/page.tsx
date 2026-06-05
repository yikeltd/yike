import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { VerifiedBadge, StatusBadge } from "@/components/ui/badge";
import { isVerifiedAgent } from "@/lib/utils";
import { requireServerClient } from "@/lib/supabase/require-client";
import { PlusCircle, List, ShieldCheck } from "lucide-react";
import { AgentSignOut } from "./sign-out-button";

export default async function AgentDashboardPage() {
  const user = await requireAuth("/auth/login?next=/agent");
  const profile = await getProfile(user.id);
  const supabase = await requireServerClient();

  const isAgent =
    profile &&
    ["agent", "admin", "super_admin"].includes(profile.role);

  if (!isAgent) {
    return (
      <div className="space-y-4 pt-8 text-center">
        <p className="text-muted">Upgrade to an agent account to list properties.</p>
        <Link
          href="/post-property"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white"
        >
          Become an agent
        </Link>
      </div>
    );
  }

  const { count } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id);

  const { count: pending } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .eq("status", "pending");

  const verified = isVerifiedAgent(profile.verification_status);

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-xl font-bold">
          {profile.full_name ?? "Agent"}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {verified ? (
            <VerifiedBadge />
          ) : (
            <StatusBadge status={profile.verification_status} />
          )}
        </div>
      </div>

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

      <nav className="space-y-2">
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
          href="/agent/verification"
          className="card-shadow flex items-center gap-3 rounded-xl border border-border px-4 py-3"
        >
          <ShieldCheck className="h-5 w-5 text-muted" />
          <span className="font-medium">Verification</span>
        </Link>
      </nav>

      <AgentSignOut />
    </div>
  );
}
