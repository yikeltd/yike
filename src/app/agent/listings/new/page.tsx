import { requireAgentLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
import {
  accountStatusMessage,
  canPublishListings,
  LISTING_LIMIT_REACHED_MESSAGE,
} from "@/lib/account-control";
import { TrustGateCompact } from "@/components/verification/trust-gate-compact";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import { countAsActiveListing, getListingLimit } from "@/lib/agent-tiers";
import Link from "next/link";
import type { Property } from "@/types/database";

export default async function NewListingPage() {
  const { user, profile } = await requireAgentLister();
  const supabase = await requireServerClient();

  const { data } = await supabase
    .from("properties")
    .select("status, expires_at")
    .eq("agent_id", user.id);

  const activeCount = ((data ?? []) as Pick<Property, "status" | "expires_at">[]).filter(
    (p) => countAsActiveListing(p.status, p.expires_at)
  ).length;

  const limit = getListingLimit(profile);
  const atLimit = limit !== null && activeCount >= limit;
  const statusMessage = accountStatusMessage(profile);
  const canPublish = canPublishListings(profile);
  const trustCaps = getTrustCapabilities(profile);
  const verificationTasks = getRequiredVerificationTasks(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">New listing</h1>
        <p className="mt-1 text-sm text-muted">
          Add what you know now — optional details can wait. Your progress saves
          automatically.
        </p>
        {limit !== null && (
          <p className="mt-2 text-xs text-muted">
            {activeCount} of {limit} listing slots used
          </p>
        )}
      </div>
      {!canPublish && trustCaps.calmMessage ? (
        <TrustGateCompact tasks={verificationTasks} />
      ) : !canPublish && statusMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Posting paused</p>
          <p className="mt-2">{statusMessage}</p>
          <Link href="/contact" className="mt-4 inline-flex font-semibold text-navy underline">
            Contact Yike support
          </Link>
        </div>
      ) : atLimit ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Listing limit reached</p>
          <p className="mt-2">{LISTING_LIMIT_REACHED_MESSAGE}</p>
          <Link
            href="/agent/verification"
            className="mt-4 inline-flex font-semibold text-navy underline"
          >
            Verify your account →
          </Link>
        </div>
      ) : (
        <ListingForm agentId={user.id} activeCount={activeCount} listingLimit={limit} />
      )}
    </div>
  );
}
