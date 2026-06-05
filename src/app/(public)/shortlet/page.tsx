import { Suspense } from "react";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SHORTLET_FAQS } from "@/constants/pageContent";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export const metadata = {
  title: `Shortlets in Nigeria | ${SITE_NAME}`,
  description:
    "Serviced apartments and nightly stays in Lagos, Abuja, PH and more — perfect for business trips and vacations.",
};

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function ShortletPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Shortlets that feel like home"
        subtitle="Luxury serviced apartments, business travel stays and weekend getaways — book via WhatsApp with verified hosts."
        image={PAGE_IMAGERY.shortlet}
        badge="Shortlet"
        variant="travel"
        cta={{ label: "Browse shortlets", href: "/search?type=shortlet" }}
        secondaryCta={{ label: "List your shortlet", href: "/post-property" }}
      />

      <section className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-violet-950/5 p-5 ring-1 ring-violet-500/10">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-800">
              Business trips
            </p>
            <p className="mt-2 text-sm text-muted">
              WiFi, AC, generator and concierge-style service in VI, Ikoyi, Wuse
              and PH GRA — ideal for executives.
            </p>
          </div>
          <div className="rounded-2xl bg-amber-950/5 p-5 ring-1 ring-amber-500/10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900">
              Vacations
            </p>
            <p className="mt-2 text-sm text-muted">
              Weekend stays in Calabar, Uyo, Owerri and Lekki — furnished,
              Instagram-ready interiors.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Luxury shortlets"
          subtitle="Premium nightly rates · full service"
          seeAllHref="/search?type=shortlet&min_price=50000"
          params={{ listing_type: "shortlet", min_price: 50_000 }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Affordable shortlets"
          subtitle="Budget-friendly nightly stays"
          seeAllHref="/search?type=shortlet&max_price=35000"
          params={{ listing_type: "shortlet", max_price: 35_000 }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Weekend stay picks"
          subtitle="Great for quick getaways"
          seeAllHref="/search?type=shortlet"
          params={{ listing_type: "shortlet" }}
          limit={10}
        />
      </Suspense>

      <section className="mt-10 px-3 lg:px-8">
        <h2 className="text-xl font-bold text-navy">Shortlets by city</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRENDING_CITIES.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              href={`/search?type=shortlet&city=${encodeURIComponent(c.searchCity)}`}
              className="pressable rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-float"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-10 rounded-2xl bg-gold/10 p-6">
          <p className="text-sm font-bold text-navy">Verified host messaging</p>
          <p className="mt-2 text-sm text-muted">
            Look for Verified badges on shortlet hosts. Confirm address, nightly
            rate, caution and ID policy on WhatsApp before payment. Yike does not
            process bookings or hold deposits.
          </p>
        </section>
      </div>

      <FaqSection title="Shortlet FAQs" faqs={SHORTLET_FAQS} />

      <CtaBanner
        title="Host your shortlet on Yike"
        body="Reach business travellers and vacationers across Nigeria. List in minutes — free to start."
        primary={{ label: "List a shortlet", href: "/post-property" }}
        secondary={{ label: "Get verified", href: "/verify-agent" }}
        variant="gold"
      />
    </div>
  );
}
