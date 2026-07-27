import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export const metadata: Metadata = {
  title: "List a vehicle | Yike",
  description: "Create a vehicle listing on Yike Marketplace.",
};

export default async function NewVehicleListingPage() {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();

  const { user, profile } = await requireAgentLister(
    "/agent/listings/new/vehicle",
    { skipProfileSetup: true }
  );

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return (
    <SellerFlowShell
      eyebrow="Vehicle"
      title="New listing"
      description="Photos first, then specs — same calm flow as browsing on Yike."
      backHref="/agent/listings/choose"
      backLabel="Categories"
      actions={
        <Link
          href="/agent/listings/new"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          List property
        </Link>
      }
    >
      <ListingEngine categoryId="vehicle" agentId={user.id} />
    </SellerFlowShell>
  );
}
