import { requireAgentLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
import { ListingFormErrorBoundary } from "@/components/agent/listing-form-error-boundary";
import { ListingWhatsappVerifyPrompt } from "@/components/agent/listing-whatsapp-verify-prompt";
import { mustVerifyWhatsappBeforeListing } from "@/lib/whatsapp-verification/profile";
import {
  accountStatusMessage,
  canPublishListings,
  LISTING_LIMIT_REACHED_MESSAGE,
} from "@/lib/account-control";
import { TrustGateCompact } from "@/components/verification/trust-gate-compact";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import { countAsActiveListing, getListingLimit } from "@/lib/agent-tiers";
import { getActiveAd } from "@/lib/ads";
import Link from "next/link";
import type { Property } from "@/types/database";

export default async function NewListingPage() {
  const { user, profile } = await requireAgentLister("/agent/listings/new");
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
  const listingFormAd = canPublish && !atLimit ? await getActiveAd("agent_listing_form") : null;
  const whatsappGate = mustVerifyWhatsappBeforeListing(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <div>
        <h1 className="text-xl font-bold text-navy lg:text-2xl">New listing</h1>
        {limit !== null && (
          <p className="mt-2 text-xs text-muted">
            {activeCount} of {limit} listing slots used
          </p>
        )}
      </div>
      {!canPublish && trustCaps.calmMessage ? (
        <TrustGateCompact tasks={verificationTasks} />
      ) : !canPublish && statusMessage ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Posting paused</p>
          <p className="mt-1 text-xs">{statusMessage}</p>
          <Link href="/agent/profile-setup" className="mt-2 inline-flex text-xs font-semibold text-navy">
            Complete profile →
          </Link>
        </div>
      ) : whatsappGate ? (
        <ListingWhatsappVerifyPrompt profile={profile} />
      ) : atLimit ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Listing limit reached</p>
          <p className="mt-1 text-xs">{LISTING_LIMIT_REACHED_MESSAGE}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/agent/plans" prefetch className="inline-flex text-xs font-semibold text-navy">
              View plans →
            </Link>
            <Link href="/agent/verification" className="inline-flex text-xs font-semibold text-navy">
              Verification center →
            </Link>
          </div>
        </div>
      ) : (
        <ListingFormErrorBoundary>
          <ListingForm
            agentId={user.id}
            activeCount={activeCount}
            listingLimit={limit}
            listingFormAd={listingFormAd}
            profile={profile}
          />
        </ListingFormErrorBoundary>
      )}
    </div>
  );
}
