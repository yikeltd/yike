import Link from "next/link";
import { VerticalBrowse } from "@/components/browse/vertical-browse";
import { PropertyGrid } from "@/components/property/property-grid";
import { PageHero } from "@/components/pages/page-hero";
import { CtaBanner } from "@/components/pages/cta-banner";
import { getPublicProperties } from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Swipe Homes | ${SITE_NAME}`,
  description:
    "Full-screen, TikTok-style home browsing. Swipe through rentals and shortlets across Nigeria.",
};

export default async function BrowsePage() {
  const rows = await getPublicProperties({}, 40);
  const { items, isDemo } = withDemoFallback(rows);

  return (
    <>
      <div className="lg:hidden">
        <VerticalBrowse properties={items} />
      </div>
      <div className="hidden lg:block">
        <PageHero
          title="Swipe homes"
          subtitle="Built for your phone — full-screen imagery, minimal text, WhatsApp in one tap. Open on mobile for the immersive feed."
          image={PAGE_IMAGERY.swipe}
          badge="Swipe"
          variant="dark"
          cta={{ label: "Open on mobile", href: "/browse" }}
          secondaryCta={{ label: "Search instead", href: "/search" }}
        />
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl bg-gold/10 p-6">
            <p className="font-bold text-navy">Tip for desktop users</p>
            <p className="mt-2 text-sm text-muted">
              Install Yike as a PWA on your phone for the best swipe experience —
              or browse the grid below.
            </p>
          </div>
          <div className="mt-10">
            <PropertyGrid properties={items} isDemo={isDemo} showCount />
          </div>
          <p className="mt-8 text-center">
            <Link href="/explore" className="text-sm font-bold text-gold-dark">
              ← Back to Explore
            </Link>
          </p>
        </div>
        <CtaBanner
          title="Addictive browsing starts on mobile"
          body="Save listings, WhatsApp agents instantly, and scroll through hundreds of homes."
          primary={{ label: "Explore all homes", href: "/explore" }}
        />
      </div>
    </>
  );
}
