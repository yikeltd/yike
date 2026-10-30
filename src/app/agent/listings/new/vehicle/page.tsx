import { redirect } from "next/navigation";

export default function NewVehicleListingRedirect() {
  redirect("/agent/listings/new?category=vehicle");
}
