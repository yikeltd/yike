import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { permanentRedirect } from "next/navigation";
import { resolvePropertyRoute } from "@/lib/properties";
import { getSession, getProfile, isAdmin } from "@/lib/auth";
import {
  canPreviewOwnerListing,
  isListingPubliclyActive,
  isListingUnderReview,
} from "@/lib/listing-lifecycle";
import { OwnerListingStatusBanner } from "@/components/agent/owner-listing-status-banner";
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
import { listingGalleryImages } from "@/lib/listing-gallery-images";
import { AgentTrustCard } from "@/components/property/agent-trust-card";
import { ContactButtons } from "@/components/property/contact-buttons";
import { ReportRentedButton } from "@/components/property/report-rented-button";
import { ListingGallery } from "@/components/property/listing-gallery";
import { StickyContactBar } from "@/components/property/sticky-contact-bar";
import { PropertyVideo } from "@/components/property/property-video";
import { RelatedListings } from "@/components/property/related-listings";
import { DetailPromotionZone } from "@/components/ads/detail-promotion-zone";
import { DetailRecentlyViewed } from "@/components/marketplace/detail-recently-viewed";
import { RentTransparencyCard } from "@/components/property/rent-transparency-card";
import { AmenityChips } from "@/components/property/amenity-chips";
import { ListingStructuredData } from "@/components/seo/listing-structured-data";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { ListingFreshness } from "@/components/property/listing-freshness";
import { PropertyPhysicallyVerifiedCard } from "@/components/property/property-physically-verified";
import { MapPin, Navigation, Home, Layers } from "lucide-react";
import { PropertyViewTracker } from "./view-tracker";
import { PropertyBreadcrumbs } from "@/components/property/property-breadcrumbs";
import { PropertyBackButton } from "@/components/property/property-back-button";
import { ListingUnavailable } from "@/components/property/listing-unavailable";
import { SITE_NAME } from "@/lib/constants";
import { AdminPromoSlot } from "@/components/promo/admin-promo-slot";
import { ListingInsightsSection } from "@/components/property/listing-insights-section";
import { ListingValueDriversSection } from "@/components/property/listing-value-drivers-section";
import { getActiveAd } from "@/lib/ads";
import { resolveListingBadges } from "@/lib/design/listing-badges";
import { ListingBadgeRow } from "@/components/ui/listing-badge-row";
import {
  TrustModule,
  CollapsibleSpecs,
  type TrustBadgeKind,
} from "@/components/marketplace/experience";
import { MarketplaceSafetyTipsLink } from "@/components/marketplace/safety-notice";

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
  const unavailable = !isListingPubliclyActive(property);

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

  const viewer = await getSession();
  const viewerProfile = viewer ? await getProfile(viewer.id) : null;
  const viewerCtx = viewer
    ? {
        userId: viewer.id,
        isAdmin: viewerProfile ? isAdmin(viewerProfile.role) : false,
      }
    : null;
  const isOwner = viewer?.id === property.agent_id;
  const isPubliclyVisible = isListingPubliclyActive(property);
  const previewMode =
    !isPubliclyVisible && canPreviewOwnerListing(property, viewerCtx);

  if (!isPubliclyVisible && !previewMode) {
    return (
      <ListingUnavailable
        property={property}
        reason={
          new Date(property.expires_at) <= new Date() ? "expired" : "unpublished"
        }
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
  const images = listingGalleryImages(property);

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  const amenities = property.extras?.amenities ?? [];
  const shareUrl = propertyAbsoluteUrl(property);
  const detailAd = await getActiveAd("property_detail");
  const allBadges = resolveListingBadges(property, {
    agentVerified: !!verified,
    featuredActive,
  });
  const extraBadges = allBadges.filter(
    (b) =>
      b !== "verified" &&
      b !== "yike_verified" &&
      b !== "featured"
  );
  const trustKinds: TrustBadgeKind[] = [];
  if (property.is_verified_listing || property.yike_verified) {
    trustKinds.push("verified_listing");
  }
  if (agent && isVerifiedAgent(agent)) {
    trustKinds.push("verified_seller");
  }
  trustKinds.push("media_protected");

  return (
    <div className="detail-band-ivory">
      {isPubliclyVisible ? <ListingStructuredData property={property} /> : null}
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

          {previewMode && isOwner ? (
            <OwnerListingStatusBanner
              property={property}
              className="mx-4 mt-3 lg:mx-0"
            />
          ) : previewMode ? (
            <div className="mx-4 mt-3 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 lg:mx-0">
              <p className="text-sm font-semibold text-navy">Staff preview</p>
              <p className="mt-0.5 text-xs text-muted">
                This listing is not public. You can view it as admin.
              </p>
            </div>
          ) : isOwner && isPubliclyVisible ? (
            <OwnerListingStatusBanner
              property={property}
              className="mx-4 mt-3 lg:mx-0"
            />
          ) : null}
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
            extraBadges={extraBadges}
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

          <div className="detail-band-white space-y-5 px-4 pt-5 lg:space-y-7 lg:rounded-t-[1.5rem] lg:px-0 lg:pt-8">
            <div className="rounded-[1.5rem] border border-navy/[0.07] bg-white/95 p-5 shadow-[0_20px_50px_-32px_rgba(3,27,78,0.45)] backdrop-blur-sm sm:p-6 lg:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy/45">
                {listingTypeLabel(property.listing_type)}
              </p>
              <p className="mt-4 text-[2.35rem] font-bold leading-none tracking-tight text-navy tabular-nums lg:text-[2.75rem]">
                {price}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="text-[1.2rem] font-bold leading-snug tracking-tight text-navy lg:text-[1.5rem]">
                  {property.title}
                </h1>
                {previewMode && isListingUnderReview(property) ? (
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold-dark">
                    Under review
                  </span>
                ) : null}
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-navy/50">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
                {property.area}, {property.city}
              </p>
              {property.landmark ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-navy/40">
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-gold/80" />
                  Near {property.landmark}
                </p>
              ) : null}
              <TrustModule kinds={trustKinds} className="mt-4" />
              {(property.bedrooms > 0 || property.bathrooms > 0) && (
                <p className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-navy/65">
                  {property.bedrooms > 0 ? (
                    <span className="rounded-full border border-navy/8 bg-navy/[0.03] px-2.5 py-1">
                      {property.bedrooms} bed
                    </span>
                  ) : null}
                  {property.bathrooms > 0 ? (
                    <span className="rounded-full border border-navy/8 bg-navy/[0.03] px-2.5 py-1">
                      {property.bathrooms} bath
                    </span>
                  ) : null}
                </p>
              )}
              {property.physically_verified_at ? (
                <div className="mt-3">
                  <PropertyPhysicallyVerifiedCard verifiedAt={property.physically_verified_at} />
                </div>
              ) : null}
              {agent ? (
                <div id="listing-primary-cta" className="mt-5 border-t border-navy/[0.06] pt-5 lg:hidden">
                  <ContactButtons
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
              ) : null}
              <ListingFreshness
                updatedAt={property.updated_at}
                createdAt={property.created_at}
                lastRefreshedAt={property.last_refreshed_at}
                viewsCount={property.views_count}
                verified={!!verified}
                contactClicks={property.contact_clicks}
                className="mt-3 block text-navy/40"
              />
              <ListingBadgeRow
                badges={extraBadges.filter((b) => b !== "new")}
                className="mt-2 flex flex-wrap items-center gap-1.5 lg:hidden"
              />
            </div>

            <CollapsibleSpecs
              title="Full details"
              subtitle="Beds, type, listing — expand when you need them"
              items={[
                property.property_type
                  ? {
                      icon: Home,
                      label: "Type",
                      value: propertyTypeLabel(property.property_type),
                    }
                  : null,
                {
                  icon: Layers,
                  label: "Listing",
                  value: listingTypeLabel(property.listing_type),
                },
              ].filter(Boolean) as Array<{
                icon: typeof Home;
                label: string;
                value: string;
              }>}
            />

            {amenities.length > 0 ? (
              <details className="group rounded-[1.5rem] border border-navy/10 bg-white open:pb-4">
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-navy [&::-webkit-details-marker]:hidden">
                  Amenities ({amenities.length})
                </summary>
                <div className="px-5">
                  <AmenityChips amenities={amenities} max={24} size="md" />
                </div>
              </details>
            ) : null}

            <Suspense fallback={<DetailSectionFallback />}>
              <ListingInsightsSection property={property} agent={agent} />
            </Suspense>

            <Suspense fallback={null}>
              <ListingValueDriversSection listingId={property.id} />
            </Suspense>

            <RentTransparencyCard property={property} />

            {property.description && (
              <section className="rounded-[1.25rem] border border-[color:var(--border-premium)] bg-white p-4 shadow-card lg:p-6">
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
              className="block py-2 text-center text-sm font-semibold text-gold-dark lg:text-left"
            >
              ← Browse more homes
            </Link>

            {detailAd ? (
              <DetailPromotionZone placement="property_detail" ad={detailAd} />
            ) : (
              <DetailRecentlyViewed excludeId={property.id} />
            )}

            <Suspense fallback={null}>
              <RelatedListings property={property} />
            </Suspense>

            <p className="pt-1 text-center text-xs text-navy/45 lg:hidden">
              <MarketplaceSafetyTipsLink />
            </p>
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
            <p className="mt-3 text-xs text-navy/45">
              <MarketplaceSafetyTipsLink />
            </p>
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
