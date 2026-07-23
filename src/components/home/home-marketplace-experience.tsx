"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HomeAdSlot } from "@/components/ads/home-ad-slot";
import { HomeDesktopHero } from "@/components/home/home-desktop-hero";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import { HomeFeaturedLocations } from "@/components/home/home-featured-locations";
import { HomeTrustBadges } from "@/components/home/home-trust-badges";
import { PropertyGrid } from "@/components/property/property-grid";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import {
  HOME_RAIL_GRID_CLASS,
} from "@/lib/marketplace/browse-grid";
import {
  homeCategoryQueryValue,
  parseHomeCategory,
  type HomeMarketplaceCategory,
} from "@/lib/home/marketplace-category";
import {
  featuredLocationsForCategory,
} from "@/lib/home/marketplace-trending";
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
import { LocationThinEmptyState } from "@/components/marketplace/marketplace-empty-state";
import { getStateForCity } from "@/lib/constants";
import { budgetValueFromSearchParams } from "@/lib/budget-ranges";
import { chipKeyFromParams } from "@/lib/home-search-params";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import {
  getHeroTrustedAgentsConfig,
  type HeroTrustedAgentsConfig,
} from "@/lib/home/hero-trusted-agents";

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
};

type VehicleRails = {
  featured: RailSlice;
  recent: RailSlice;
  lowMileage: RailSlice;
  trending: RailSlice;
  luxury: RailSlice;
  nationwide: Property[];
};

type Props = {
  initialCategory: HomeMarketplaceCategory;
  propertyRails: PropertyRails;
  vehicleRails: VehicleRails;
  marketplaceLocation?: { city: string; state?: string } | null;
  /** Empty-inventory UI fixtures (no public DEMO badge). */
  showingDemoFixtures?: boolean;
  /** Smart homepage ads — only non-null slots render. */
  homepageAds?: Partial<Record<HomepageAdSlot, Advertisement | null>>;
  trustedAgents?: HeroTrustedAgentsConfig;
};

function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3 lg:mb-3.5">
      <h2 className="min-w-0 text-base font-bold tracking-tight text-navy sm:text-lg lg:text-xl">
        {title}
      </h2>
      <Link
        href={href}
        className="shrink-0 text-xs font-bold text-gold-dark transition-colors hover:text-navy hover:underline sm:text-sm"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function EmptyRail({
  category,
  city,
  state,
}: {
  category: HomeMarketplaceCategory;
  city?: string | null;
  state?: string | null;
}) {
  return (
    <LocationThinEmptyState
      city={city}
      state={state}
      category={category === "vehicle" ? "vehicle" : "property"}
    />
  );
}

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
  const slices = [
    rails.featured,
    rails.recent,
    "nearYou" in rails ? rails.nearYou : undefined,
    "lowMileage" in rails ? rails.lowMileage : undefined,
    rails.trending,
    rails.luxury,
  ].filter(Boolean) as RailSlice[];
  if (slices.some((s) => s.items.length > 0)) return true;
  return rails.nationwide.length > 0;
}

/**
 * Unified responsive homepage:
 * - Desktop (lg+): premium marketplace hero → shared inventory rails
 * - Mobile / tablet (&lt; lg): inventory-first (no hero)
 *
 * Desktop rail order after hero:
 * Featured Near You → Ad → Recently Added → Ad → Luxury → Ad → Recommended → Ad → Popular Cities
 */
export function HomeMarketplaceExperience({
  initialCategory,
  propertyRails,
  vehicleRails,
  marketplaceLocation = null,
  showingDemoFixtures: _showingDemoFixtures = false,
  homepageAds = {},
  trustedAgents,
}: Props) {
  void _showingDemoFixtures;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const [, startTransition] = useTransition();
  const agents = trustedAgents ?? getHeroTrustedAgentsConfig();

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
        placement: "home_desktop_filters",
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
  const locations = featuredLocationsForCategory(category);
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

  // Featured Near You: prefer near-you rail when it has inventory; else featured.
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

  const cityLabel = marketplaceLocation?.city ?? null;
  const stateLabel = marketplaceLocation?.state ?? null;
  const totallyEmpty = !hasAnyInventory(rails);

  return (
    <div>
      <h1 className="sr-only">
        Yike — Browse properties and vehicles across Nigeria
      </h1>

      {/* Desktop only — premium dual-marketplace hero (hidden below lg) */}
      <HomeDesktopHero
        category={category}
        onCategoryChange={syncCategory}
        browseInitial={browseInitial}
        trustedAgents={agents}
        onPropertySearch={handlePropertySearch}
        onVehicleSearch={handleVehicleSearch}
      />

      {/* Mobile / tablet — sticky Properties|Vehicles; inventory-first */}
      <div className="sticky top-14 z-30 border-b border-navy/[0.06] bg-[#F4F6FA]/95 px-3 py-2 backdrop-blur-md sm:px-6 lg:hidden">
        <div className="mx-auto max-w-sm sm:max-w-md">
          <MarketplaceCategoryToggle
            category={category}
            onChange={syncCategory}
            compact
          />
        </div>
      </div>

      {/* Shared inventory rails — all breakpoints */}
      <div className="mx-auto max-w-7xl px-3 pt-2 lg:px-6 lg:pt-6 xl:px-8">
        {totallyEmpty ? (
          <section className="pb-4">
            <EmptyRail
              category={category}
              city={cityLabel}
              state={stateLabel}
            />
          </section>
        ) : (
          <>
            {/* 1. Featured Near You */}
            {featuredNearItems.length > 0 ? (
              <section className="rounded-2xl bg-gradient-to-b from-white to-[#F7F8FC] px-1 pb-4 pt-1 sm:px-2 lg:pb-6">
                <SectionHeader
                  title={featuredNearTitle}
                  href={featuredCopy.href}
                />
                {isVehicle ? (
                  <VehicleRail items={featuredNearItems} />
                ) : (
                  <PropertyRail items={featuredNearItems} trackFeatured />
                )}
              </section>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_1}
              placement="homepage_slot_1"
            />

            {/* 2. Recently Added */}
            {(isVehicle
              ? vehicleRails.recent.items
              : propertyRails.recent.items
            ).length > 0 ? (
              <section className="rounded-2xl bg-[#EEF1F7]/70 px-1 py-4 sm:px-2 lg:py-6">
                <SectionHeader
                  title={recentCopy.title}
                  href={recentCopy.href}
                />
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.recent.items} />
                ) : (
                  <PropertyRail items={propertyRails.recent.items} />
                )}
              </section>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_2}
              placement="homepage_slot_2"
            />

            {/* 3. Luxury */}
            {(isVehicle
              ? vehicleRails.luxury.items
              : propertyRails.luxury.items
            ).length > 0 ? (
              <section className="rounded-2xl bg-gradient-to-b from-white via-gold/[0.04] to-white px-1 py-4 sm:px-2 lg:py-6">
                <SectionHeader
                  title={luxuryCopy.title}
                  href={luxuryCopy.href}
                />
                {isVehicle ? (
                  <VehicleRail items={vehicleRails.luxury.items} />
                ) : (
                  <PropertyRail items={propertyRails.luxury.items} />
                )}
              </section>
            ) : null}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_3}
              placement="homepage_slot_3"
            />

            {/* 4. Recommended */}
            {(() => {
              const trendingItems = isVehicle
                ? vehicleRails.trending.items
                : propertyRails.trending.items;
              const nationwideItems = isVehicle
                ? vehicleRails.nationwide
                : propertyRails.nationwide;
              const useTrending = trendingItems.length > 0;
              const recommendedItems = useTrending
                ? trendingItems
                : nationwideItems;
              if (recommendedItems.length === 0) return null;
              const copy = useTrending ? trendingCopy : nationwideCopy;
              return (
                <section className="rounded-2xl bg-[#F4F6FA] px-1 py-4 sm:px-2 lg:py-6">
                  <SectionHeader
                    title={useTrending ? "Recommended" : "Recommended for you"}
                    href={copy.href}
                  />
                  {isVehicle ? (
                    <VehicleRail items={recommendedItems} />
                  ) : (
                    <PropertyRail items={recommendedItems} />
                  )}
                </section>
              );
            })()}

            <HomeAdSlot
              ad={homepageAds.homepage_slot_4}
              placement="homepage_slot_4"
            />
          </>
        )}

        <HomeFeaturedLocations
          items={locations}
          title="Popular Cities"
          className="pb-4 pt-2"
        />

        <div className="pb-3 pt-1 lg:pb-4">
          <HomeTrustBadges />
        </div>
      </div>
    </div>
  );
}
