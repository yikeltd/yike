import { redirect } from "next/navigation";

export const metadata = {
  title: "New Listing | Yike",
  description: "Choose property, vehicle, or electronics listing on Yike.",
};

/** Legacy entry — send sellers to category picker or property engine. */
export default function NewListingPage() {
  redirect("/agent/listings/choose");
}
