import Link from "next/link";
import { HorizontalBrowse } from "@/components/browse/horizontal-browse";
import { PropertyFeed } from "@/components/property/property-feed";
import { PageHero } from "@/components/pages/page-hero";
import { CtaBanner } from "@/components/pages/cta-banner";
import { getPublicProperties } from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SITE_NAME } from "@/lib/constants";
import { ExploreHubLinks } from "@/components/pages/explore-hub-links";

export const metadata = {
  title: `Swipe Homes | ${SITE_NAME}`,
  description:
    "Full-screen, TikTok-style home browsing. Swipe through rentals and shortlets across Nigeria.",
};

export default async function BrowsePage() {
  const rows = await getPublicProperties({}, 48);
  const { items, isDemo } = withDemoFallback(rows);

  return (
    <>
      <div className="lg:hidden">
        <HorizontalBrowse properties={items} />
      </div>
      <div className="hidden lg:block">
        <PageHero
          title="Swipe homes"
          subtitle="Full-screen photos, one-tap WhatsApp contact, and zero clutter — built for mobile-first browsing."
          image={PAGE_IMAGERY.swipe}
          badge="Swipe"
          variant="dark"
          cta={{ label: "Open on mobile", href: "/browse" }}
          secondaryCta={{ label: "Search instead", href: "/?focus=search" }}
        />
        <div className="mx-auto max-w-7xl px-6 py-12">
          <ExploreHubLinks active="/browse" className="mb-8" />
          <div className="rounded-2xl bg-gold/10 p-6">
            <p className="font-bold text-navy">
              Verified homes. Faster discovery. Direct WhatsApp access.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Browse rentals, land, shops and homes across Nigeria with a
              smoother, more trusted experience.
            </p>
          </div>
          <div className="mt-10">
            <PropertyFeed
              properties={items}
              isDemo={isDemo}
              emptyMessage="No swipe picks in this view yet — try another city or list your property."
            />
          </div>
          <p className="mt-8 text-center">
            <Link href="/explore" className="text-sm font-bold text-gold-dark">
              ← Back to Explore
            </Link>
          </p>
        </div>
        <CtaBanner
          title="Browse homes across Nigeria"
          body="Rentals, land and verified agents — contact on WhatsApp when you find a match."
          primary={{ label: "Explore all homes", href: "/explore" }}
        />
      </div>
    </>
  );
}
