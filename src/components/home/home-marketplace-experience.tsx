"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  ChevronRight,
  Home as HomeIcon,
  MapPin,
} from "lucide-react";
import { HomeAdSlot } from "@/components/ads/home-ad-slot";
import { PropertyGrid } from "@/components/property/property-grid";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HOME_RAIL_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import {
  QuickFinderBar,
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
import { cn } from "@/lib/utils";

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

export function HomeMarketplaceExperience({
  initialCategory,
  propertyRails,
  vehicleRails,
  marketplaceLocation = null,
  showingDemoFixtures: _showingDemoFixtures = false,
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

  const recentCopy = recentRailCopy(loc, rails.recent.scope, kind);
  const trendingCopy = trendingRailCopy(
    loc,
    isVehicle ? vehicleRails.trending.scope : propertyRails.trending.scope,
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
      {/* DESKTOP EXPERIENCE (RESTORED LEGACY HOMEPAGE) */}
      <HomeDesktopView
        featuredItems={featuredNearItems}
        trendingItems={isVehicle ? vehicleRails.trending.items : propertyRails.trending.items}
        recentItems={isVehicle ? vehicleRails.recent.items : propertyRails.recent.items}
        luxuryItems={isVehicle ? (vehicleRails.luxury.items.length > 0 ? vehicleRails.luxury.items : vehicleRails.featured.items) : (propertyRails.luxury.items.length > 0 ? propertyRails.luxury.items : propertyRails.featured.items)}
        nationwideItems={isVehicle ? vehicleRails.nationwide : propertyRails.nationwide}
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

        {/* 1. MOBILE HEADER */}
        <header className="sticky top-0 z-40 bg-[#031B4E] px-3 pb-2.5 pt-2.5 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center">
          {/* Logo & Search Field Pill */}
          <div className="relative flex flex-1 items-center bg-white rounded-full h-11 px-2.5 shadow-sm border border-white/20">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#031B4E] text-gold font-black text-xs shrink-0">
              <Image src="/images/logo.webp" alt="Yike Logo" width={22} height={22} className="h-5.5 w-5.5 object-contain" />
            </div>
            <Link
              href="/search"
              className="flex flex-1 items-center px-2 text-xs font-medium text-navy/60 truncate"
            >
              <span>Search vehicles & properties</span>
            </Link>
            <div className="flex items-center shrink-0">
              <MarketplaceLocationIndicator
                size="sm"
                variant="chip"
                className="!bg-navy/5 !border-navy/10 !text-navy hover:!bg-navy/10"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-6 lg:pt-4 xl:px-8 space-y-4">
        
        {/* 2. CATEGORY HERO (VEHICLES VS PROPERTIES CARDS) */}
        <section className="grid grid-cols-2 gap-2.5">
          {/* Vehicles Hero Card */}
          <button
            type="button"
            onClick={() => syncCategory("vehicle")}
            className={cn(
              "pressable relative overflow-hidden rounded-3xl p-3.5 text-left shadow-md transition-all h-32 flex flex-col justify-between border",
              isVehicle ? "border-gold ring-2 ring-gold/40" : "border-navy/10"
            )}
          >
            <Image
              src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80&fit=crop"
              alt="Vehicles"
              fill
              className="object-cover brightness-[0.55]"
            />
            <div className="relative z-10 flex items-start justify-between w-full">
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-white leading-tight">Vehicles</h2>
                <p className="text-[10px] font-bold text-white/80">Cars • SUVs • Trucks</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gold/90 text-navy shadow-sm">
                <Car className="h-4 w-4" />
              </span>
            </div>
            <div className="relative z-10 flex items-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy shadow-md">
                <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
              </span>
            </div>
          </button>

          {/* Properties Hero Card */}
          <button
            type="button"
            onClick={() => syncCategory("property")}
            className={cn(
              "pressable relative overflow-hidden rounded-3xl p-3.5 text-left shadow-md transition-all h-32 flex flex-col justify-between border",
              !isVehicle ? "border-gold ring-2 ring-gold/40" : "border-navy/10"
            )}
          >
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&fit=crop"
              alt="Properties"
              fill
              className="object-cover brightness-[0.55]"
            />
            <div className="relative z-10 flex items-start justify-between w-full">
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-white leading-tight">Properties</h2>
                <p className="text-[10px] font-bold text-white/80">Homes • Land • Commercial</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gold/90 text-navy shadow-sm">
                <HomeIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="relative z-10 flex items-center">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy shadow-md">
                <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
              </span>
            </div>
          </button>
        </section>

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

        {/* 8. QUICK FILTERS */}
        <div className="py-0.5">
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

        {/* 9. PREMIUM PICKS CAROUSEL */}
        <MarketplaceSection title="Premium Picks" href="/vehicles?featured=1" band="sand">
          <CarouselRail
            items={isVehicle ? (vehicleRails.premium.length > 0 ? vehicleRails.premium : vehicleRails.featured.items) : (propertyRails.featuredExtra.length > 0 ? propertyRails.featuredExtra : propertyRails.featured.items)}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 10. SUVs CAROUSEL */}
        <MarketplaceSection title="SUVs" href="/vehicles?category=suv" band="white">
          <CarouselRail
            items={isVehicle ? (vehicleRails.suv.length > 0 ? vehicleRails.suv : vehicleRails.recent.items) : propertyRails.recent.items}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 11. PICKUPS CAROUSEL */}
        <MarketplaceSection title="Pickups" href="/vehicles?category=truck" band="ivory">
          <CarouselRail
            items={isVehicle ? (vehicleRails.pickup.length > 0 ? vehicleRails.pickup : vehicleRails.trending.items) : propertyRails.trending.items}
            kind={kind}
          />
        </MarketplaceSection>

        {/* 12. COMMERCIAL CAROUSEL */}
        <MarketplaceSection title="Commercial" href="/vehicles?category=commercial" band="warm">
          <CarouselRail
            items={isVehicle ? (vehicleRails.commercial.length > 0 ? vehicleRails.commercial : vehicleRails.nationwide) : (propertyRails.commercial.length > 0 ? propertyRails.commercial : propertyRails.nationwide)}
            kind={kind}
          />
        </MarketplaceSection>

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
