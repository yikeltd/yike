import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { FaqSection } from "@/components/pages/faq-section";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { BUY_FAQS } from "@/constants/pageContent";
import { TRENDING_CITIES } from "@/constants/trendingCities";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: `Buy Property in Nigeria | ${SITE_NAME}`,
  description:
    "Duplexes, detached homes, luxury apartments and investment properties — browse with trust-first agents.",
};

const INVESTMENT_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Asaba"];

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function BuyPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Buy property with confidence"
        subtitle="Duplexes, bungalows and luxury apartments from verified agents — inspect first, verify title with your lawyer."
        image={PAGE_IMAGERY.buy}
        badge="Buy"
        variant="premium"
        cta={{ label: "Browse for sale", href: "/search?hub=buy" }}
        secondaryCta={{ label: "Buying guide", href: "/blog" }}
      />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Duplexes for sale"
          subtitle="Family homes with compound space"
          seeAllHref="/search?hub=buy&property_type=duplex"
          hub="buy"
          params={{ property_type: "duplex" }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Detached & bungalow sales"
          subtitle="Standalone family properties"
          seeAllHref="/search?hub=buy&property_type=bungalow"
          hub="buy"
          params={{ property_type: "bungalow" }}
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Luxury apartments"
          subtitle="High-rise and executive finishes"
          seeAllHref="/search?hub=buy"
          hub="buy"
          params={{ min_price: 50_000_000 }}
          limit={8}
        />
      </Suspense>

      <section className="mt-10 px-3 lg:px-8">
        <h2 className="text-xl font-bold text-navy">Popular investment cities</h2>
        <p className="mt-1 text-sm text-muted">
          Active markets — always verify title and documentation locally.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INVESTMENT_CITIES.map((city) => {
            const meta = TRENDING_CITIES.find((c) => c.searchCity === city);
            return (
              <Link
                key={city}
                href={`/search?hub=buy&city=${encodeURIComponent(city)}`}
                className="pressable rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
              >
                <p className="font-bold text-navy">{city}</p>
                <p className="mt-1 text-sm text-muted">
                  {meta?.tagline ?? "Browse sale listings"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-10 rounded-2xl border border-gold/20 bg-navy p-6 text-white lg:p-8">
          <h2 className="text-lg font-bold">Things to check before buying</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            <li>✓ Physical inspection — structure, drainage, neighbourhood</li>
            <li>✓ Title search with a qualified property lawyer</li>
            <li>✓ Survey plan coordinates match the actual plot</li>
            <li>✓ Seller identity matches documentation</li>
            <li>✓ Written sale agreement with clear payment milestones</li>
            <li>✓ No pressure to pay before verification</li>
          </ul>
          <p className="mt-4 text-xs text-white/60">
            Yike does not verify ownership documents. Verified badges reflect agent identity checks only.
          </p>
        </section>
        <TrustPillars title="Buy smart on Yike" />
      </div>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Featured agents' listings"
          subtitle="Verified and featured homes"
          seeAllHref="/search?hub=buy&verified=1"
          hub="buy"
          params={{ verified_only: true, featured: true }}
          limit={8}
        />
      </Suspense>

      <FaqSection title="Buying FAQs" faqs={BUY_FAQS} />

      <CtaBanner
        title="Selling a property?"
        body="List free on Yike. Verified agents get more visibility from serious buyers."
        primary={{ label: "List for sale", href: "/post-property" }}
        secondary={{ label: "Verify as agent", href: "/verify-agent" }}
      />
    </div>
  );
}
