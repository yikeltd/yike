import { Suspense } from "react";
import { SearchPanel } from "@/components/search/search-panel";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PopularCities } from "@/components/home/popular-cities";
import { HomeBlogPreviews } from "@/components/home/home-blog-previews";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { NeighborhoodChips } from "@/components/pages/neighborhood-chips";
import { BudgetShowcase } from "@/components/pages/budget-showcase";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: `Explore Homes in Nigeria | ${SITE_NAME}`,
  description:
    "Trending cities, verified listings, affordable homes and rental guides — browse Nigerian housing the visual way.",
};

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function ExplorePage() {
  const stats = await getMarketplaceStats();

  return (
    <div className="pb-12">
      <PageHero
        title="Explore Nigeria, one home at a time"
        subtitle="Trending cities, verified agents, affordable flats and premium shortlets — scroll visually, contact on WhatsApp."
        image={PAGE_IMAGERY.explore}
        badge="Explore"
        variant="dark"
        cta={{ label: "Search homes", href: "/search" }}
        secondaryCta={{ label: "Swipe feed", href: "/browse" }}
      />

      <div className="mx-auto max-w-7xl px-3 pt-6 lg:px-8">
        <SocialProofBar stats={stats} />
        <div className="mt-6 hidden lg:block">
          <SearchPanel variant="hero" />
        </div>
      </div>

      <Suspense fallback={null}>
        <PopularCities />
      </Suspense>

      <NeighborhoodChips />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Featured homes"
          subtitle="Hand-picked across Nigeria"
          seeAllHref="/search?featured=1"
          params={{ featured: true }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Latest verified listings"
          subtitle="Identity-checked agents"
          seeAllHref="/search?verified=1"
          params={{ verified_only: true }}
          limit={10}
        />
      </Suspense>

      <BudgetShowcase />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Premium homes"
          subtitle="Duplexes, terraces and executive flats"
          seeAllHref="/search?type=rent&min_price=3000000"
          params={{ listing_type: "rent", min_price: 3_000_000 }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Student housing"
          subtitle="Near campus · budget-friendly"
          seeAllHref="/search?hub=student"
          hub="student"
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Shortlets"
          subtitle="Nightly stays for travel & business"
          seeAllHref="/shortlet"
          params={{ listing_type: "shortlet" }}
          limit={8}
        />
      </Suspense>

      <HomeBlogPreviews />

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-10">
          <SafetyNotice />
        </section>
        <TrustPillars />
      </div>

      <CtaBanner
        title="List on Yike — reach serious renters"
        body="Free listings for agents and landlords. Verified agents rank higher and convert faster."
        primary={{ label: "List property free", href: "/post-property" }}
        secondary={{ label: "Get verified", href: "/verify-agent" }}
      />
    </div>
  );
}
