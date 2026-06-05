import { Suspense } from "react";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PopularCities } from "@/components/home/popular-cities";
import { DiscoverHubs } from "@/components/home/discover-hubs";
import { AdSlot } from "@/components/ads/ad-slot";
import { HomeSearchHero } from "@/components/home/home-search-hero";
import { HomeHotspotRow } from "@/components/home/home-hotspot-row";
import {
  HomeFeaturedSection,
  HomeVerifiedSection,
  HomeRecentSection,
  HomeTrendingSection,
  HomeFilteredFeed,
  PopularAreasSection,
} from "@/components/home/home-sections";
import { HomeBlogPreviews } from "@/components/home/home-blog-previews";
import { BrowseRail } from "@/components/retention/browse-rail";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { parseSearchParams } from "@/lib/properties";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

function SectionFallback() {
  return (
    <div className="px-3 py-4 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const stats = await getMarketplaceStats();
  const filters = parseSearchParams(await searchParams);
  const initial = {
    listingType: filters.listing_type,
    hub: filters.hub,
    city: filters.city,
    area: filters.area,
    min: filters.min_price ? String(filters.min_price) : undefined,
    max: filters.max_price ? String(filters.max_price) : undefined,
  };

  return (
    <div className="home-canvas pb-2 lg:pb-0">
      <section className="full-bleed relative overflow-hidden border-b border-gold/15 bg-gradient-to-br from-navy via-navy-mid to-navy-dark">
        <div className="mesh-hero absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-7xl">
          <Suspense fallback={null}>
            <HomeSearchHero initial={initial} />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <HomeHotspotRow onHero />
          </Suspense>
        </div>
      </section>

      <div className="mt-3 px-3 lg:mt-4 lg:px-0">
        <SocialProofBar stats={stats} />
      </div>

      <Suspense fallback={<SectionFallback />}>
        <HomeFilteredFeed filters={filters} />
      </Suspense>

      <BrowseRail />

      <div className="section-band mt-6 lg:mt-10">
        <Suspense fallback={<SectionFallback />}>
          <HomeFeaturedSection />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <PopularCities />
      </Suspense>

      <div className="section-band">
        <Suspense fallback={<SectionFallback />}>
          <HomeVerifiedSection />
        </Suspense>
      </div>

      <PopularAreasSection />

      <section className="mx-3 mb-4 mt-6 lg:mx-0 lg:mb-8 lg:mt-12">
        <SafetyNotice />
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HomeTrendingSection />
      </Suspense>

      <div className="section-band">
        <Suspense fallback={<SectionFallback />}>
          <HomeRecentSection />
        </Suspense>
      </div>

      <HomeBlogPreviews />

      <DiscoverHubs />

      <AdSlot placement="home_discover" className="mt-6 lg:mt-8" />
    </div>
  );
}
