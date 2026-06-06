import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyById } from "@/lib/properties";
import {
  formatPrice,
  listingTypeLabel,
  propertyTypeLabel,
  isVerifiedAgent,
} from "@/lib/utils";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import { ReportListingForm } from "@/components/property/report-form";
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
import { VerifiedBadge } from "@/components/ui/badge";
import { ListingFreshness } from "@/components/property/listing-freshness";
import { ConversionStrip } from "@/components/conversion/conversion-strip";
import { BedDouble, Bath, MapPin, Navigation } from "lucide-react";
import { PropertyViewTracker } from "./view-tracker";
import { PropertyBreadcrumbs } from "@/components/property/property-breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { optimizeListingImageUrl } from "@/lib/image-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Home not found" };

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );
  const title = `${property.title} · ${price}`;
  const description =
    `${propertyTypeLabel(property.property_type)} in ${property.area}, ${property.city}. ${price}. Contact agent on WhatsApp — ${SITE_NAME}.`;
  const image = property.media_urls[0]?.startsWith("http")
    ? optimizeListingImageUrl(property.media_urls[0], 1200)
    : `${SITE_URL}/placeholder-property.svg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (
    !property ||
    property.status !== "approved" ||
    new Date(property.expires_at) <= new Date()
  ) {
    notFound();
  }

  const agent = property.agent;
  const verified =
    property.is_verified_listing ||
    (agent ? isVerifiedAgent(agent) : false);
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

  return (
    <div className="safe-bottom-detail lg:pb-0">
      <ListingStructuredData property={property} />
      <PropertyViewTracker propertyId={property.id} property={property} />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10 lg:pt-8">
        <div>
          <div className="px-4 lg:px-0">
            <PropertyBreadcrumbs
              city={property.city}
              area={property.area}
              title={property.title}
            />
          </div>
          <ListingGallery
            images={images}
            title={property.title}
            featured={property.is_featured}
            verified={!!verified}
            shareUrl={`${SITE_URL}/properties/${property.id}`}
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

          <div className="space-y-5 px-4 pt-5 lg:space-y-6 lg:px-0 lg:pt-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark lg:text-xs">
                {listingTypeLabel(property.listing_type)}
              </p>
              <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-navy tabular-nums lg:text-4xl">
                {price}
              </p>
              {verified && (
                <div className="mt-3">
                  <VerifiedBadge />
                </div>
              )}
              <ListingFreshness
                updatedAt={property.updated_at}
                createdAt={property.created_at}
                viewsCount={property.views_count}
                className="mt-2 block"
              />
              <h1 className="mt-3 text-lg font-semibold leading-snug text-foreground lg:text-2xl">
                {property.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted lg:text-base">
                <MapPin className="h-4 w-4 text-gold" />
                {property.area}, {property.city}
              </p>
              {property.landmark && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <Navigation className="h-3.5 w-3.5 text-gold" />
                  Near {property.landmark}
                </p>
              )}
            </div>

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
                  verified={!!verified}
                />
              </section>
            )}

            <section className="lg:hidden">
              <SafetyNotice compact />
            </section>

            <ReportRentedButton propertyId={property.id} />
            <ReportListingForm propertyId={property.id} />

            <Link
              href="/search"
              className="block py-4 text-center text-sm font-semibold text-gold-dark lg:text-left"
            >
              ← Browse more homes
            </Link>

            <AdSlot placement="property_detail" className="!px-0" />

            <RelatedListings property={property} />
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
              verified={!!verified}
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
            agentId={agent.id}
            phone={agent.phone}
            whatsapp={agent.whatsapp}
          />
        </div>
      )}
    </div>
  );
}
