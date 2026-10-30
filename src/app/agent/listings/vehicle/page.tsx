import { redirect } from "next/navigation";

/** Legacy path — canonical gated flow uses ListingEngine. */
export default function LegacyVehicleListingPage() {
  redirect("/agent/listings/new/vehicle");
}
