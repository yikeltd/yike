"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HomeAdSlot } from "@/components/ads/home-ad-slot";
import { PropertyGrid } from "@/components/property/property-grid";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HOME_RAIL_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import {
  MarketplaceSection,
  DealerDiscoveryRow,
  CarouselRail,
} from "@/components/marketplace/experience";
import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";
import {
  homeCategoryQueryValue,
  parseHomeCategory,
  type HomeMarketplaceCategory,
} from "@/lib/home/marketplace-category";
import type { Advertisement, Property } from "@/types/database";
import type { LocationScope } from "@/lib/marketplace-location";
import {
  featuredRailCopy,
  recentRailCopy,
  trendingRailCopy,
  luxuryRailCopy,
  nationwideRailCopy,
} from "@/lib/marketplace-location";
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
  electronicsRecent?: Property[];
  mixedLatest?: Property[];
  latestOnYikeError?: boolean;
  marketplaceLocation?: { city: string; state?: string } | null;
  showingDemoFixtures?: boolean;
  /** Explicit dev sample catalog (YIKE_SAMPLE_LISTINGS_FIXTURE=1) — show banner. */
  showingSampleListingsFixture?: boolean;
  homepageTopAd?: Advertisement | null;
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

import { HomeDesktopView } from "@/components/home/home-desktop-view";
import { HomeCompactMarketplaceHero } from "@/components/home/home-compact-marketplace-hero";
import { SampleFixtureBanner } from "@/components/sample-listings/sample-fixture-banner";

export function HomeMarketplaceExperience({
  initialCategory,
  propertyRails,
  vehicleRails,
  electronicsRecent = [],
  mixedLatest = [],
  latestOnYikeError = false,
  marketplaceLocation = null,
  showingDemoFixtures: _showingDemoFixtures = false,
  showingSampleListingsFixture = false,
  homepageTopAd = null,
  dealers = [],
  categoryCounts: _categoryCounts = {},
}: Props) {
  void _categoryCounts;
  void _showingDemoFixtures;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const electronicsOn = isLaunchFeatureVisible("electronics_marketplace");
  const [, startTransition] = useTransition();

  const normalizeCategory = useCallback(
    (raw: HomeMarketplaceCategory): HomeMarketplaceCategory => {
      if (raw === "vehicle" && !vehiclesOn) return "property";
      if (raw === "electronics" && !electronicsOn) return vehiclesOn ? "vehicle" : "property";
      return raw;
    },
    [vehiclesOn, electronicsOn],
  );

  const [category, setCategory] = useState<HomeMarketplaceCategory>(() =>
    normalizeCategory(initialCategory),
  );

  useEffect(() => {
    setCategory(normalizeCategory(parseHomeCategory(searchParams.get("category"))));
  }, [searchParams, normalizeCategory]);

  const syncCategory = useCallback(
    (next: HomeMarketplaceCategory) => {
      const safe = normalizeCategory(next);
      setCategory(safe);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", homeCategoryQueryValue(safe));
      if (safe === "vehicle") {
        ["type", "hub", "property_type", "min", "max", "area"].forEach((k) =>
          params.delete(k),
        );
      } else if (safe === "electronics") {
        ["type", "hub", "property_type", "min", "max", "area", "make"].forEach((k) =>
          params.delete(k),
        );
      } else {
        params.delete("make");
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, normalizeCategory, startTransition],
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
      const qs = params.toString();
      const href = qs ? `/vehicles?${qs}` : "/vehicles";
      addRecentSearch({ label, href });
      router.push(href);
    },
    [router],
  );

  const handleElectronicsSearch = useCallback(
    ({ params, label }: BrowseSearchPayload) => {
      const qs = params.toString();
      const href = qs ? `/electronics?${qs}` : "/electronics";
      addRecentSearch({ label, href });
      router.push(href);
    },
    [router],
  );

  const isVehicle = category === "vehicle";
  const isElectronics = category === "electronics";
  const kind: "vehicle" | "property" | "electronics" = isVehicle
    ? "vehicle"
    : isElectronics
      ? "electronics"
      : "property";
  const loc = marketplaceLocation
    ? {
        city: marketplaceLocation.city,
        state: marketplaceLocation.state ?? "",
        source: "cookie" as const,
        updatedAt: 0,
      }
    : null;

  const rails = isVehicle
    ? vehicleRails
    : isElectronics
      ? {
          featured: { items: electronicsRecent, scope: "nationwide" as LocationScope, expanded: true },
          recent: { items: electronicsRecent, scope: "nationwide" as LocationScope, expanded: true },
          nearYou: { items: electronicsRecent, scope: "nationwide" as LocationScope, expanded: true },
          trending: { items: electronicsRecent, scope: "nationwide" as LocationScope, expanded: true },
          luxury: { items: electronicsRecent, scope: "nationwide" as LocationScope, expanded: true },
          nationwide: electronicsRecent,
          commercial: [],
          featuredExtra: [],
        }
      : propertyRails;

  const featuredNearItems = isVehicle
    ? vehicleRails.featured.items
    : isElectronics
      ? electronicsRecent
      : propertyRails.nearYou.items.length > 0
        ? propertyRails.nearYou.items
        : propertyRails.featured.items;
  const featuredNearScope = isVehicle
    ? vehicleRails.featured.scope
    : isElectronics
      ? "nationwide"
      : propertyRails.nearYou.items.length > 0
        ? propertyRails.nearYou.scope
        : propertyRails.featured.scope;
  const featuredCopy = featuredRailCopy(loc, featuredNearScope, kind);

  const recentCopy = recentRailCopy(loc, rails.recent.scope, kind);
  const trendingCopy = trendingRailCopy(
    loc,
    isVehicle
      ? vehicleRails.trending.scope
      : isElectronics
        ? "nationwide"
        : propertyRails.trending.scope,
    kind,
  );
  const luxuryCopy = luxuryRailCopy(loc, rails.luxury.scope, kind);
  const nationwideCopy = nationwideRailCopy(kind);

  const sampleDealers: DiscoveryDealerCard[] = dealers.length > 0 ? dealers : [
    {
      id: "d-1",
      name: "Demo Auto Hub",
      href: "/agent/demo-auto-hub",
      avatarUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Lagos, Lagos",
      listingCount: 12,
      memberSince: "2026-07-01",
    },
    {
      id: "d-2",
      name: "Prime Motors",
      href: "/agent/prime-motors",
      avatarUrl: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Port Harcourt, Rivers",
      listingCount: 9,
      memberSince: "2026-07-01",
    },
    {
      id: "d-3",
      name: "BPS Cars NG",
      href: "/agent/bps-cars-ng",
      avatarUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Abuja, FCT",
      listingCount: 15,
      memberSince: "2026-07-01",
    },
    {
      id: "d-4",
      name: "BuildRight Estate",
      href: "/agent/buildright-estate",
      avatarUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&q=80&fit=crop",
      verified: true,
      isDealer: false,
      location: "Lagos, Lagos",
      listingCount: 8,
      memberSince: "2025-05-01",
    },
    {
      id: "d-5",
      name: "City Motors",
      href: "/agent/city-motors",
      avatarUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Ibadan, Oyo",
      listingCount: 11,
      memberSince: "2026-03-01",
    },
    {
      id: "d-6",
      name: "BlueStone Properties",
      href: "/agent/bluestone-properties",
      avatarUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=120&q=80&fit=crop",
      verified: true,
      isDealer: false,
      location: "Enugu, Enugu",
      listingCount: 14,
      memberSince: "2025-08-01",
    },
    {
      id: "d-7",
      name: "Golden Wheels",
      href: "/agent/golden-wheels",
      avatarUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Kano, Kano",
      listingCount: 10,
      memberSince: "2026-01-01",
    },
    {
      id: "d-8",
      name: "Urban Developers",
      href: "/agent/urban-developers",
      avatarUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=120&q=80&fit=crop",
      verified: true,
      isDealer: false,
      location: "Asaba, Delta",
      listingCount: 16,
      memberSince: "2025-11-01",
    },
    {
      id: "d-9",
      name: "Prestige Homes",
      href: "/agent/prestige-homes",
      avatarUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=120&q=80&fit=crop",
      verified: true,
      isDealer: false,
      location: "Calabar, Cross River",
      listingCount: 7,
      memberSince: "2026-04-01",
    },
    {
      id: "d-10",
      name: "Capital Auto Mall",
      href: "/agent/capital-auto-mall",
      avatarUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Abuja, FCT",
      listingCount: 22,
      memberSince: "2025-09-01",
    },
  ];


  return (
    <div className="home-canvas min-h-[100dvh] pb-24 lg:pb-8 bg-[#f7f9fc]">
      {showingSampleListingsFixture ? (
        <SampleFixtureBanner />
      ) : null}
      {/* DESKTOP EXPERIENCE (RESTORED LEGACY HOMEPAGE) */}
      <HomeDesktopView
        category={category}
        onCategoryChange={syncCategory}
        browseInitial={browseInitial}
        onPropertySearch={handlePropertySearch}
        onVehicleSearch={handleVehicleSearch}
        onElectronicsSearch={handleElectronicsSearch}
        propertyRails={{
          featuredItems: propertyRails.featured.items,
          trendingItems: propertyRails.trending.items,
          recentItems: propertyRails.recent.items,
          luxuryItems:
            propertyRails.luxury.items.length > 0
              ? propertyRails.luxury.items
              : propertyRails.featured.items,
          nationwideItems: propertyRails.nationwide,
        }}
        vehicleRails={{
          featuredItems: vehicleRails.featured.items,
          trendingItems: vehicleRails.trending.items,
          recentItems: vehicleRails.recent.items,
          luxuryItems:
            vehicleRails.luxury.items.length > 0
              ? vehicleRails.luxury.items
              : vehicleRails.featured.items,
          nationwideItems: vehicleRails.nationwide,
        }}
        electronicsRecent={electronicsRecent}
        mixedLatest={mixedLatest}
        latestOnYikeError={latestOnYikeError}
      />

      {/* MOBILE EXPERIENCE */}
      <div className="lg:hidden">
        {homepageTopAd ? (
          <div className="bg-[#031B4E] px-3 pt-3 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <HomeAdSlot
                ad={homepageTopAd}
                placement="homepage_top"
                className="pb-2"
              />
            </div>
          </div>
        ) : null}

        <HomeCompactMarketplaceHero
          category={category}
          onCategoryChange={syncCategory}
          browseInitial={browseInitial}
          onPropertySearch={handlePropertySearch}
          onVehicleSearch={handleVehicleSearch}
          onElectronicsSearch={handleElectronicsSearch}
        />

      <div className="mx-auto max-w-7xl space-y-3 px-3 pt-3 sm:px-6 lg:px-6 lg:pt-4 xl:px-8">
        {latestOnYikeError ? (
          <MarketplaceSection title="Latest on Yike" href="/discover" band="white">
            <p className="rounded-2xl border border-navy/10 bg-white px-4 py-6 text-center text-sm text-muted">
              Latest listings are unavailable right now. Try again in a moment.
            </p>
          </MarketplaceSection>
        ) : mixedLatest.length > 0 ? (
          <MarketplaceSection title="Latest on Yike" href="/discover" band="white">
            <CarouselRail items={mixedLatest} priorityCount={3} />
          </MarketplaceSection>
        ) : null}

        {/* 4. FEATURED CAROUSEL */}
        <MarketplaceSection title="Featured" href={featuredCopy.href} band="white">
          <CarouselRail items={featuredNearItems} kind={kind} />
        </MarketplaceSection>

        {/* 5. TRENDING CAROUSEL */}
        <MarketplaceSection title="Trending" href={trendingCopy.href} band="warm">
          <CarouselRail
            items={isVehicle ? vehicleRails.trending.items : propertyRails.trending.items}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 6. RECENTLY ADDED NEAR YOU CAROUSEL */}
        <MarketplaceSection title={recentCopy.title} href={recentCopy.href} band="ivory">
          <CarouselRail
            items={isVehicle ? vehicleRails.recent.items : propertyRails.recent.items}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 7. VERIFIED DEALERS & DEVELOPERS CAROUSEL */}
        <DealerDiscoveryRow
          dealers={sampleDealers}
          title="🛡️ Verified Dealers & Developers"
          subtitle="Trusted businesses with live inventory on Yike"
        />

        {electronicsRecent.length > 0 && !isElectronics ? (
          <MarketplaceSection title="Electronics" href="/electronics" band="ivory">
            <CarouselRail items={electronicsRecent} kind="electronics" />
          </MarketplaceSection>
        ) : null}

        {/* 9. PREMIUM PICKS CAROUSEL */}
        <MarketplaceSection title="Premium Picks" href="/vehicles?featured=1" band="sand">
          <CarouselRail
            items={isVehicle ? (vehicleRails.premium.length > 0 ? vehicleRails.premium : vehicleRails.featured.items) : (propertyRails.featuredExtra.length > 0 ? propertyRails.featuredExtra : propertyRails.featured.items)}
            kind={kind}
          />
        </MarketplaceSection>

        {isVehicle ? (
          <>
            <MarketplaceSection title="SUVs" href="/vehicles?category=suv" band="white">
              <CarouselRail
                items={
                  vehicleRails.suv.length > 0 ? vehicleRails.suv : vehicleRails.recent.items
                }
                kind="vehicle"
              />
            </MarketplaceSection>
            <MarketplaceSection title="Pickups" href="/vehicles?category=pickup_van" band="ivory">
              <CarouselRail
                items={
                  vehicleRails.pickup.length > 0
                    ? vehicleRails.pickup
                    : vehicleRails.trending.items
                }
                kind="vehicle"
              />
            </MarketplaceSection>
            <MarketplaceSection title="Heavy equipment" href="/vehicles?group=heavy" band="warm">
              <CarouselRail
                items={
                  vehicleRails.commercial.length > 0
                    ? vehicleRails.commercial
                    : vehicleRails.nationwide
                }
                kind="vehicle"
              />
            </MarketplaceSection>
          </>
        ) : null}

        {/* 13. LUXURY CAROUSEL */}
        <MarketplaceSection title="Luxury" href={luxuryCopy.href} band="sand">
          <CarouselRail
            items={isVehicle ? (vehicleRails.luxury.items.length > 0 ? vehicleRails.luxury.items : vehicleRails.featured.items) : (propertyRails.luxury.items.length > 0 ? propertyRails.luxury.items : propertyRails.featured.items)}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 14. NEARBY CAROUSEL */}
        <MarketplaceSection title="Nearby · Aba GRA" href="/vehicles" band="white">
          <CarouselRail
            items={isVehicle ? (vehicleRails.nearYou.items.length > 0 ? vehicleRails.nearYou.items : vehicleRails.recent.items) : (propertyRails.nearYou.items.length > 0 ? propertyRails.nearYou.items : propertyRails.recent.items)}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 15. ALL LISTINGS GRID */}
        <MarketplaceSection title="All Listings" href={nationwideCopy.href} band="white">
          <CarouselRail
            items={isVehicle ? vehicleRails.nationwide : propertyRails.nationwide}
            kind={kind}
          />
        </MarketplaceSection>

        {/* DYNAMIC FOOTER ADVERTISEMENT (ONLY RENDERS IF ACTIVE CAMPAIGN EXISTS) */}
        {homepageTopAd ? (
          <section className="pt-2 pb-2">
            <HomeAdSlot ad={homepageTopAd} placement="homepage_slot_1" />
          </section>
        ) : null}

        </div>
      </div>
    </div>
  );
}
