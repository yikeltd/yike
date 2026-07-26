"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HomeAdSlot } from "@/components/ads/home-ad-slot";
import { HomeDesktopHero } from "@/components/home/home-desktop-hero";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import { HomeTrustBadges } from "@/components/home/home-trust-badges";
import { PropertyGrid } from "@/components/property/property-grid";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HOME_RAIL_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import {
  QuickFinderBar,
  MarketplaceSection,
  DealerDiscoveryRow,
  DiscoveryEmptyPanel,
} from "@/components/marketplace/experience";
import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";
import {
  homeCategoryQueryValue,
  parseHomeCategory,
  type HomeMarketplaceCategory,
} from "@/lib/home/marketplace-category";
import type { Advertisement, Property } from "@/types/database";
import type { HomepageAdSlot } from "@/lib/advertisements/constants";
import type { LocationScope } from "@/lib/marketplace-location";
import {
  featuredRailCopy,
  recentRailCopy,
  trendingRailCopy,
  luxuryRailCopy,
  nationwideRailCopy,
} from "@/lib/marketplace-location";
import { trackEvent } from "@/lib/analytics";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { getStateForCity } from "@/lib/constants";
import { budgetValueFromSearchParams } from "@/lib/budget-ranges";
import { chipKeyFromParams } from "@/lib/home-search-params";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";

type RailSlice = {
  items: Property[];
  scope: LocationScope;
  expanded: boolean;
};

type PropertyRails = {
  featured: RailSlice;
  recent: RailSlice;
  nearYou: RailSlice;
  trending: RailSlice;
  luxury: RailSlice;
  nationwide: Property[];
  commercial: Property[];
  featuredExtra: Property[];
};

type VehicleRails = {
  featured: RailSlice;
  recent: RailSlice;
  lowMileage: RailSlice;
  trending: RailSlice;
  luxury: RailSlice;
  nationwide: Property[];
  premium: Property[];
  commercial: Property[];
  budget: Property[];
  suv: Property[];
  pickup: Property[];
  nearYou: RailSlice;
};

type Props = {
  initialCategory: HomeMarketplaceCategory;
  propertyRails: PropertyRails;
  vehicleRails: VehicleRails;
  marketplaceLocation?: { city: string; state?: string } | null;
  showingDemoFixtures?: boolean;
  homepageAds?: Partial<Record<HomepageAdSlot, Advertisement | null>>;
  dealers?: DiscoveryDealerCard[];
  categoryCounts?: {
    vehicle?: Record<string, number>;
    property?: Record<string, number>;
  };
};

function PropertyRail({
  items,
  trackFeatured,
}: {
  items: Property[];
  trackFeatured?: boolean;
}) {
  return (
    <PropertyGrid
      properties={items}
      richEmpty={false}
      cardVariant="browse"
      gridClassName={HOME_RAIL_GRID_CLASS}
      trackFeaturedAnalytics={trackFeatured}
      priorityCount={2}
    />
  );
}

function VehicleRail({ items }: { items: Property[] }) {
  return (
    <div className={HOME_RAIL_GRID_CLASS}>
      {items.map((vehicle, i) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          variant="browse"
          priorityImage={i < 2}
        />
      ))}
    </div>
  );
}

function hasAnyInventory(rails: PropertyRails | VehicleRails): boolean {
  const slices: RailSlice[] = [
    rails.featured,
    rails.recent,
    rails.trending,
    rails.luxury,
  ];
  if ("nearYou" in rails && rails.nearYou) slices.push(rails.nearYou);
  if ("lowMileage" in rails && rails.lowMileage) slices.push(rails.lowMileage);
  if (slices.some((s) => s.items.length > 0)) return true;
  if (rails.nationwide.length > 0) return true;
  if ("premium" in rails && rails.premium.length > 0) return true;
  if ("commercial" in rails && rails.commercial.length > 0) return true;
  if ("budget" in rails && rails.budget.length > 0) return true;
  return false;
}

/**
 * Browse-first homepage — Discover → Browse → Trust → Search → Buy.
 * Presentation only: themed rails from existing inventory pools.
 *
 * APPROVED MOBILE LAYOUT (locked): inventory-first — sticky Vehicles|Properties,
 * then listing rails. Do NOT remount HomeMobileHero / search-first chrome on mobile
 * unless the founder explicitly requests a redesign.
 */
export function HomeMarketplaceExperience({
  initialCategory,
  propertyRails,
  vehicleRails,
  marketplaceLocation = null,
  showingDemoFixtures: _showingDemoFixtures = false,
  homepageAds = {},
  dealers = [],
  categoryCounts: _categoryCounts = {},
}: Props) {
  void _categoryCounts;
  void _showingDemoFixtures;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const [, startTransition] = useTransition();

  const [category, setCategory] = useState<HomeMarketplaceCategory>(() =>
    vehiclesOn ? initialCategory : "property",
  );

  useEffect(() => {
    const fromUrl = parseHomeCategory(searchParams.get("category"));
    setCategory(vehiclesOn ? fromUrl : "property");
  }, [searchParams, vehiclesOn]);

  const syncCategory = useCallback(
    (next: HomeMarketplaceCategory) => {
      if (!vehiclesOn && next === "vehicle") return;
      setCategory(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", homeCategoryQueryValue(next));
      if (next === "vehicle") {
        ["type", "hub", "property_type", "min", "max", "area"].forEach((k) =>
          params.delete(k),
        );
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
      trackEvent("search", {
        placement: "home_category_toggle",
        listing_type: next,
      });
    },
    [pathname, router, searchParams, vehiclesOn, startTransition],
  );

  const browseInitial = useMemo(() => {
    const type = searchParams.get("type") ?? "";
    const hub = searchParams.get("hub") ?? "";
    const pt = searchParams.get("property_type") ?? "";
    const city =
      searchParams.get("city") ?? marketplaceLocation?.city ?? "";
    const area = searchParams.get("area") ?? "";
    const state =
      searchParams.get("state") ??
      marketplaceLocation?.state ??
      (city ? getStateForCity(city) ?? "" : "");
    const min = searchParams.get("min") ?? undefined;
    const max = searchParams.get("max") ?? undefined;
    const budgetValue = budgetValueFromSearchParams(min, max);
    return {
      dealKey: chipKeyFromParams({ type, hub, propertyType: pt }),
      state,
      city,
      area,
      propertyType: pt === "shop" ? "" : pt,
      budgetValue,
    };
  }, [searchParams, marketplaceLocation]);

  const handlePropertySearch = useCallback(
    ({ params, label }: BrowseSearchPayload) => {
      trackEvent("search", {
        city: params.get("city") || undefined,
        area: params.get("area") || undefined,
        listing_type: params.get("type") || undefined,
        placement: "home_filters",
      });
      saveBrowsePreferences({
        city: params.get("city") || undefined,
        area: params.get("area") || undefined,
        listingType: params.get("type") || undefined,
        propertyType: params.get("property_type") || undefined,
        minPrice: params.get("min") ? Number(params.get("min")) : undefined,
        maxPrice: params.get("max") ? Number(params.get("max")) : undefined,
      });
      const qs = params.toString();
      const href = qs ? `/search?${qs}` : "/search";
      addRecentSearch({ label, href });
      router.push(href);
    },
    [router],
  );

  const handleVehicleSearch = useCallback(
    ({ params, label }: BrowseSearchPayload) => {
      trackEvent("search", {
        city: params.get("city") || undefined,
        listing_type: "vehicle",
        placement: "home_desktop_vehicle_filters",
      });
      const qs = params.toString();
      const href = qs ? `/vehicles?${qs}` : "/vehicles";
      addRecentSearch({ label, href });
      router.push(href);
    },
    [router],
  );

  const isVehicle = category === "vehicle";
  const kind = isVehicle ? "vehicle" : "property";
  const loc = marketplaceLocation
    ? {
        city: marketplaceLocation.city,
        state: marketplaceLocation.state ?? "",
        source: "cookie" as const,
        updatedAt: 0,
      }
    : null;

  const rails = isVehicle ? vehicleRails : propertyRails;

  const featuredNearItems = isVehicle
    ? vehicleRails.featured.items
    : propertyRails.nearYou.items.length > 0
      ? propertyRails.nearYou.items
      : propertyRails.featured.items;
  const featuredNearScope = isVehicle
    ? vehicleRails.featured.scope
    : propertyRails.nearYou.items.length > 0
      ? propertyRails.nearYou.scope
      : propertyRails.featured.scope;
  const featuredCopy = featuredRailCopy(loc, featuredNearScope, kind);
  const featuredNearTitle =
    loc?.city && featuredNearScope !== "city"
      ? "Featured Near You"
      : featuredCopy.title;

  const recentCopy = recentRailCopy(loc, rails.recent.scope, kind);
  const trendingCopy = trendingRailCopy(
    loc,
    isVehicle ? vehicleRails.trending.scope : propertyRails.trending.scope,
    kind,
  );
  const luxuryCopy = luxuryRailCopy(loc, rails.luxury.scope, kind);
  const nationwideCopy = nationwideRailCopy(kind);

  const totallyEmpty = !hasAnyInventory(rails);

  return (
    <div>
      <h1 className="sr-only">
        Yike — Browse properties and vehicles across Nigeria
      </h1>

      <HomeDesktopHero
        category={category}
        onCategoryChange={syncCategory}
        browseInitial={browseInitial}
        onPropertySearch={handlePropertySearch}
        onVehicleSearch={handleVehicleSearch}
      />

      {/* Vehicles | Properties — keep discovery chrome minimal (approved mobile) */}
      <div className="sticky top-14 z-30 border-b border-navy/[0.06] bg-ivory/95 px-3 py-2 backdrop-blur-md sm:px-6 lg:hidden">
        <div className="mx-auto max-w-sm sm:max-w-md">
          <MarketplaceCategoryToggle
            category={category}
            onChange={syncCategory}
            compact
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-6 lg:pt-4 xl:px-8">
        {totallyEmpty ? (
          <section className="pb-4">
            <DiscoveryEmptyPanel
              category={isVehicle ? "vehicle" : "property"}
              title="Nothing nearby yet — keep browsing"
              subtitle="Popular categories, searches, and cities to explore."
              showLatestHref={isVehicle ? "/vehicles" : "/search"}
            />
          </section>
        ) : (
          <>
            {/* Inventory first — placement tiers, then dealers, then browse */}
            {featuredNearItems.length > 0 ? (
              <MarketplaceSection
                title={isVehicle ? "Featured" : featuredNearTitle}
                href={featuredCopy.href}
                band="white"
              >
                {isVehicle ? (
                  <VehicleRail items={featuredNearItems} />
                ) : (
                  <PropertyRail items={featuredNearItems} trackFeatured />
                )}
              </MarketplaceSection>
            ) : null}

            {(isVehicle
              ? vehicleRails.trending.items
              : propertyRails.trending.items
            ).length > 0 ? (
              <MarketplaceSection
                title="Trending"
                href={trendingCopy.href}
                band="warm"
                className="mt-1"
              >
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.trending.items.slice(0, 4)} />
                ) : (
                  <PropertyRail
                    items={propertyRails.trending.items.slice(0, 4)}
                  />
                )}
              </MarketplaceSection>
            ) : null}

            {(isVehicle
              ? vehicleRails.recent.items
              : propertyRails.recent.items
            ).length > 0 ? (
              <MarketplaceSection
                title={recentCopy.title}
                href={recentCopy.href}
                band="ivory"
                className="mt-1"
              >
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.recent.items} />
                ) : (
                  <PropertyRail items={propertyRails.recent.items} />
                )}
              </MarketplaceSection>
            ) : null}

            {isVehicle && dealers.length > 0 ? (
              <div className="home-rail-section home-band-ivory pb-4 pt-2">
                <DealerDiscoveryRow dealers={dealers} />
              </div>
            ) : null}

            {/* Filters after placement inventory — in-flow (not sticky) */}
            <div className="py-2 lg:py-3">
              <QuickFinderBar
                category={category}
                onSearch={isVehicle ? handleVehicleSearch : handlePropertySearch}
                initial={{
                  state: browseInitial.state,
                  city: browseInitial.city,
                  budgetValue: browseInitial.budgetValue,
                  propertyType: browseInitial.propertyType,
                }}
                tone="light"
              />
            </div>

            <HomeAdSlot
              ad={homepageAds.homepage_slot_1}
              placement="homepage_slot_1"
            />

            {isVehicle && vehicleRails.premium.length > 0 ? (
              <MarketplaceSection
                title="Premium"
                href="/vehicles?featured=1"
                band="sand"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.premium} />
              </MarketplaceSection>
            ) : null}

            {!isVehicle && propertyRails.featuredExtra.length > 0 ? (
              <MarketplaceSection
                title="Featured Properties"
                href="/search?featured=1"
                band="sand"
                className="mt-1 lg:mt-2"
              >
                <PropertyRail items={propertyRails.featuredExtra} trackFeatured />
              </MarketplaceSection>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_2}
              placement="homepage_slot_2"
            />

            {isVehicle && vehicleRails.suv.length > 0 ? (
              <MarketplaceSection
                title="SUVs"
                href="/vehicles?category=suv"
                band="white"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.suv} />
              </MarketplaceSection>
            ) : null}

            {isVehicle && vehicleRails.pickup.length > 0 ? (
              <MarketplaceSection
                title="Pickups"
                href="/vehicles?category=truck"
                band="ivory"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.pickup} />
              </MarketplaceSection>
            ) : null}

            {isVehicle && vehicleRails.commercial.length > 0 ? (
              <MarketplaceSection
                title="Commercial"
                href="/vehicles?category=commercial"
                band="warm"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.commercial} />
              </MarketplaceSection>
            ) : null}

            {!isVehicle && propertyRails.commercial.length > 0 ? (
              <MarketplaceSection
                title="Commercial"
                href="/search?property_type=shop"
                band="warm"
                className="mt-1 lg:mt-2"
              >
                <PropertyRail items={propertyRails.commercial} />
              </MarketplaceSection>
            ) : null}

            {(isVehicle
              ? vehicleRails.luxury.items
              : propertyRails.luxury.items
            ).length > 0 ? (
              <MarketplaceSection
                title={isVehicle ? "Luxury" : luxuryCopy.title}
                href={luxuryCopy.href}
                band="sand"
                className="mt-1 lg:mt-2"
              >
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.luxury.items} />
                ) : (
                  <PropertyRail items={propertyRails.luxury.items} />
                )}
              </MarketplaceSection>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_3}
              placement="homepage_slot_3"
            />

            {isVehicle && vehicleRails.budget.length > 0 ? (
              <MarketplaceSection
                title="Budget picks"
                href="/vehicles?max_price=5000000"
                band="ivory"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.budget} />
              </MarketplaceSection>
            ) : null}

            {isVehicle &&
            vehicleRails.nearYou.items.length > 0 &&
            marketplaceLocation?.city ? (
              <MarketplaceSection
                title={`Nearby · ${marketplaceLocation.city}`}
                href={`/vehicles?city=${encodeURIComponent(marketplaceLocation.city)}`}
                band="white"
                className="mt-1 lg:mt-2"
              >
                <VehicleRail items={vehicleRails.nearYou.items} />
              </MarketplaceSection>
            ) : null}

            {(isVehicle
              ? vehicleRails.nationwide
              : propertyRails.nationwide
            ).length > 0 ? (
              <MarketplaceSection
                title="All listings"
                href={nationwideCopy.href}
                band="white"
                className="mt-1 lg:mt-2"
              >
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.nationwide} />
                ) : (
                  <PropertyRail items={propertyRails.nationwide} />
                )}
              </MarketplaceSection>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_4}
              placement="homepage_slot_4"
            />

            <HomeAdSlot
              ad={homepageAds.homepage_slot_5}
              placement="homepage_slot_5"
            />
          </>
        )}

        <div className="pb-3 pt-1 lg:pb-4">
          <HomeTrustBadges />
        </div>
      </div>
    </div>
  );
}
