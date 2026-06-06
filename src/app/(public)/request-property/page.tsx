import { SITE_NAME } from "@/lib/constants";
import { PropertyRequestForm } from "@/components/property/property-request-form";
import { SafetyNotice } from "@/components/property/safety-notice";
import { PageHero } from "@/components/pages/page-hero";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { ExploreHubLinks } from "@/components/pages/explore-hub-links";
import { CtaBanner } from "@/components/pages/cta-banner";

export const metadata = {
  title: `Request a Property | ${SITE_NAME}`,
  description: `Tell ${SITE_NAME} what you need — city, budget and property type. Verified agents reach you on WhatsApp when there is a match.`,
};

export default function RequestPropertyPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Tell us what you need"
        subtitle="No endless scrolling — share your city, budget and property type. Agents contact you on WhatsApp when something fits."
        image={PAGE_IMAGERY.rent}
        badge="Request"
        variant="default"
        cta={{ label: "Fill the form below", href: "#request-form" }}
        secondaryCta={{ label: "Search listings", href: "/search" }}
      />

      <div className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <ExploreHubLinks active="/request-property" className="mb-8" />
      </div>

      <div
        id="request-form"
        className="mx-auto grid max-w-5xl gap-10 px-3 lg:grid-cols-[1fr_280px] lg:px-8"
      >
        <div>
          <PropertyRequestForm />
        </div>
        <aside className="space-y-6 lg:pt-2">
          <div className="rounded-2xl bg-gold/10 p-5">
            <p className="text-sm font-bold text-navy">How matching works</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>1. You submit city, budget and property type.</li>
              <li>2. Verified agents in that area may reach you on WhatsApp.</li>
              <li>3. Always inspect before payment — Yike never holds rent.</li>
            </ul>
          </div>
          <SafetyNotice compact />
        </aside>
      </div>

      <CtaBanner
        title="Prefer to browse yourself?"
        body="Search by city, filter by budget, and contact agents directly."
        primary={{ label: "Open search", href: "/search" }}
        secondary={{ label: "Explore feed", href: "/explore" }}
      />
    </div>
  );
}
