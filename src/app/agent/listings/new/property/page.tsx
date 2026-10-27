import { redirect } from "next/navigation";

export default function NewPropertyListingRedirect() {
  redirect("/agent/listings/new?category=property");
}
