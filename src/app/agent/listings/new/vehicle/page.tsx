import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { requireAgentLister } from "@/lib/auth";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";

export const metadata: Metadata = {
  title: "List a vehicle | Yike",
  description: "Create a vehicle listing on Yike Marketplace.",
};

export default async function NewVehicleListingPage() {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();

  const { user, profile } = await requireAgentLister(
    "/agent/listings/new/vehicle",
    { skipProfileSetup: true }
  );

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-black/50">
            <Link href="/vehicles" className="underline-offset-2 hover:underline">
              Vehicles
            </Link>
            {" · "}
            New listing
          </p>
          <h1 className="text-2xl font-bold text-navy">List a vehicle</h1>
        </div>
        <Link
          href="/agent/listings/new"
          className="text-sm text-navy underline-offset-2 hover:underline"
        >
          List property instead
        </Link>
      </div>
      <ListingEngine categoryId="vehicle" agentId={user.id} />
    </main>
  );
}
