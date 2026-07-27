import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { CATEGORY_CHIP_ASSETS } from "@/lib/home/category-chip-assets";
import { CategoryGatewayCard } from "@/components/marketplace/category-gateway-card";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export const metadata = {
  title: "Choose Listing Type | Yike",
  description: "List a property or vehicle on Yike Marketplace.",
};

export default async function ChooseListingTypePage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  return (
    <SellerFlowShell
      eyebrow="Sell on Yike"
      title="What are you listing?"
      description="Pick a category. The form adapts as you go — same premium experience as browsing."
      backHref="/agent"
      backLabel="Dashboard"
      maxWidth="md"
    >
      <div className={vehiclesOn ? "grid gap-3" : "grid gap-3"}>
        {vehiclesOn ? (
          <CategoryGatewayCard
            href="/agent/listings/new/vehicle"
            label="Vehicles"
            subtitle="Cars · SUVs · Trucks"
            imageSrc={CATEGORY_CHIP_ASSETS.vehicle.src}
            size="gateway"
            priority
          />
        ) : null}

        <CategoryGatewayCard
          href="/agent/listings/new"
          label="Properties"
          subtitle="Homes · Land · Commercial"
          imageSrc={CATEGORY_CHIP_ASSETS.property.src}
          size="gateway"
          priority
        />
      </div>

      <p className="text-center text-xs text-navy/45">
        Need help verifying?{" "}
        <Link href="/agent/verify" className="font-semibold text-gold-dark underline">
          Seller verification
        </Link>
      </p>
    </SellerFlowShell>
  );
}
