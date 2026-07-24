import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleByIdOrSlug,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { ContactButtons } from "@/components/property/contact-buttons";
import { StickyContactBar } from "@/components/property/sticky-contact-bar";
import { ReportListingForm } from "@/components/property/report-form";
import { MarketplaceViewTracker } from "@/components/marketplace/view-tracker";
import { MarketplaceSafetyNotice } from "@/components/marketplace/safety-notice";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { VehicleDetailHero } from "@/components/marketplace/vehicle-detail-hero";
import { VehicleSpecSections } from "@/components/marketplace/vehicle-spec-sections";
import { DetailPromotionZone } from "@/components/ads/detail-promotion-zone";
import { DetailRecentlyViewed } from "@/components/marketplace/detail-recently-viewed";
import { BROWSE_GRID_CLASS } from "@/lib/marketplace/browse-grid";
import { listingAbsoluteUrl } from "@/lib/marketplace/listing-path";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { getActiveAd } from "@/lib/ads";
import { resolveListingBadges } from "@/lib/design/listing-badges";
import { MapPin } from "lucide-react";

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

  const similar = similarRaw
    .filter((x) => x.id !== vehicle.id)
    .slice(0, 4);

  const agent = vehicle.agent as
    | {
        id: string;
        full_name?: string | null;
        whatsapp?: string | null;
        phone?: string | null;
        account_type?: string | null;
        company_name?: string | null;
      }
    | undefined;

  const priceLabel = formatNaira(Number(vehicle.price));
  const shareUrl = listingAbsoluteUrl(vehicle);
  const isDealer = agent?.account_type === "dealer";
  const featuredActive = isFeaturedActive(vehicle);
  const verified = !!vehicle.is_verified_listing;
  const allBadges = resolveListingBadges(vehicle, {
    agentVerified: verified,
    featuredActive,
  });
  const extraBadges = allBadges.filter(
    (b) => b !== "verified" && b !== "yike_verified" && b !== "featured"
  );
  const location = [vehicle.area, vehicle.city, vehicle.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="detail-band-ivory safe-bottom-detail mx-auto max-w-5xl pb-8">
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

      <div className="px-4 pt-4 lg:px-0 lg:pt-6">
        <p className="mb-3 text-sm text-muted">
          <Link href="/vehicles" className="font-medium hover:underline">
            Vehicles
          </Link>
          {" / "}
          {vehicleCategoryLabel(vehicle.auto_category)}
        </p>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-3">
            <VehicleDetailHero
              images={vehicle.media_urls ?? []}
              title={vehicle.title}
              listingId={vehicle.id}
              shareUrl={shareUrl}
              city={vehicle.city}
              autoCategory={vehicle.auto_category}
              badges={extraBadges}
              featured={featuredActive}
              verified={!!verified}
            />
          </div>

          <div className="detail-band-white space-y-4 rounded-[1.5rem] px-1 lg:col-span-2 lg:px-0 lg:pt-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {vehicleCategoryLabel(vehicle.auto_category)}
              </p>
              <p className="mt-1.5 text-[2.15rem] font-bold leading-none tracking-tight text-navy tabular-nums">
                {priceLabel}
              </p>
              <h1 className="mt-3 text-xl font-semibold leading-snug text-navy lg:text-2xl">
                {vehicle.title}
              </h1>
              {location ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {location}
                </p>
              ) : null}
            </div>

            {agent ? (
              <div className="rounded-[1.25rem] border border-[color:var(--border-premium)] bg-white p-4 shadow-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {isDealer ? "Dealer" : "Seller"}
                </p>
                <p className="mt-1 font-bold text-navy">
                  {agent.company_name || agent.full_name || "Yike seller"}
                </p>
                {isDealer ? (
                  <p className="mt-1 text-xs text-muted">
                    Dealer profile — verify paperwork before payment.
                  </p>
                ) : null}
                <Link
                  href={`/agents/${agent.id}`}
                  className="mt-2 inline-block text-sm font-semibold text-gold-dark underline-offset-2 hover:underline"
                >
                  View {isDealer ? "dealer" : "seller"} profile
                </Link>
              </div>
            ) : null}

            <div className="hidden lg:block">
              <ContactButtons
                propertyId={vehicle.id}
                title={vehicle.title}
                area={vehicle.area || vehicle.city}
                city={vehicle.city}
                listingType={vehicle.listing_type || "sale"}
                propertyType={vehicle.auto_category}
                agentId={vehicle.agent_id}
                agentName={agent?.full_name || "Seller"}
                price={Number(vehicle.price)}
                paymentPeriod={vehicle.payment_period || "total"}
                phone={agent?.phone}
                whatsapp={agent?.whatsapp}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6 px-4 lg:mt-10 lg:px-0">
        <section className="detail-band-white rounded-[1.5rem] p-4 shadow-card sm:p-6">
          <h2 className="mb-5 text-sm font-bold text-navy lg:text-base">
            Vehicle details
          </h2>
          <VehicleSpecSections vehicle={vehicle} />
        </section>

        {vehicle.description ? (
          <section className="detail-band-stone rounded-[1.5rem] p-4 sm:p-6">
            <h2 className="text-sm font-bold text-navy lg:text-base">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted lg:text-base">
              {vehicle.description}
            </p>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <MarketplaceSafetyNotice vertical="vehicle" />
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-navy/70 hover:text-navy">
              Report this listing
            </summary>
            <div className="mt-3 max-w-lg">
              <ReportListingForm propertyId={vehicle.id} />
            </div>
          </details>
        </div>

        {detailAd ? (
          <DetailPromotionZone placement="vehicle_detail" ad={detailAd} />
        ) : null}
        {!detailAd ? (
          <DetailRecentlyViewed excludeId={vehicle.id} />
        ) : null}

        {similar.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-navy">Similar vehicles</h2>
            <ul className={`mt-3 ${BROWSE_GRID_CLASS}`}>
              {similar.map((s) => (
                <li key={s.id}>
                  <VehicleCard vehicle={s} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

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
