import { redirect } from "next/navigation";
import { requireVerifiedLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingForm } from "@/components/agent/listing-form";
import { ListingFormErrorBoundary } from "@/components/agent/listing-form-error-boundary";
import { AgentReviewResponseBox } from "@/components/agent/agent-review-response-box";
import { VehicleListingForm } from "@/components/marketplace/vehicle-listing-form";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import type { Property } from "@/types/database";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await requireVerifiedLister();
  const { id } = await params;
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!data) redirect("/agent/listings");

  const listing = data as Property;
  const isVehicle = normalizeAssetType(listing.asset_type) === "VEHICLE";

  if (isVehicle) {
    if (!isLaunchFeatureVisible("vehicle_marketplace")) {
      redirect("/agent/listings");
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
        <h1 className="text-xl font-bold text-navy lg:text-2xl">Edit vehicle</h1>
        <AgentReviewResponseBox listingId={id} />
        <VehicleListingForm
          listingId={id}
          agentId={user.id}
          initial={listing as unknown as Record<string, unknown>}
        />
      </div>
    );
  }

  const { data: driverRows } = await supabase
    .from("listing_value_drivers")
    .select("driver_key")
    .eq("listing_id", id);

  const initialValueDriverKeys =
    driverRows?.map((r) => r.driver_key as string) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <h1 className="text-xl font-bold text-navy lg:text-2xl">Edit listing</h1>
      <AgentReviewResponseBox listingId={id} />
      <ListingFormErrorBoundary>
        <ListingForm
          agentId={user.id}
          initial={listing}
          initialValueDriverKeys={initialValueDriverKeys}
          profile={profile}
        />
      </ListingFormErrorBoundary>
    </div>
  );
}
