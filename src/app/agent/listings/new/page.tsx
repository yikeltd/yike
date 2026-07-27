import { requireAgentLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { ListingFormErrorBoundary } from "@/components/agent/listing-form-error-boundary";
import { ListingWhatsappVerifyPrompt } from "@/components/agent/listing-whatsapp-verify-prompt";
import {
  isWhatsappNumberVerified,
  mustVerifyWhatsappBeforeListing,
} from "@/lib/whatsapp-verification/profile";
import {
  accountStatusMessage,
  LISTING_LIMIT_REACHED_MESSAGE,
} from "@/lib/account-control";
import { TrustGateCompact } from "@/components/verification/trust-gate-compact";
import { getRequiredVerificationTasks } from "@/lib/verification/tasks";
import { getTrustCapabilities } from "@/lib/verification/permissions";
import { countAsActiveListing, getListingLimit } from "@/lib/agent-tiers";
import Link from "next/link";
import type { Property } from "@/types/database";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { redirect } from "next/navigation";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export default async function NewListingPage() {
  const { user, profile } = await requireAgentLister("/agent/listings/new", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

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
  const trustCaps = getTrustCapabilities(profile);
  const verificationTasks = getRequiredVerificationTasks(profile);
  const whatsappNeedsVerify =
    mustVerifyWhatsappBeforeListing(profile) && !isWhatsappNumberVerified(profile);
  const showTrustNotice = Boolean(trustCaps.calmMessage);
  const showAccountNotice = Boolean(statusMessage) && !showTrustNotice;

  return (
    <SellerFlowShell
      eyebrow="Property"
      title="New listing"
      description={
        limit !== null
          ? `${activeCount} of ${limit} listing slots used`
          : "Add photos and details — we’ll guide you through each step."
      }
      backHref="/agent/listings/choose"
      backLabel="Categories"
      actions={
        <Link
          href="/agent/listings"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          My listings
        </Link>
      }
    >
      {atLimit ? (
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-[0_4px_16px_-10px_rgba(3,27,78,0.12)]">
          <p className="font-semibold">{LISTING_LIMIT_REACHED_MESSAGE}</p>
          <Link
            href="/agent/plans"
            prefetch
            className="mt-2 inline-flex text-xs font-bold text-gold-dark"
          >
            View plans →
          </Link>
        </div>
      ) : (
        <>
          {showTrustNotice ? <TrustGateCompact tasks={verificationTasks} /> : null}
          {showAccountNotice ? (
            <div className="rounded-2xl border border-amber-200/50 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-[0_4px_16px_-10px_rgba(3,27,78,0.12)]">
              <p className="font-semibold">Before you publish</p>
              <p className="mt-1 text-xs text-amber-950/80">{statusMessage}</p>
              <Link
                href={SELLER_VERIFY_PATH}
                className="mt-2 inline-flex text-xs font-bold text-gold-dark"
              >
                Complete verification →
              </Link>
            </div>
          ) : null}
          {whatsappNeedsVerify ? (
            <ListingWhatsappVerifyPrompt profile={profile} />
          ) : null}
          <ListingFormErrorBoundary>
            <ListingEngine categoryId="property" agentId={user.id} />
          </ListingFormErrorBoundary>
        </>
      )}
    </SellerFlowShell>
  );
}
