import { Suspense } from "react";
import Link from "next/link";
import { SearchPanel } from "@/components/search/search-panel";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { NeighborhoodChips } from "@/components/pages/neighborhood-chips";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { RENT_FAQS } from "@/constants/pageContent";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: `Rent a Home in Nigeria | ${SITE_NAME}`,
  description:
    "Find verified rentals — self contains, flats and family homes. Compare prices and contact agents on WhatsApp.",
};

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function RentPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Find your next rental"
        subtitle="Self contains, mini flats and family apartments — real prices, verified agents, WhatsApp contact."
        image={PAGE_IMAGERY.rent}
        badge="Rent"
        variant="default"
        cta={{ label: "Search rentals", href: "/search?type=rent" }}
        secondaryCta={{ label: "Request a home", href: "/request-property" }}
      />

      <div className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <SearchPanel variant="compact" defaultListingType="rent" />
      </div>

      <section className="mt-8 px-3 lg:px-8">
        <h2 className="text-lg font-bold text-navy lg:text-xl">Browse by city</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING_CITIES.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              href={`/search?type=rent&city=${encodeURIComponent(c.searchCity)}`}
              className="pressable rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-float hover:bg-gold/10"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <NeighborhoodChips title="Popular rental areas" />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Verified rentals"
          subtitle="Identity-checked agents only"
          seeAllHref="/search?type=rent&verified=1"
          params={{ listing_type: "rent", verified_only: true }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Recently listed"
          subtitle="Fresh on Yike this week"
          seeAllHref="/search?type=rent"
          params={{ listing_type: "rent" }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Student rentals"
          subtitle="Near campus gates nationwide"
          seeAllHref="/search?hub=student"
          hub="student"
          params={{ listing_type: "rent" }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Family apartments"
          subtitle="2–4 bedroom flats & bungalows"
          seeAllHref="/search?type=rent&bedrooms=2"
          params={{ listing_type: "rent", bedrooms: 2 }}
          limit={8}
        />
      </Suspense>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-8 rounded-2xl bg-gold/10 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-navy">Rent guidance</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Confirm agency fee, caution deposit and agreement fee before transfer.</li>
            <li>• Inspect water, prepaid meter, security and road access in person.</li>
            <li>• Avoid paying inspection fees to agents you haven&apos;t met at the property.</li>
            <li>• Use Verified filters when you want identity-checked agents.</li>
          </ul>
          <Link href="/blog" className="mt-4 inline-block text-sm font-bold text-gold-dark">
            Read rental guides →
          </Link>
        </section>
        <section className="mt-8">
          <SafetyNotice compact />
        </section>
      </div>

      <FaqSection title="Rental FAQs" faqs={RENT_FAQS} />

      <CtaBanner
        title="Can't find what you need?"
        body="Tell us your budget and area — we'll match you with agents when listings fit."
        primary={{ label: "Request a home", href: "/request-property" }}
        secondary={{ label: "Safety tips", href: "/safety" }}
        variant="gold"
      />
    </div>
  );
}
