import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAgentLister } from "@/lib/auth";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  buildSellerVerifyUrl,
  mustCompleteSellerVerification,
} from "@/lib/seller-trust";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export const metadata = {
  title: "List Vehicle or Equipment | Yike",
  description:
    "List cars, trucks, buses, heavy equipment and farm machinery on Yike.",
};

export default async function NewVehicleListingPage() {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) {
    redirect("/agent/listings/choose");
  }

  const { user, profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
    returnPath: "/agent/listings/new/vehicle",
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(buildSellerVerifyUrl("/agent/listings/new/vehicle"));
  }

  return (
    <SellerFlowShell
      eyebrow="Vehicle"
      title="New listing"
      backHref="/agent/listings/choose"
      backLabel="Choose category"
      actions={
        <Link
          href="/vehicles"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          Browse vehicles
        </Link>
      }
    >
      <ListingEngine categoryId="vehicle" agentId={user.id} />
    </SellerFlowShell>
  );
}
