"use client";

import Image from "next/image";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import type { Initial } from "@/lib/home-search-params";

const MOBILE_HERO_IMAGE = "/images/hero/yike-city-hero.webp";

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

/** Mobile browser + installed PWA/TWA — city skyline hero with premium search panel. */
export function HomeMobileHero({ browseInitial, onSearch }: HomeMobileHeroProps) {
  return (
    <div
      id="home-search"
      className="home-hero-mobile full-bleed relative overflow-hidden px-3 pb-6 pt-3"
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#021433]/65 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(228,181,71,0.12),transparent_60%)]" />
      </div>

      <div className="relative z-[2] mx-auto max-w-7xl">
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
