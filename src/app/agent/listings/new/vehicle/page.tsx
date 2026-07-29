import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";
import { SmartSellerFlow } from "@/components/agent/smart-seller-flow";

export const metadata = {
  title: "List a Vehicle | Yike",
  description: "Create a vehicle listing on Yike Marketplace.",
};

export default async function NewVehicleListingPage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return <SmartSellerFlow />;
}
