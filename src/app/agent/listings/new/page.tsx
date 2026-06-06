import { requireAgentLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
import {
  countAsActiveListing,
  getListingLimit,
  isVerifiedAgentProfile,
} from "@/lib/agent-tiers";
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

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">New listing</h1>
        <p className="mt-1 text-sm text-muted">
          Listings are reviewed before going live. WhatsApp must be on your profile.
        </p>
        {limit !== null && (
          <p className="mt-2 text-xs text-muted">
            Active listings: {activeCount}/{limit}
            {!isVerifiedAgentProfile(profile) && (
              <>
                {" "}
                ·{" "}
                <Link href="/agent/verification" className="font-semibold text-gold-dark">
                  Get verified
                </Link>{" "}
                for unlimited listings
              </>
            )}
          </p>
        )}
      </div>
      {atLimit ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Listing limit reached</p>
          <p className="mt-2">
            Unverified agents can have up to {limit} active listings. Apply for verified
            agent status to list without limits and rank higher in search.
          </p>
          <Link
            href="/agent/verification"
            className="mt-4 inline-flex font-semibold text-navy underline"
          >
            Apply for verified badge →
          </Link>
        </div>
      ) : (
        <ListingForm agentId={user.id} activeCount={activeCount} listingLimit={limit} />
      )}
    </div>
  );
}
