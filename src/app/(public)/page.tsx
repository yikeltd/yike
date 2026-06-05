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
  HomeMobileFeed,
  PopularAreasSection,
} from "@/components/home/home-sections";
import { HomeBlogPreviews } from "@/components/home/home-blog-previews";
import { BrowseRail } from "@/components/retention/browse-rail";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

function SectionFallback() {
  return (
    <div className="px-3 py-4 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function HomePage() {
  const stats = await getMarketplaceStats();

  return (
    <div className="home-canvas pb-2 lg:pb-0">
      {/* Desktop hero */}
      <section className="full-bleed relative hidden overflow-hidden lg:block">
        <div className="mesh-hero absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-16 xl:px-8 xl:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold-light">
              Nigeria&apos;s visual housing marketplace
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Find real homes without agent drama.
            </h1>
            <p className="mt-4 text-lg text-white/75">
              Browse verified rentals, shortlets and sales — contact agents on
              WhatsApp.
            </p>
          </div>
          <div className="mt-10">
            <HomeSearchHero variant="desktop" />
          </div>
        </div>
      </section>

      {/* Mobile search strip — functional, self-contained */}
      <section className="lg:hidden">
        <HomeSearchHero variant="mobile" />
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HomeHotspotRow />
      </Suspense>

      <div className="mt-4 px-3 lg:mt-6 lg:px-0">
        <SocialProofBar stats={stats} />
      </div>

      <Suspense fallback={<SectionFallback />}>
        <HomeMobileFeed />
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
