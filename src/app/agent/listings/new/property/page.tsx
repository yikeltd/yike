import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAgentLister } from "@/lib/auth";
import {
  buildSellerVerifyUrl,
  mustCompleteSellerVerification,
} from "@/lib/seller-trust";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export const metadata = {
  title: "Sell Property | Yike",
  description: "List homes, land, rentals and commercial property on Yike.",
};

export default async function NewPropertyListingPage() {
  const { user, profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
    returnPath: "/agent/listings/new/property",
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(buildSellerVerifyUrl("/agent/listings/new/property"));
  }

  return (
    <SellerFlowShell
      eyebrow="Property"
      title="List property"
      description="Add photos, location, and price — we review before publishing."
      backHref="/agent/listings/choose"
      backLabel="Choose category"
      actions={
        <Link
          href="/search"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          Browse properties
        </Link>
      }
    >
      <ListingEngine categoryId="property" agentId={user.id} />
    </SellerFlowShell>
  );
}
