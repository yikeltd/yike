"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Building,
  Car,
  ChevronRight,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { HomeAdSlot } from "@/components/ads/home-ad-slot";
import { PropertyGrid } from "@/components/property/property-grid";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HOME_RAIL_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import {
  QuickFinderBar,
  MarketplaceSection,
  DealerDiscoveryRow,
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

/**
 * YIKE HOMEPAGE — PIXEL-PERFECT IMPLEMENTATION
 * Matches reference image input_file_0.png strictly across all 15 sections.
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
  ];

  const quickCategories = [
    { label: "Featured", icon: Car, bg: "bg-amber-100 text-amber-600", category: "vehicle" },
    { label: "SUVs", icon: Truck, bg: "bg-blue-100 text-blue-600", category: "vehicle" },
    { label: "Trucks", icon: Truck, bg: "bg-purple-100 text-purple-600", category: "vehicle" },
    { label: "Homes", icon: HomeIcon, bg: "bg-emerald-100 text-emerald-600", category: "property" },
    { label: "Land", icon: Building, bg: "bg-cyan-100 text-cyan-600", category: "property" },
    { label: "Commercial", icon: Store, bg: "bg-rose-100 text-rose-600", category: "property" },
    { label: "All", icon: LayoutGrid, bg: "bg-slate-100 text-slate-600", category: "all" },
  ];

  return (
    <div className="home-canvas min-h-[100dvh] pb-24 lg:pb-8 bg-[#f7f9fc]">
      
      {/* 1. HEADER (DEEP NAVY HEADER WITH EMBEDDED SEARCH PILL) */}
      <header className="sticky top-0 z-40 bg-[#031B4E] px-3 pb-2.5 pt-2.5 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
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
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-navy/5 border border-navy/10 px-2.5 py-1 text-[10px] font-bold text-navy shadow-xs"
              >
                <MapPin className="h-3 w-3 text-gold" />
                <span>Nigeria</span>
                <ChevronRight className="h-3 w-3 rotate-90 text-navy/50" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add (+) & Notification Bell (with yellow 3 counter) */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/agent/listings/choose"
              className="pressable flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-xs hover:bg-white/20"
              aria-label="Add Listing"
            >
              <Plus className="h-5 w-5" strokeWidth={2.25} />
            </Link>

            <Link
              href="/conversations"
              className="pressable relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-xs hover:bg-white/20"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-black text-navy shadow-xs border border-[#031B4E]">
                3
              </span>
            </Link>
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

        {/* 3. CATEGORY GRID (HORIZONTAL QUICK CATEGORIES WITH ICONS & LABELS) */}
        <section className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => {
                  if (cat.category === "vehicle" || cat.category === "property") {
                    syncCategory(cat.category);
                  }
                }}
                className="pressable flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-navy/[0.06] bg-white p-2 text-center shadow-xs hover:border-gold shrink-0 w-20 min-h-[72px]"
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", cat.bg)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-bold text-navy truncate leading-none">{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* 4. FEATURED CAROUSEL */}
        <MarketplaceSection title="Featured" href={featuredCopy.href} band="white">
          {isVehicle ? (
            <VehicleRail items={featuredNearItems} />
          ) : (
            <PropertyRail items={featuredNearItems} trackFeatured />
          )}
        </MarketplaceSection>

        {/* 5. TRENDING CAROUSEL */}
        <MarketplaceSection title="Trending" href={trendingCopy.href} band="warm">
          {isVehicle ? (
            <VehicleRail items={vehicleRails.trending.items.slice(0, 4)} />
          ) : (
            <PropertyRail items={propertyRails.trending.items.slice(0, 4)} />
          )}
        </MarketplaceSection>

        {/* 6. RECENTLY ADDED NEAR YOU CAROUSEL */}
        <MarketplaceSection title={recentCopy.title} href={recentCopy.href} band="ivory">
          {isVehicle ? (
            <VehicleRail items={vehicleRails.recent.items} />
          ) : (
            <PropertyRail items={propertyRails.recent.items} />
          )}
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
        {isVehicle && vehicleRails.premium.length > 0 ? (
          <MarketplaceSection title="Premium Picks" href="/vehicles?featured=1" band="sand">
            <VehicleRail items={vehicleRails.premium} />
          </MarketplaceSection>
        ) : null}

        {/* 10-13. CATEGORY TILES (SUVs, Pickups, Commercial, Luxury) */}
        <section className="grid grid-cols-4 gap-2">
          {/* SUVs Tile */}
          <Link
            href="/vehicles?category=suv"
            className="pressable relative overflow-hidden rounded-2xl h-24 p-2 text-white flex flex-col justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80&fit=crop"
              alt="SUVs"
              fill
              className="object-cover brightness-[0.55] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-xs font-black text-white">SUVs</span>
              <ChevronRight className="h-3 w-3 text-gold" />
            </div>
            <span className="relative z-10 text-[9px] font-bold text-gold">View all →</span>
          </Link>

          {/* Pickups Tile */}
          <Link
            href="/vehicles?category=truck"
            className="pressable relative overflow-hidden rounded-2xl h-24 p-2 text-white flex flex-col justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&q=80&fit=crop"
              alt="Pickups"
              fill
              className="object-cover brightness-[0.55] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-xs font-black text-white">Pickups</span>
              <ChevronRight className="h-3 w-3 text-gold" />
            </div>
            <span className="relative z-10 text-[9px] font-bold text-gold">View all →</span>
          </Link>

          {/* Commercial Tile */}
          <Link
            href="/vehicles?category=commercial"
            className="pressable relative overflow-hidden rounded-2xl h-24 p-2 text-white flex flex-col justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80&fit=crop"
              alt="Commercial"
              fill
              className="object-cover brightness-[0.55] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-xs font-black text-white">Commercial</span>
              <ChevronRight className="h-3 w-3 text-gold" />
            </div>
            <span className="relative z-10 text-[9px] font-bold text-gold">View all →</span>
          </Link>

          {/* Luxury Tile */}
          <Link
            href="/vehicles?luxury=1"
            className="pressable relative overflow-hidden rounded-2xl h-24 p-2 text-white flex flex-col justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80&fit=crop"
              alt="Luxury"
              fill
              className="object-cover brightness-[0.55] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="text-xs font-black text-white">Luxury</span>
              <ChevronRight className="h-3 w-3 text-gold" />
            </div>
            <span className="relative z-10 text-[9px] font-bold text-gold">View all →</span>
          </Link>
        </section>

        {/* 14. NEARBY & ALL LISTINGS BANNERS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Nearby Banner */}
          <Link
            href="/vehicles"
            className="pressable relative overflow-hidden rounded-2xl h-20 p-3 text-white flex items-center justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&q=80&fit=crop"
              alt="Nearby Aba GRA"
              fill
              className="object-cover brightness-[0.45] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 space-y-0.5">
              <h3 className="text-sm font-black text-white">Nearby • Aba GRA</h3>
              <p className="text-[10px] font-medium text-white/80">Listings close to your location</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-gold flex items-center gap-1">
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {/* All Listings Banner */}
          <Link
            href="/search"
            className="pressable relative overflow-hidden rounded-2xl h-20 p-3 text-white flex items-center justify-between border border-navy/10 shadow-xs group"
          >
            <Image
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80&fit=crop"
              alt="All Listings"
              fill
              className="object-cover brightness-[0.45] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">All Listings</h3>
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[8px] font-extrabold text-navy">Feat</span>
                <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white">✓ Verified</span>
              </div>
              <p className="text-[10px] font-medium text-white/80">Explore entire nationwide marketplace</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-gold flex items-center gap-1">
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </section>

        {/* 15. ALL LISTINGS GRID */}
        {(isVehicle ? vehicleRails.nationwide : propertyRails.nationwide).length > 0 ? (
          <MarketplaceSection title="All Listings" href={nationwideCopy.href} band="white">
            {isVehicle ? (
              <VehicleRail items={vehicleRails.nationwide} />
            ) : (
              <PropertyRail items={propertyRails.nationwide} />
            )}
          </MarketplaceSection>
        ) : null}

        {/* ============================================================================== */}
        {/* ADVERTISEMENT CONTAINER (CLEAN RESERVED CONTAINER, NO DUMMY TEXT OR ICONS) */}
        {/* ============================================================================== */}
        <section className="pt-2 pb-2">
          {homepageAds.homepage_slot_1 ? (
            <HomeAdSlot ad={homepageAds.homepage_slot_1} placement="homepage_slot_1" />
          ) : (
            /* CLEAN RESERVED CONTAINER WITH NO PLACEHOLDER TEXT/ICONS WHEN NO AD IS PUBLISHED */
            <div className="h-20 w-full rounded-2xl border border-navy/15 bg-white/40 shadow-xs" />
          )}
        </section>

      </div>
    </div>
  );
}
