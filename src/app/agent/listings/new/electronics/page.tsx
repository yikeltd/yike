import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAgentLister } from "@/lib/auth";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { SellerFlowShell } from "@/components/agent/seller-flow-shell";

export const metadata = {
  title: "Sell Electronics | Yike",
  description: "List phones, laptops, appliances, and electronics on Yike.",
};

export default async function NewElectronicsListingPage() {
  if (!isLaunchFeatureVisible("electronics_marketplace")) {
    redirect("/agent/listings");
  }

  const { user, profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return (
    <SellerFlowShell
      eyebrow="Electronics"
      title="List electronics"
      description="Add photos, specs, and price — we review before publishing."
      backHref="/agent/listings/choose"
      backLabel="Choose category"
      actions={
        <Link
          href="/electronics"
          className="pressable text-sm font-semibold text-navy/55 hover:text-navy"
        >
          Browse electronics
        </Link>
      }
    >
      <ListingEngine categoryId="electronics" agentId={user.id} />
    </SellerFlowShell>
  );
}
