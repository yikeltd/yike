import { Suspense } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { getAboutMarketPulse } from "@/lib/about-market-pulse";
import { getMarketplaceStats } from "@/lib/marketplace-stats";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { PageHero } from "@/components/pages/page-hero";
import { AboutMissionSection } from "@/components/pages/about-mission";
import { AboutMarketStats } from "@/components/pages/about-market-stats";
import { PropertyRail } from "@/components/pages/property-rail";
import { NeighborhoodChips } from "@/components/pages/neighborhood-chips";
import { PopularCities } from "@/components/home/popular-cities";
import { SocialProofBar } from "@/components/home/social-proof-bar";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { FollowYike } from "@/components/social/follow-yike";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import { BadgeCheck, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";

export const metadata = {
  title: `About ${SITE_NAME}`,
  description:
    "Making property discovery in Nigeria more trustworthy, visual and stress-free. Browse verified listings and contact agents on WhatsApp.",
};

const ABOUT_FEATURED_AREAS = POPULAR_AREAS.filter((area) =>
  ["Ogbor Hill", "Ariaria", "New Haven", "GRA", "Lekki", "Wuse"].some((name) =>
    area.area.includes(name)
  )
);

const ABOUT_TRUST = [
  {
    icon: BadgeCheck,
    title: "Verified agents",
    body: "Identity-checked agents rank higher. Look for the Verified badge before you pay anyone.",
  },
  {
    icon: RefreshCw,
    title: "Fresh listing focus",
    body: "We prioritise recent, clear photos and moderate suspicious posts so feeds stay useful.",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp",
    body: "Contact the listing agent in one tap. No middleman fees through Yike — inspect first.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-first discovery",
    body: "Report fake listings, read our safety tips, and always visit the property before payment.",
  },
];

function RailFallback() {
  return (
    <div className="px-3 py-4 lg:px-0">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default async function AboutPage() {
  const [pulse, stats] = await Promise.all([
    getAboutMarketPulse(),
    getMarketplaceStats(),
  ]);

  return (
    <div className="pb-12">
      <PageHero
        title="About Yike"
        subtitle="Making property discovery in Nigeria more trustworthy, visual and stress-free."
        image={PAGE_IMAGERY.about}
        badge="Marketplace"
        imageOpacity={0.28}
        cta={{ label: "Browse homes", href: "/search" }}
        secondaryCta={{ label: "Swipe feed", href: "/browse" }}
      />

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <AboutMissionSection />
        <AboutMarketStats pulse={pulse} />
        <div className="mt-6">
          <SocialProofBar stats={stats} />
        </div>
      </div>

      <Suspense fallback={null}>
        <PopularCities />
      </Suspense>

      <NeighborhoodChips
        title="Featured areas"
        subtitle="High-intent neighborhoods across Nigeria"
        areas={ABOUT_FEATURED_AREAS}
        limit={6}
      />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Featured properties"
          subtitle="Hand-picked across Nigeria"
          seeAllHref="/search?featured=1"
          params={{ featured: true }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Trending rentals"
          subtitle="Popular homes renters are viewing"
          seeAllHref="/search?type=rent"
          params={{ listing_type: "rent" }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Recently added"
          subtitle="Fresh listings on the marketplace"
          seeAllHref="/search"
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Verified agents"
          subtitle="Listings from identity-checked agents"
          seeAllHref="/search?verified=1"
          params={{ verified_only: true }}
          limit={10}
        />
      </Suspense>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <TrustPillars title="Built for trust" items={ABOUT_TRUST} />

        <section className="mt-10 rounded-2xl bg-gold/10 p-5 lg:p-6">
          <h2 className="font-bold text-navy">Safety commitment</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We moderate listings, verify agents, and publish scam prevention
            guides — but you must always inspect properties in person before
            payment. Read our{" "}
            <Link href="/safety" className="font-semibold text-gold-dark">
              safety tips
            </Link>{" "}
            and{" "}
            <Link href="/disclaimer" className="font-semibold text-gold-dark">
              disclaimer
            </Link>
            .
          </p>
        </section>

        <FollowYike className="mt-8" variant="icons" />
      </div>

      <CtaBanner
        title="Keep browsing"
        body="Rentals, land and verified agents across Nigeria — pick up where you left off."
        primary={{ label: "Search homes", href: "/search" }}
        secondary={{ label: "Explore cities", href: "/explore" }}
      />
    </div>
  );
}
