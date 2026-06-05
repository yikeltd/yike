import { Suspense } from "react";
import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { PropertyRail } from "@/components/pages/property-rail";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { LAND_FAQS } from "@/constants/pageContent";
import { SITE_NAME } from "@/lib/constants";
import { PropertyGridSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: `Land for Sale in Nigeria | ${SITE_NAME}`,
  description:
    "Residential plots, commercial land and investment corridors — with title verification reminders and agent contact.",
};

const GROWTH_AREAS = [
  { label: "Ajah / Sangotedo", city: "Lagos", href: "/houses/lagos/ajah" },
  { label: "Lugbe / Kubwa", city: "Abuja", href: "/houses/abuja/lugbe" },
  { label: "Asaba outskirts", city: "Asaba", href: "/houses/asaba" },
  { label: "Enugu extensions", city: "Enugu", href: "/houses/enugu" },
  { label: "Uyo corridors", city: "Uyo", href: "/houses/uyo" },
  { label: "Abeokuta / Olomore", city: "Abeokuta", href: "/search?hub=land_sale&city=Abeokuta" },
];

function RailFallback() {
  return (
    <div className="px-3 py-4">
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export default function LandPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Land for sale & lease"
        subtitle="Residential plots, commercial corners and farm land — verify every title with your lawyer before payment."
        image={PAGE_IMAGERY.land}
        badge="Land"
        variant="land"
        cta={{ label: "Browse land listings", href: "/search?hub=land_sale" }}
        secondaryCta={{ label: "Land buying FAQ", href: "#land-faq" }}
      />

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Residential plots"
          subtitle="Estate and layout land for building"
          seeAllHref="/search?hub=land_sale"
          hub="land_sale"
          limit={8}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Commercial plots"
          subtitle="Road-front and corner pieces"
          seeAllHref="/search?hub=land_sale"
          hub="land_sale"
          params={{ property_type: "land_commercial" }}
          limit={6}
        />
      </Suspense>

      <Suspense fallback={<RailFallback />}>
        <PropertyRail
          title="Land for lease"
          subtitle="Farm and long-term commercial lease"
          seeAllHref="/search?hub=land_lease"
          hub="land_lease"
          limit={6}
        />
      </Suspense>

      <section className="mt-10 px-3 lg:px-8">
        <h2 className="text-xl font-bold text-navy">Areas developing fast</h2>
        <p className="mt-1 text-sm text-muted">
          Corridors with active plot sales — due diligence still required everywhere.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GROWTH_AREAS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="pressable rounded-2xl bg-white p-5 shadow-float"
            >
              <p className="font-bold text-navy">{a.label}</p>
              <p className="mt-1 text-sm text-muted">{a.city}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 lg:px-8">
        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/20">
          <h2 className="text-lg font-bold text-navy">Title verification reminder</h2>
          <p className="mt-2 text-sm text-muted">
            Yike does <strong>not</strong> verify C of O, deed of assignment, survey
            plans or governor&apos;s consent. Always engage a property lawyer, visit
            the plot physically, and confirm coordinates before any payment.
          </p>
        </section>
        <section className="mt-8">
          <SafetyNotice compact />
        </section>
      </div>

      <div id="land-faq">
        <FaqSection title="Land buying FAQ" faqs={LAND_FAQS} />
      </div>

      <CtaBanner
        title="Selling or leasing land?"
        body="List plots with clear pricing, survey status and location hints. Verified agents rank higher."
        primary={{ label: "List land", href: "/post-property" }}
        secondary={{ label: "Safety tips", href: "/safety" }}
      />
    </div>
  );
}
