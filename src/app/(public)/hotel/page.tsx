import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { SearchPanel } from "@/components/search/search-panel";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { HOTEL_FAQS } from "@/constants/pageContent";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import { ExploreHubLinks } from "@/components/pages/explore-hub-links";

export const metadata = {
  title: `Hotels & Guest Houses in Nigeria | ${SITE_NAME}`,
  description:
    "Hotel apartments and guest houses in Lagos, Abuja, PH and more — compare photos, contact on WhatsApp, no booking drama.",
};

const BUSINESS_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Enugu", "Owerri", "Uyo"];

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function HotelPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Hotels & guest houses"
        subtitle="Serviced apartments and guest houses for business trips, events and short stays — real photos, WhatsApp contact, no middleman fees."
        image={PAGE_IMAGERY.hotel}
        badge="Hotel"
        variant="travel"
        cta={{ label: "Browse hotels", href: "/search?property_type=hotel" }}
        secondaryCta={{ label: "Request a stay", href: "/request-property" }}
      />

      <div className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <ExploreHubLinks active="/hotel" className="mb-6" />
        <SearchPanel variant="compact" defaultListingType="hotel" />
      </div>

      <section className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Business travel",
              body: "WiFi, AC, generator and quiet rooms near VI, Wuse and GRA corridors.",
            },
            {
              title: "Events & weekends",
              body: "Guest houses for weddings, conferences and city breaks — confirm rates on WhatsApp.",
            },
            {
              title: "No platform fees",
              body: "Yike connects you to hosts. Payment and check-in are between you and the property.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
            >
              <p className="text-sm font-bold text-navy">{card.title}</p>
              <p className="mt-2 text-sm text-muted">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Hotel apartments"
          subtitle="Serviced stays with hotel-style amenities"
          seeAllHref="/search?property_type=hotel"
          params={{ property_type: "hotel" }}
          limit={10}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Verified hosts"
          subtitle="Identity-checked listers"
          seeAllHref="/search?property_type=hotel&verified=1"
          params={{ property_type: "hotel", verified_only: true }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Also try shortlets"
          subtitle="Furnished nightly stays nearby"
          seeAllHref="/shortlet"
          params={{ listing_type: "shortlet" }}
          limit={8}
        />
      </Suspense>

      <section className="mt-10 px-3 lg:px-8">
        <h2 className="text-xl font-bold text-navy">Hotels by city</h2>
        <p className="mt-1 text-sm text-muted">
          Tap a city — then filter by budget on search.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BUSINESS_CITIES.map((city) => (
            <Link
              key={city}
              href={`/search?property_type=hotel&city=${encodeURIComponent(city)}`}
              className="pressable rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-float hover:bg-gold/10"
            >
              {city}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING_CITIES.slice(6, 10).map((c) => (
            <Link
              key={c.slug}
              href={`/search?property_type=hotel&city=${encodeURIComponent(c.searchCity)}`}
              className="pressable rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-10 rounded-2xl bg-gold/10 p-6 lg:p-8">
          <h2 className="text-lg font-bold text-navy">Before you book</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>• Confirm nightly rate, caution deposit and ID policy on WhatsApp.</li>
            <li>• Ask for the exact address and recent room photos.</li>
            <li>• Avoid paying before you have confirmed availability in writing.</li>
            <li>• Look for Verified badges when you want identity-checked hosts.</li>
          </ul>
        </section>
      </div>

      <FaqSection title="Hotel FAQs" faqs={HOTEL_FAQS} />

      <CtaBanner
        title="List your guest house or hotel apartment"
        body="Reach travellers and business guests across Nigeria. Free to list — real prices only."
        primary={{ label: "List property", href: "/post-property" }}
        secondary={{ label: "Browse shortlets", href: "/shortlet" }}
        variant="gold"
      />
    </div>
  );
}
