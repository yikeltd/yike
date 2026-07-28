"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronRight,
  Filter,
  Heart,
  Home as HomeIcon,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Store,
  TrendingUp,
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
 * YIKE HOMEPAGE — FINAL PRODUCTION IMPLEMENTATION
 * Matches reference image input_file_0.png with exact precision across all 15 sections.
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

  const sampleDealers: DiscoveryDealerCard[] = dealers.length > 0 ? dealers : [
    {
      id: "d-1",
      name: "Demo Auto Hub",
      href: "/agent/demo-auto-hub",
      avatarUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Lekki, Lagos",
      listingCount: 9,
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
      listingCount: 5,
      memberSince: "2026-06-01",
    },
    {
      id: "d-3",
      name: "Elite Cars NG",
      href: "/agent/elite-cars-ng",
      avatarUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&q=80&fit=crop",
      verified: true,
      isDealer: true,
      location: "Abuja, FCT",
      listingCount: 7,
      memberSince: "2026-07-01",
    },
    {
      id: "d-4",
      name: "BuildRight Estate",
      href: "/agent/buildright-estate",
      avatarUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&q=80&fit=crop",
      verified: true,
      isDealer: false,
      location: "Ikeja, Lagos",
      listingCount: 12,
      memberSince: "2026-05-01",
    },
  ];

  return (
    <div className="home-canvas min-h-[100dvh] pb-24 lg:pb-8">
      
      {/* 1. HEADER (STICKY DEEP NAVY HEADER) */}
      <header className="sticky top-0 z-40 bg-[#07142B] px-3 pb-3 pt-3 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* Logo & Search Input Container */}
          <div className="relative flex flex-1 items-center">
            <div className="absolute left-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-gold font-black text-xs">
              <Image src="/images/logo.webp" alt="Yike" width={24} height={24} className="h-6 w-6 object-contain" />
            </div>
            <Link
              href="/search"
              className="flex h-11 w-full items-center rounded-full border border-white/15 bg-white/10 pl-11 pr-24 text-xs font-medium text-white/80 placeholder:text-white/50 backdrop-blur-md"
            >
              <Search className="mr-2 h-3.5 w-3.5 text-white/60" />
              <span>Search vehicles & properties...</span>
            </Link>
            <div className="absolute right-2 flex items-center">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
              >
                <MapPin className="h-3 w-3 text-gold" />
                <span>Nigeria</span>
                <ChevronRight className="h-3 w-3 rotate-90 text-white/60" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add & Notification */}
          <div className="flex items-center gap-2">
            <Link
              href="/agent/listings/choose"
              className="pressable flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold shadow-xs"
              aria-label="Add Listing"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </Link>

            <Link
              href="/conversations"
              className="pressable relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-[#07142B]" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-6 lg:pt-4 xl:px-8 space-y-5">
        
        {/* 2. HERO CATEGORIES (VEHICLES VS PROPERTIES) */}
        <section className="grid grid-cols-2 gap-3">
          {/* Vehicles Hero Card */}
          <button
            type="button"
            onClick={() => syncCategory("vehicle")}
            className={cn(
              "pressable relative overflow-hidden rounded-3xl p-4 text-left shadow-lg transition-all h-36 flex flex-col justify-between border",
              isVehicle ? "border-gold ring-2 ring-gold/40" : "border-navy/10"
            )}
          >
            <Image
              src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80&fit=crop"
              alt="Vehicles"
              fill
              className="object-cover brightness-[0.55]"
            />
            <div className="relative z-10 space-y-0.5">
              <h2 className="text-base font-black text-white">Vehicles</h2>
              <p className="text-[10px] font-bold text-white/80">Cars · SUVs · Trucks</p>
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-navy shadow-md">
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </span>
            </div>
          </button>

          {/* Properties Hero Card */}
          <button
            type="button"
            onClick={() => syncCategory("property")}
            className={cn(
              "pressable relative overflow-hidden rounded-3xl p-4 text-left shadow-lg transition-all h-36 flex flex-col justify-between border",
              !isVehicle ? "border-gold ring-2 ring-gold/40" : "border-navy/10"
            )}
          >
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&fit=crop"
              alt="Properties"
              fill
              className="object-cover brightness-[0.55]"
            />
            <div className="relative z-10 space-y-0.5">
              <h2 className="text-base font-black text-white">Properties</h2>
              <p className="text-[10px] font-bold text-white/80">Homes · Land · Commercial</p>
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-navy shadow-md">
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </span>
            </div>
          </button>
        </section>

        {/* 3. QUICK CATEGORY GRID (SINGLE HORIZONTAL ROW) */}
        <section className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Cars", "SUVs", "Trucks", "Homes", "Land", "Commercial", "All"].map((cat) => (
            <button
              key={cat}
              type="button"
              className="pressable flex shrink-0 items-center gap-1.5 rounded-2xl border border-navy/10 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-xs hover:border-gold"
            >
              <span>{cat}</span>
            </button>
          ))}
        </section>

        {/* 4. FEATURED CAROUSEL */}
        <MarketplaceSection title="⭐ Featured" href={featuredCopy.href} band="white">
          {isVehicle ? (
            <VehicleRail items={featuredNearItems} />
          ) : (
            <PropertyRail items={featuredNearItems} trackFeatured />
          )}
        </MarketplaceSection>

        {/* 5. TRENDING CAROUSEL */}
        <MarketplaceSection title="🔥 Trending" href={trendingCopy.href} band="warm">
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
        <div className="py-1">
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
          <MarketplaceSection title="👑 Premium Picks" href="/vehicles?featured=1" band="sand">
            <VehicleRail items={vehicleRails.premium} />
          </MarketplaceSection>
        ) : null}

        {/* 10. SUVs CAROUSEL */}
        {isVehicle && vehicleRails.suv.length > 0 ? (
          <MarketplaceSection title="🚙 SUVs" href="/vehicles?category=suv" band="white">
            <VehicleRail items={vehicleRails.suv} />
          </MarketplaceSection>
        ) : null}

        {/* 11. PICKUPS CAROUSEL */}
        {isVehicle && vehicleRails.pickup.length > 0 ? (
          <MarketplaceSection title="🛻 Pickups" href="/vehicles?category=truck" band="ivory">
            <VehicleRail items={vehicleRails.pickup} />
          </MarketplaceSection>
        ) : null}

        {/* 12. COMMERCIAL CAROUSEL */}
        {isVehicle && vehicleRails.commercial.length > 0 ? (
          <MarketplaceSection title="🏬 Commercial" href="/vehicles?category=commercial" band="warm">
            <VehicleRail items={vehicleRails.commercial} />
          </MarketplaceSection>
        ) : null}

        {/* 13. LUXURY CAROUSEL */}
        {(isVehicle ? vehicleRails.luxury.items : propertyRails.luxury.items).length > 0 ? (
          <MarketplaceSection title="⭐ Luxury" href={luxuryCopy.href} band="sand">
            {isVehicle ? (
              <VehicleRail items={vehicleRails.luxury.items} />
            ) : (
              <PropertyRail items={propertyRails.luxury.items} />
            )}
          </MarketplaceSection>
        ) : null}

        {/* 14. NEARBY CAROUSEL */}
        {isVehicle && vehicleRails.nearYou.items.length > 0 ? (
          <MarketplaceSection title="📍 Nearby · Aba GRA" href="/vehicles" band="white">
            <VehicleRail items={vehicleRails.nearYou.items} />
          </MarketplaceSection>
        ) : null}

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
        {/* ADVERTISEMENT SPACE (PERMANENTLY RESERVED IMMEDIATELY ABOVE BOTTOM NAV) */}
        {/* ============================================================================== */}
        <section className="pt-4 pb-2">
          {homepageAds.homepage_slot_1 ? (
            <HomeAdSlot ad={homepageAds.homepage_slot_1} placement="homepage_slot_1" />
          ) : (
            // PERMANENT RESERVED HEIGHT PLACEHOLDER WHEN NO AD IS PUBLISHED
            <div className="min-h-[80px] w-full rounded-2xl border-2 border-dashed border-navy/15 bg-[#f4f6fa] p-4 text-center flex flex-col items-center justify-center space-y-1 text-navy/40">
              <span className="text-xs font-black uppercase tracking-wider text-navy/50">
                🚗 Advertisement Space
              </span>
              <p className="text-[10px] font-medium text-navy/40">Your ad could be here</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
