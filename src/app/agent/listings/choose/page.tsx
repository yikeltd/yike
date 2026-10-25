import { redirect } from "next/navigation";
import { requireAgentLister } from "@/lib/auth";
import {
  buildSellerVerifyUrl,
  deriveSellerCustomerVerificationStatus,
  mustCompleteSellerVerification,
  SELLER_CUSTOMER_STATUS_LABELS,
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
    redirect(buildSellerVerifyUrl("/agent/listings/choose"));
  }

  const customerStatus = deriveSellerCustomerVerificationStatus(profile);
  const statusNote =
    customerStatus === "checking"
      ? SELLER_CUSTOMER_STATUS_LABELS.checking
      : customerStatus === "action_needed"
        ? SELLER_CUSTOMER_STATUS_LABELS.action_needed
        : null;

  return (
    <SellerCategoryChoose
      statusNote={statusNote}
      verified={customerStatus === "verified"}
    />
  );
}
