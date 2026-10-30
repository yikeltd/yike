import { Suspense } from "react";
import { DiscoverExperience } from "@/components/discover/discover-experience";
import { DiscoverDesktopFallback } from "@/components/discover/discover-desktop-fallback";
import { getPublicProperties } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
import {
  queryPublicElectronics,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { withDemoFallback } from "@/lib/mock-listings";
import { withEmptyInventoryDemoFixtures } from "@/lib/demo-ui-fixtures";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  parseDiscoverCategoryParam,
  parseDiscoverElectronicsSubParam,
} from "@/lib/discover/categories";
import {
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilterState,
} from "@/lib/discover/filters";
import { buildDiscoverFeed } from "@/lib/discover/feed";
import { discoverStateScopeFromMarketplaceLocation } from "@/lib/discover/location-scope";
import { getServerMarketplaceLocation } from "@/lib/search-preferences";
import { SITE_NAME } from "@/lib/constants";
import type { Property } from "@/types/database";

export const metadata = {
  title: `Discover | ${SITE_NAME}`,
  description:
    "Discover verified properties, vehicles, and electronics across Nigeria. Swipe to save, skip, or open listings — built for mobile-first discovery.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function DiscoverExperienceFallback() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-navy text-white/70">
      Loading discover…
    </div>
  );
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const marketplaceLoc = await getServerMarketplaceLocation();
  const locationScope = discoverStateScopeFromMarketplaceLocation(marketplaceLoc);
  const inventoryScope = locationScope.state
    ? { state: locationScope.state }
    : {};

  const initialFilters: DiscoverFilterState = {
    ...DEFAULT_DISCOVER_FILTERS,
    category: parseDiscoverCategoryParam(sp.category),
    electronicsSub: parseDiscoverElectronicsSubParam(sp.electronics_sub),
    ...locationScope,
  };

  const propertyRows = await getPublicProperties(inventoryScope, 48);
  const { items: properties } = withDemoFallback(propertyRows);

  let vehicleRows: Property[] = [];
  let electronicsRows: Property[] = [];
  const supabase = await createClient();
  if (supabase) {
    if (isLaunchFeatureVisible("vehicle_marketplace")) {
      vehicleRows = await queryPublicVehicles(supabase, {
        limit: 48,
        ...inventoryScope,
      });
    }
    if (isLaunchFeatureVisible("electronics_marketplace")) {
      electronicsRows = await queryPublicElectronics(supabase, {
        limit: 48,
        ...inventoryScope,
      });
    }
  }

  const { items: vehicles } = withEmptyInventoryDemoFixtures(
    vehicleRows,
    "vehicle",
    48,
  );
  const electronics = electronicsRows.slice(0, 48);

  const mixedFeed = buildDiscoverFeed(
    properties,
    vehicles,
    { ...DEFAULT_DISCOVER_FILTERS, category: "all" },
    undefined,
    electronics,
  );
  const desktopItems = mixedFeed.slice(0, 12);

  return (
    <>
      <Suspense fallback={<DiscoverExperienceFallback />}>
        <DiscoverExperience
          properties={properties}
          vehicles={vehicles}
          electronics={electronics}
          initialFilters={initialFilters}
        />
      </Suspense>
      <div className="mx-auto hidden max-w-7xl px-6 py-10 lg:block xl:px-8">
        <DiscoverDesktopFallback items={desktopItems} />
      </div>
    </>
  );
}
