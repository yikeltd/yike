import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { SellerCategoryChoose } from "@/components/agent/seller-category-choose";

export const metadata = {
  title: "Sell on Yike | Property, Vehicles & Electronics",
  description: "Create property, vehicle, or electronics listings on Yike Marketplace.",
};

export default async function ChooseListingTypePage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
    returnPath: "/agent/listings/choose",
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return <SellerCategoryChoose />;
}
