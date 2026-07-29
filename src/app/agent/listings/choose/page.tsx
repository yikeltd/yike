import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { SmartSellerFlow } from "@/components/agent/smart-seller-flow";

export const metadata = {
  title: "Sell on Yike | List Property & Vehicle",
  description: "Intelligent listing creator for properties and vehicles on Yike Marketplace.",
};

export default async function ChooseListingTypePage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return <SmartSellerFlow />;
}
