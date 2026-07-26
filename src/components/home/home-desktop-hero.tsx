"use client";

import Image from "next/image";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HomeDesktopVehicleSearch } from "@/components/home/home-desktop-vehicle-search";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";

/**
 * Production panoramic hero — UI designed around the image.
 * Source master: 2171×724. Display uses natural aspect (no stretch / no crop).
 */
const DESKTOP_HERO_IMAGE = "/images/hero.webp";
const HERO_WIDTH = 2171;
const HERO_HEIGHT = 724;

type HomeDesktopHeroProps = {
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
  className?: string;
};

export function HomeDesktopHero({
  category,
  onCategoryChange,
  browseInitial,
  onPropertySearch,
  onVehicleSearch,
  className,
}: HomeDesktopHeroProps) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const isVehicle = vehiclesOn && category === "vehicle";

  return (
    <section
      className={cn(
        "full-bleed hidden px-6 pb-3 pt-3 lg:block xl:px-8",
        className,
      )}
      aria-label="Desktop marketplace hero"
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="home-desktop-hero-panel relative w-full overflow-hidden rounded-[1.5rem] shadow-[0_20px_56px_-24px_rgba(2,20,51,0.4)]"
          style={{ aspectRatio: `${HERO_WIDTH} / ${HERO_HEIGHT}` }}
        >
          <div className="absolute inset-0" aria-hidden>
            <div className="absolute inset-0 bg-[#1a140c]" />
            <Image
              src={DESKTOP_HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-contain object-center"
              sizes="(min-width: 1280px) 1280px, (min-width: 1024px) calc(100vw - 3rem), 100vw"
            />
            {/* Light bottom wash only under the control strip */}
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#1a1208]/75 via-[#1a1208]/25 to-transparent" />
          </div>

          {/*
            Pin controls to the bottom edge so SUV / truck stay visible above.
          */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-2.5 pt-0 xl:px-8 xl:pb-3">
            <div id="home-desktop-search" className="space-y-2">
              {vehiclesOn ? (
                <div className="w-full max-w-[22rem]">
                  <MarketplaceCategoryToggle
                    category={category}
                    onChange={onCategoryChange}
                    tone="onDark"
                    compact
                  />
                </div>
              ) : null}

              <div
                key={isVehicle ? "vehicle-panel" : "property-panel"}
                className="animate-fade-up"
              >
                {isVehicle ? (
                  <HomeDesktopVehicleSearch
                    key={`vehicle-${browseInitial.state}-${browseInitial.city}`}
                    initial={{
                      state: browseInitial.state,
                      city: browseInitial.city,
                      budgetValue: browseInitial.budgetValue,
                    }}
                    onSearch={onVehicleSearch}
                  />
                ) : (
                  <BrowseListingsBlock
                    key={
                      "desktop-" +
                      browseInitial.dealKey +
                      browseInitial.city +
                      browseInitial.area +
                      browseInitial.propertyType +
                      browseInitial.budgetValue
                    }
                    variant="home-desktop-panel"
                    initial={browseInitial}
                    searchButtonLabel="Search Properties"
                    onSearch={onPropertySearch}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
