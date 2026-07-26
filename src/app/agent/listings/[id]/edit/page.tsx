import { redirect } from "next/navigation";
import { requireVerifiedLister } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { ListingEngine } from "@/components/listing-engine/listing-engine";
import { ListingFormErrorBoundary } from "@/components/agent/listing-form-error-boundary";
import { AgentReviewResponseBox } from "@/components/agent/agent-review-response-box";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import type { Property } from "@/types/database";
import type { ListingValues } from "@/lib/listing-engine";

function propertyToEngineValues(listing: Property): ListingValues {
  const extras =
    listing.extras && typeof listing.extras === "object"
      ? (listing.extras as Record<string, unknown>)
      : {};
  const amenities = Array.isArray(extras.amenities) ? (extras.amenities as string[]) : [];
  return {
    listing_type: listing.listing_type,
    property_type: listing.property_type,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    toilets: listing.toilets,
    amenities,
    state: listing.state,
    city: listing.city,
    area: listing.area,
    landmark: listing.landmark,
    address_hint: listing.address_hint,
    title: listing.title,
    price: listing.price,
    payment_period: listing.payment_period,
    description: listing.description,
    video_url: listing.video_url,
    media_urls: listing.media_urls ?? [],
  };
}

function vehicleToEngineValues(listing: Property): ListingValues {
  return {
    auto_category: listing.auto_category,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    vehicle_condition: listing.vehicle_condition,
    trim: listing.trim,
    transmission: listing.transmission,
    fuel_type: listing.fuel_type,
    mileage: listing.mileage,
    vin: listing.vin,
    exterior_color: listing.exterior_color,
    interior_color: listing.interior_color,
    body_type: listing.body_type,
    drivetrain: listing.drivetrain,
    engine: listing.engine,
    registration_status: listing.registration_status,
    financing_available: listing.financing_available ? "on" : "",
    state: listing.state,
    city: listing.city,
    area: listing.area,
    title: listing.title,
    price: listing.price,
    description: listing.description,
    media_urls: listing.media_urls ?? [],
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireVerifiedLister();
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
        <ListingEngine
          categoryId="vehicle"
          agentId={user.id}
          listingId={id}
          initialValues={vehicleToEngineValues(listing)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pt-2 pb-8 lg:px-0 lg:py-8">
      <h1 className="text-xl font-bold text-navy lg:text-2xl">Edit listing</h1>
      <AgentReviewResponseBox listingId={id} />
      <ListingFormErrorBoundary>
        <ListingEngine
          categoryId="property"
          agentId={user.id}
          listingId={id}
          initialValues={propertyToEngineValues(listing)}
        />
      </ListingFormErrorBoundary>
    </div>
  );
}
