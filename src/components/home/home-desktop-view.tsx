"use client";

import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { isTrustVerified } from "@/lib/hub-filters";
import { listingPath } from "@/lib/marketplace/listing-path";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { listingSaveAnalyticsFromProperty } from "@/lib/listings/toggle-listing-save";
import { HeaderDesktop } from "@/components/layout/header-desktop";
import { HomeDesktopHero } from "@/components/home/home-desktop-hero";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";
import { VerifiedDealersHomeSection } from "@/components/home/verified-dealers-home-section";

type RailBundle = {
  featuredItems: Property[];
  trendingItems: Property[];
  recentItems: Property[];
  luxuryItems: Property[];
  nationwideItems: Property[];
};

type Props = {
  category: HomeMarketplaceCategory;
  onCategoryChange: (category: HomeMarketplaceCategory) => void;
  browseInitial: {
    dealKey: string;
    state: string;
    city: string;
    area: string;
    propertyType: string;
    budgetValue: string;
  };
  onPropertySearch: (payload: BrowseSearchPayload) => void;
  onVehicleSearch: (payload: BrowseSearchPayload) => void;
  onElectronicsSearch: (payload: BrowseSearchPayload) => void;
  propertyRails: RailBundle;
  vehicleRails: RailBundle;
  electronicsRecent: Property[];
  mixedLatest: Property[];
  latestOnYikeError?: boolean;
  verifiedDealers?: DiscoveryDealerCard[];
  showingSampleListingsFixture?: boolean;
  showingDemoFixtures?: boolean;
};

function renderDesktopSection(title: string, href: string, items: Property[]) {
  const displayItems = items.slice(0, 4);
  if (displayItems.length === 0) return null;

  return (
    <section className="space-y-4 pt-6">
      <div className="flex items-center justify-between border-l-4 border-gold pl-3">
        <h2 className="text-xl font-black tracking-tight text-navy">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-bold text-gold-dark hover:underline"
        >
          <span>View all</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {displayItems.map((item) => {
          const price = formatPrice(
            Number(item.price),
            item.payment_period,
            item.listing_type,
          );
          const verified = isTrustVerified(item);
          const photo =
            item.media_urls?.[0] ||
            "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80&fit=crop";
          const asset = normalizeAssetType(item.asset_type);

          return (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-navy">
                <Link
                  href={listingPath(item)}
                  className="relative block h-full w-full"
                >
                  <Image
                    src={photo}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5">
                    <span className="rounded-md bg-navy/80 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                      {asset === "VEHICLE"
                        ? "Vehicle"
                        : asset === "ELECTRONICS"
                          ? "Electronics"
                          : "Property"}
                    </span>
                    {verified ? (
                      <span className="flex items-center gap-0.5 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                        ✓ Verified
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="pointer-events-none absolute right-3 top-3 z-10">
                  <ListingSaveButton
                    listingId={item.id}
                    variant="card-overlay"
                    redirectPath={listingPath(item)}
                    analytics={listingSaveAnalyticsFromProperty(item, "card")}
                    sellerId={item.agent_id}
                    listingTitle={item.title}
                  />
                </div>
              </div>
              <div className="space-y-1 bg-white p-4">
                <p className="text-lg font-black tracking-tight text-navy">{price}</p>
                <h3 className="line-clamp-1 text-xs font-bold text-navy/80 transition-colors group-hover:text-gold-dark">
                  {item.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HomeDesktopView({
  category,
  onCategoryChange,
  browseInitial,
  onPropertySearch,
  onVehicleSearch,
  onElectronicsSearch,
  propertyRails,
  vehicleRails,
  electronicsRecent,
  mixedLatest,
  latestOnYikeError = false,
  verifiedDealers = [],
  showingSampleListingsFixture = false,
  showingDemoFixtures = false,
}: Props) {
  const primary =
    category === "vehicle"
      ? vehicleRails
      : category === "electronics"
        ? {
            featuredItems: electronicsRecent,
            trendingItems: electronicsRecent,
            recentItems: electronicsRecent,
            luxuryItems: electronicsRecent,
            nationwideItems: electronicsRecent,
          }
        : propertyRails;

  return (
    <div
      className="hidden min-h-screen bg-[#f8fafc] pb-16 text-navy lg:block"
      data-testid="home-desktop-view"
    >
      <HeaderDesktop />

      <HomeDesktopHero
        category={category}
        onCategoryChange={onCategoryChange}
        browseInitial={browseInitial}
        onPropertySearch={onPropertySearch}
        onVehicleSearch={onVehicleSearch}
        onElectronicsSearch={onElectronicsSearch}
        className="!px-8 !pt-4 xl:!px-8"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-8 pt-4">
        {latestOnYikeError ? (
          <section className="space-y-4">
            <h2 className="border-l-4 border-gold pl-3 text-xl font-black tracking-tight text-navy">
              Latest on Yike
            </h2>
            <p className="rounded-2xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">
              Latest listings are unavailable right now. Try again in a moment.
            </p>
          </section>
        ) : mixedLatest.length > 0 ? (
          <div data-testid="home-desktop-latest-on-yike">
            {renderDesktopSection("Latest on Yike", "/discover", mixedLatest)}
          </div>
        ) : null}
        {renderDesktopSection("Featured", primary === propertyRails ? "/search?featured=1" : category === "vehicle" ? "/vehicles?featured=1" : "/electronics", primary.featuredItems)}
        {renderDesktopSection("Trending", category === "vehicle" ? "/vehicles" : category === "electronics" ? "/electronics" : "/search", primary.trendingItems)}
        {renderDesktopSection("Recently Added", category === "vehicle" ? "/vehicles" : category === "electronics" ? "/electronics" : "/search", primary.recentItems)}
        <VerifiedDealersHomeSection
          liveDealers={verifiedDealers}
          showingSampleListingsFixture={showingSampleListingsFixture}
          showingDemoFixtures={showingDemoFixtures}
          variant="desktop"
          className="pt-2"
        />
        {propertyRails.featuredItems.length > 0 && category !== "property"
          ? renderDesktopSection("Properties", "/search", propertyRails.featuredItems)
          : null}
        {vehicleRails.featuredItems.length > 0 && category !== "vehicle"
          ? renderDesktopSection("Vehicles", "/vehicles", vehicleRails.featuredItems)
          : null}
        {electronicsRecent.length > 0 && category !== "electronics"
          ? renderDesktopSection("Electronics", "/electronics", electronicsRecent)
          : null}
        {renderDesktopSection(
          "Premium Picks",
          category === "vehicle" ? "/vehicles?featured=1" : category === "electronics" ? "/electronics" : "/search?premium=1",
          primary.luxuryItems,
        )}
        {renderDesktopSection(
          "All Listings",
          category === "vehicle" ? "/vehicles" : category === "electronics" ? "/electronics" : "/search",
          primary.nationwideItems,
        )}
      </div>
    </div>
  );
}
