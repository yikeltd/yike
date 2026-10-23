"use client";

import Image from "next/image";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HomeVehicleSearch } from "@/components/home/home-vehicle-search";
import { HomeDesktopElectronicsSearch } from "@/components/home/home-desktop-electronics-search";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";

const MOBILE_HERO_IMAGE = "/images/hero/yike-city-hero.webp";

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
  className?: string;
};

/** Mobile homepage search hero — category tabs + filters, no oversized category cards. */
export function HomeCompactMarketplaceHero({
  category,
  onCategoryChange,
  browseInitial,
  onPropertySearch,
  onVehicleSearch,
  onElectronicsSearch,
  className,
}: Props) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const electronicsOn = isLaunchFeatureVisible("electronics_marketplace");
  const showToggle = vehiclesOn || electronicsOn;

  const panelKey =
    category === "vehicle"
      ? "vehicle"
      : category === "electronics"
        ? "electronics"
        : "property";

  return (
    <section
      id="home-search"
      className={cn(
        "home-hero-mobile full-bleed relative overflow-hidden px-3 pb-3 pt-2",
        className,
      )}
      aria-label="Marketplace search"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-navy" />
        <Image
          src={MOBILE_HERO_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          className="object-cover object-[center_32%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#021433]/94 via-[#031B4E]/78 to-[#031B4E]/92" />
      </div>

      <div className="relative z-[2] mx-auto max-w-7xl space-y-2.5">
        {showToggle ? (
          <MarketplaceCategoryToggle
            category={category}
            onChange={onCategoryChange}
            tone="onDark"
            compact
            className="max-w-full"
          />
        ) : null}

        <div key={panelKey} className="animate-fade-up">
          {category === "vehicle" && vehiclesOn ? (
            <HomeVehicleSearch onSearch={onVehicleSearch} compact />
          ) : category === "electronics" && electronicsOn ? (
            <HomeDesktopElectronicsSearch
              onSearch={onElectronicsSearch}
              compact
              initial={{
                state: browseInitial.state,
                city: browseInitial.city,
                budgetValue: browseInitial.budgetValue,
              }}
            />
          ) : (
            <BrowseListingsBlock
              key={
                browseInitial.dealKey +
                browseInitial.city +
                browseInitial.area +
                browseInitial.propertyType +
                browseInitial.budgetValue
              }
              variant="home-premium"
              initial={browseInitial}
              hideTitle
              onSearch={onPropertySearch}
            />
          )}
        </div>
      </div>
    </section>
  );
}
