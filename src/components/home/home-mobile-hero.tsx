"use client";

import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import type { Initial } from "@/lib/home-search-params";

type HomeMobileHeroProps = {
  browseInitial: {
    dealKey: string;
    state: string;
    city: string;
    area: string;
    propertyType: string;
    budgetValue: string;
  };
  onSearch: (payload: BrowseSearchPayload) => void;
};

/** Mobile browser + installed PWA/TWA — unchanged premium navy hero. */
export function HomeMobileHero({ browseInitial, onSearch }: HomeMobileHeroProps) {
  return (
    <div
      id="home-search"
      className="home-hero-mobile full-bleed px-3 pb-6 pt-3 lg:px-6 lg:py-4 xl:px-8"
    >
      <div className="mx-auto max-w-7xl">
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
          title="Discover Homes Across Nigeria"
          onSearch={onSearch}
        />
      </div>
    </div>
  );
}

export type { Initial };
