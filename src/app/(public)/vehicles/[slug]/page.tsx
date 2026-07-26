import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleByIdOrSlug,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { StickyContactBar } from "@/components/property/sticky-contact-bar";
import { MarketplaceViewTracker } from "@/components/marketplace/view-tracker";
import { VehiclePremiumDetail } from "@/components/marketplace/vehicle-premium-detail";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { getActiveAd } from "@/lib/ads";
import { resolveListingBadges } from "@/lib/design/listing-badges";

type Props = { params: Promise<{ slug: string }> };

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isLaunchFeatureVisible("vehicle_marketplace")) {
    return { title: "Vehicle | Yike" };
  }
  const supabase = await createClient();
  const v = supabase ? await getVehicleByIdOrSlug(supabase, slug) : null;
  if (!v) return { title: "Vehicle | Yike" };
  return {
    title: `${v.title} | Yike Vehicles`,
    description: v.description?.slice(0, 160) || undefined,
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const vehicle = await getVehicleByIdOrSlug(supabase, slug);
  if (!vehicle || vehicle.status !== "approved") notFound();

  const [similarRaw, detailAd] = await Promise.all([
    queryPublicVehicles(supabase, {
      auto_category: vehicle.auto_category ?? undefined,
      make: vehicle.make ?? undefined,
      limit: 8,
    }),
    getActiveAd("vehicle_detail"),
  ]);

  const similar = similarRaw.filter((x) => x.id !== vehicle.id).slice(0, 4);

  const agent = vehicle.agent as
    | {
        id: string;
        full_name?: string | null;
        whatsapp?: string | null;
        phone?: string | null;
      }
    | undefined;

  const priceLabel = formatNaira(Number(vehicle.price));
  const shareUrl = listingAbsoluteUrl(vehicle);
  const featuredActive = isFeaturedActive(vehicle);
  const verified = !!vehicle.is_verified_listing;
  const allBadges = resolveListingBadges(vehicle, {
    agentVerified: verified,
    featuredActive,
  });
  const extraBadges = allBadges.filter(
    (b) => b !== "verified" && b !== "yike_verified" && b !== "featured",
  );
  const location = [vehicle.area, vehicle.city, vehicle.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="pb-8">
      <MarketplaceViewTracker
        id={vehicle.id}
        title={vehicle.title}
        image={vehicle.media_urls?.[0] ?? ""}
        city={vehicle.city}
        area={vehicle.area || vehicle.city}
        priceLabel={priceLabel}
        assetType="VEHICLE"
        slug={vehicle.slug}
      />

      <VehiclePremiumDetail
        vehicle={vehicle}
        similar={similar}
        priceLabel={priceLabel}
        shareUrl={shareUrl}
        location={location}
        verified={verified}
        featuredActive={featuredActive}
        extraBadges={extraBadges}
        detailAd={detailAd}
      />

      {agent ? (
        <div className="lg:hidden">
          <StickyContactBar
            propertyId={vehicle.id}
            title={vehicle.title}
            area={vehicle.area || vehicle.city}
            city={vehicle.city}
            listingType={vehicle.listing_type || "sale"}
            propertyType={vehicle.auto_category}
            agentId={agent.id}
            agentName={agent.full_name || "Seller"}
            price={Number(vehicle.price)}
            paymentPeriod={vehicle.payment_period || "total"}
            phone={agent.phone}
            whatsapp={agent.whatsapp}
          />
        </div>
      ) : null}
    </main>
  );
}
