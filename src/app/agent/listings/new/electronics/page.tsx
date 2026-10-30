import { redirect } from "next/navigation";

export default function NewElectronicsListingRedirect() {
  redirect("/agent/listings/new?category=electronics");
}
