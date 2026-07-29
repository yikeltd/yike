import { DiscoverExperience } from "@/components/discover/discover-experience";
import { DiscoverDesktopFallback } from "@/components/discover/discover-desktop-fallback";
import { getPublicProperties } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
import { queryPublicVehicles } from "@/lib/marketplace/listings";
import { withDemoFallback } from "@/lib/mock-listings";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { SITE_NAME } from "@/lib/constants";
import type { Property } from "@/types/database";

export const metadata = {
  title: `Discover | ${SITE_NAME}`,
  description:
    "Discover verified properties and vehicles across Nigeria. Swipe to save, skip, or open listings — built for mobile-first discovery.",
};

export default async function DiscoverPage() {
  const propertyRows = await getPublicProperties({}, 48);
  const { items: properties } = withDemoFallback(propertyRows);

  let vehicleRows: Property[] = [];
  if (isLaunchFeatureVisible("vehicle_marketplace")) {
    const supabase = await createClient();
    if (supabase) {
      vehicleRows = await queryPublicVehicles(supabase, { limit: 48 });
    }
  }

  const { items: vehicles } = withEmptyInventoryDemoFixtures(
    vehicleRows,
    "vehicle",
    48
  );

  const desktopItems = [...vehicles, ...properties].slice(0, 12);

  return (
    <>
      <DiscoverExperience properties={properties} vehicles={vehicles} />
      <div className="mx-auto hidden max-w-7xl px-6 py-10 lg:block xl:px-8">
        <DiscoverDesktopFallback items={desktopItems} />
      </div>
    </>
  );
}
