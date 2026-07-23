import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Car } from "lucide-react";
import { requireAgentLister } from "@/lib/auth";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  mustCompleteSellerVerification,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";

export const metadata = {
  title: "Choose Listing Type | Yike",
  description: "List a property or vehicle on Yike Marketplace.",
};

export default async function ChooseListingTypePage() {
  const { profile } = await requireAgentLister("/agent/verify", {
    skipProfileSetup: true,
  });

  if (mustCompleteSellerVerification(profile)) {
    redirect(SELLER_VERIFY_PATH);
  }

  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  return (
    <main className="mx-auto max-w-lg space-y-5 px-3 pb-12 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          Choose Listing Type
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your seller profile is in. Listings go to Yike review until you are a
          Verified Seller.
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          href="/agent/listings/new"
          className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 transition hover:border-gold/50 hover:shadow-sm"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold">
            <Building2 className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold text-navy">Property</span>
            <span className="mt-0.5 block text-xs text-muted">
              Houses, flats, land, commercial, short lets
            </span>
          </span>
        </Link>

        {vehiclesOn ? (
          <Link
            href="/agent/listings/new/vehicle"
            className="flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 transition hover:border-gold/50 hover:shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold">
              <Car className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-navy">Vehicle</span>
              <span className="mt-0.5 block text-xs text-muted">
                Cars, SUVs, bikes, trucks, equipment
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
