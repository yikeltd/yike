import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { resolvePropertyRoute } from "@/lib/properties";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { getAgentRecentLeadsCount } from "@/lib/leads/queries";
import {
  formatPrice,
  listingTypeLabel,
  propertyTypeLabel,
  isVerifiedAgent,
} from "@/lib/utils";
import { propertyAbsoluteUrl } from "@/lib/property-url";
import { listingShareImageUrl } from "@/lib/share-images";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import { ReportRentedButton } from "@/components/property/report-rented-button";
import { ListingGallery } from "@/components/property/listing-gallery";
import { StickyContactBar } from "@/components/property/sticky-contact-bar";
import { PropertyVideo } from "@/components/property/property-video";
import { SafetyNotice } from "@/components/property/safety-notice";
import { RelatedListings } from "@/components/property/related-listings";
import { AdSlot } from "@/components/ads/ad-slot";
import { RentTransparencyCard } from "@/components/property/rent-transparency-card";
import { AmenityChips } from "@/components/property/amenity-chips";
import { ListingStructuredData } from "@/components/seo/listing-structured-data";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { ListingFreshness } from "@/components/property/listing-freshness";
import { BedDouble, Bath, MapPin, Navigation } from "lucide-react";
import { PropertyViewTracker } from "./view-tracker";
import { PropertyBreadcrumbs } from "@/components/property/property-breadcrumbs";
import { PropertyBackButton } from "@/components/property/property-back-button";
import { ListingUnavailable } from "@/components/property/listing-unavailable";
import { SITE_NAME } from "@/lib/constants";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";
import { ListingInsightsSection } from "@/components/property/listing-insights-section";
import { ListingValueDriversSection } from "@/components/property/listing-value-drivers-section";

const ReportListingForm = dynamic(
  () =>
    import("@/components/property/report-form").then((m) => ({
      default: m.ReportListingForm,
    })),
  { loading: () => null }
);


function DetailSectionFallback() {
  return <div className="skeleton h-24 w-full rounded-2xl" aria-hidden />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { property } = await resolvePropertyRoute(slug);
  if (!property) {
    return {
      title: "Home not found",
      robots: { index: false, follow: false },
    };
  }

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const title = property.seo_title ?? `${property.title} · ${price}`;
  const description =
    property.seo_description ??
    `${propertyTypeLabel(property.property_type)} in ${property.area}, ${property.city}. ${price}. Contact agent on WhatsApp — ${SITE_NAME}.`;
  const image = listingShareImageUrl(property.media_urls);
  const canonical = propertyAbsoluteUrl(property);
  const unavailable =
    property.status !== "approved" || new Date(property.expires_at) <= new Date();

  return {
    title,
    description,
    alternates: { canonical },
    robots: unavailable
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: property.title }],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { property, redirectTo } = await resolvePropertyRoute(slug);

  if (redirectTo) {
    permanentRedirect(redirectTo);
  }

  if (!property) {
    return <ListingUnavailable property={null} reason="missing" />;
  }

  const isExpired = new Date(property.expires_at) <= new Date();
  if (property.status !== "approved" || isExpired) {
    return (
      <ListingUnavailable
        property={property}
        reason={isExpired ? "expired" : "unpublished"}
      />
    );
  }

  const agent = property.agent;
  let recentLeads = 0;
  if (agent && isAdminClientConfigured()) {
    try {
      const admin = createAdminClient();
      recentLeads = await getAgentRecentLeadsCount(admin, agent.id);
    } catch (error) {
      console.warn("[property/detail] recent leads unavailable:", (error as Error).message);
    }
  }
  const verified =
    property.is_verified_listing ||
    (agent ? isVerifiedAgent(agent) : false);
  const featuredActive = isFeaturedActive(property);
  const images =
    property.media_urls.length > 0
      ? property.media_urls
      : ["/placeholder-property.svg"];

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  const amenities = property.extras?.amenities ?? [];
  const shareUrl = propertyAbsoluteUrl(property);

  return (
    <div className="safe-bottom-detail lg:pb-0">
      <ListingStructuredData property={property} />
      <PropertyViewTracker propertyId={property.id} property={property} slug={slug} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10 lg:pt-8">
        <div>
          <div className="px-4 pt-3 lg:px-0 lg:pt-0">
            <PropertyBackButton />
            <PropertyBreadcrumbs
              city={property.city}
              area={property.area}
              title={property.title}
            />
          </div>
          <ListingGallery
            images={images}
            title={property.title}
            featured={featuredActive}
            yikeVerified={!!property.yike_verified}
            verified={!!verified}
            shareUrl={shareUrl}
            imageSeo={property}
            listingId={property.id}
            city={property.city}
            listingType={property.listing_type}
            propertyType={property.property_type}
          />

          {property.video_url && (
            <div className="mt-4 px-3 lg:mt-6 lg:px-0">
              <PropertyVideo
                src={property.video_url}
                poster={images[0]}
                title={property.title}
              />
            </div>
          )}

          <div className="space-y-4 px-4 pt-4 lg:space-y-6 lg:px-0 lg:pt-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark lg:text-xs">
                {listingTypeLabel(property.listing_type)}
              </p>
              <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-tight text-navy tabular-nums lg:text-4xl">
                {price}
              </p>
              <ListingFreshness
                updatedAt={property.updated_at}
                createdAt={property.created_at}
                lastRefreshedAt={property.last_refreshed_at}
                viewsCount={property.views_count}
                verified={!!verified}
                contactClicks={property.contact_clicks}
                className="mt-2 block"
              />
              <h1 className="mt-2.5 text-lg font-semibold leading-snug text-foreground lg:text-2xl">
                {property.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-muted lg:text-base">
                <MapPin className="h-4 w-4 shrink-0 text-gold" />
                {property.area}, {property.city}
              </p>
              {property.landmark && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-gold" />
                  Near {property.landmark}
                </p>
              )}
            </div>

            <Suspense fallback={<DetailSectionFallback />}>
              <ListingInsightsSection property={property} agent={agent} />
            </Suspense>

            <Suspense fallback={null}>
              <ListingValueDriversSection listingId={property.id} />
            </Suspense>

            {amenities.length > 0 && (
              <AmenityChips amenities={amenities} max={8} size="md" />
            )}

            <RentTransparencyCard property={property} />

            <div className="flex flex-wrap gap-2">
              {property.bedrooms > 0 && (
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground lg:text-sm">
                  <BedDouble className="mr-1 inline h-3.5 w-3.5" />
                  {property.bedrooms} beds
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground lg:text-sm">
                  <Bath className="mr-1 inline h-3.5 w-3.5" />
                  {property.bathrooms} baths
                </span>
              )}
              {property.property_type && (
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground lg:text-sm">
                  {propertyTypeLabel(property.property_type)}
                </span>
              )}
            </div>

            {property.description && (
              <section className="rounded-2xl bg-white p-4 shadow-float lg:p-6">
                <h2 className="text-sm font-bold text-navy lg:text-base">
                  About this home
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted lg:text-base">
                  {property.description}
                </p>
              </section>
            )}

            <Suspense fallback={null}>
              <AdminPromoSlot placement="listing_page" variant="card" />
            </Suspense>

            {agent && (
              <section className="lg:hidden">
                <h2 className="mb-2 text-sm font-bold text-navy">Your agent</h2>
                <AgentTrustCard
                  agent={agent}
                  propertyId={property.id}
                  title={property.title}
                  area={property.area}
                  city={property.city}
                  listingType={property.listing_type}
                  propertyType={property.property_type}
                  bedrooms={property.bedrooms}
                  price={Number(property.price)}
                  paymentPeriod={property.payment_period}
                  verified={!!verified}
                  contactClicks={property.contact_clicks}
                  recentLeads={recentLeads}
                  hideContact
                />
              </section>
            )}

            <ReportRentedButton propertyId={property.id} />
            <ReportListingForm propertyId={property.id} />

            <Link
              href="/search"
              className="block py-4 text-center text-sm font-semibold text-gold-dark lg:text-left"
            >
              ← Browse more homes
            </Link>

            <Suspense fallback={null}>
              <AdSlot placement="property_detail" className="!px-0" />
            </Suspense>

            <Suspense fallback={<DetailSectionFallback />}>
              <RelatedListings property={property} />
            </Suspense>
          </div>
        </div>

        {agent && (
          <aside className="hidden space-y-5 lg:block">
            <AgentTrustCard
              agent={agent}
              propertyId={property.id}
              title={property.title}
              area={property.area}
              city={property.city}
              listingType={property.listing_type}
              propertyType={property.property_type}
              bedrooms={property.bedrooms}
              price={Number(property.price)}
              paymentPeriod={property.payment_period}
              verified={!!verified}
              contactClicks={property.contact_clicks}
              recentLeads={recentLeads}
              sticky
            />
            <SafetyNotice />
          </aside>
        )}
      </div>

      {agent && (
        <div className="lg:hidden">
          <StickyContactBar
            propertyId={property.id}
            title={property.title}
            area={property.area}
            city={property.city}
            listingType={property.listing_type}
            propertyType={property.property_type}
            bedrooms={property.bedrooms}
            agentId={agent.id}
            agentName={agent.full_name ?? "Agent"}
            price={Number(property.price)}
            paymentPeriod={property.payment_period}
            phone={agent.phone}
            whatsapp={agent.whatsapp}
          />
        </div>
      )}
    </div>
  );
}
