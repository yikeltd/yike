import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { SmartSellerFlow } from "@/components/agent/smart-seller-flow";

export const metadata = {
  title: "New Property Listing | Yike",
  description: "Create a property listing on Yike Marketplace.",
};

export default async function NewListingPage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return <SmartSellerFlow />;
}
