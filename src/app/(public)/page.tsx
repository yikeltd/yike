import { Suspense } from "react";
import { SearchPanel } from "@/components/search/search-panel";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PopularCities } from "@/components/home/popular-cities";
import { DiscoverHubs } from "@/components/home/discover-hubs";
import {
  HomeFeaturedSection,
  HomeVerifiedSection,
  HomeRecentSection,
  HomeMobileFeed,
  PopularAreasSection,
} from "@/components/home/home-sections";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

function SectionFallback() {
  return (
    <div className="px-3 py-4 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="pb-2 lg:pb-0">
      {/* Desktop: hero search */}
      <section className="full-bleed hidden bg-gradient-to-br from-navy via-navy-mid to-navy-dark lg:block">
        <div className="mx-auto max-w-7xl px-6 py-16 xl:px-8 xl:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
              Find real homes in Nigeria without agent drama.
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Browse verified rentals, shortlets and properties from trusted
              agents.
            </p>
          </div>
          <div className="mt-10">
            <SearchPanel variant="hero" />
          </div>
        </div>
      </section>

      {/* Mobile: search then immediate feed */}
      <section className="px-3 pt-3 lg:hidden">
        <h1 className="text-lg font-bold text-navy">Homes for you</h1>
        <p className="text-xs text-muted">Verified listings · WhatsApp contact</p>
        <SearchPanel variant="compact" className="mt-3" />
      </section>

      <Suspense fallback={<SectionFallback />}>
        <HomeMobileFeed />
      </Suspense>

      <DiscoverHubs />

      <Suspense fallback={null}>
        <PopularCities />
      </Suspense>

      {/* Desktop sections */}
      <div className="hidden lg:block">
        <Suspense fallback={<SectionFallback />}>
          <HomeFeaturedSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <HomeVerifiedSection />
        </Suspense>
        <PopularAreasSection />
        <Suspense fallback={<SectionFallback />}>
          <HomeRecentSection />
        </Suspense>
      </div>

      {/* Mobile: verified after trending cities */}
      <div className="lg:hidden">
        <Suspense fallback={<SectionFallback />}>
          <HomeVerifiedSection />
        </Suspense>
        <PopularAreasSection />
      </div>

      <section className="mx-3 mb-4 mt-6 lg:mx-0 lg:mb-8 lg:mt-12">
        <SafetyNotice />
      </section>
    </div>
  );
}
