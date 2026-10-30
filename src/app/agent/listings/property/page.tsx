import { redirect } from "next/navigation";

/** Legacy path — canonical gated flow uses ListingEngine. */
export default function LegacyPropertyListingPage() {
  redirect("/agent/listings/new/property");
}
