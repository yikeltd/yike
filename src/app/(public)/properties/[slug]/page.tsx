import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { resolvePropertyRoute, getRelatedProperties } from "@/lib/properties";
import { getSession, getProfile, isAdmin } from "@/lib/auth";
import {
  canPreviewOwnerListing,
  isListingPubliclyActive,
} from "@/lib/listing-lifecycle";
import { OwnerListingStatusBanner } from "@/components/agent/owner-listing-status-banner";
import { isVerifiedAgent } from "@/lib/utils";
import { propertyAbsoluteUrl } from "@/lib/property-url";
import { listingShareImageUrl } from "@/lib/share-images";
import { PropertyDetailExperience } from "@/components/property/property-detail-experience";
import { ListingStructuredData } from "@/components/seo/listing-structured-data";
import { PropertyViewTracker } from "./view-tracker";
import { ListingUnavailable } from "@/components/property/listing-unavailable";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { property } = await resolvePropertyRoute(slug);
  if (!property) {
    return { title: "Property Not Found | Yike" };
  }

  const verified =
    property.is_verified_listing ||
    (property.agent ? isVerifiedAgent(property.agent) : false);

  const priceLabel = Number(property.price).toLocaleString();
  const canonicalUrl = propertyAbsoluteUrl(property);

  return {
    title: `${property.title} — ₦${priceLabel} | ${SITE_NAME}`,
    description: property.description
      ? property.description.slice(0, 160)
      : `${property.title} in ${property.area}, ${property.city}. Contact seller on Yike.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: property.title,
      description: `₦${priceLabel} • ${property.area}, ${property.city}`,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: listingShareImageUrl(property.media_urls || []),
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
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

  const ownerBanner =
    previewMode && isOwner ? (
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
    ) : null;

  const similarListings = await getRelatedProperties(property, 6);

  return (
    <div className="detail-band-ivory">
      {isPubliclyVisible ? <ListingStructuredData property={property} /> : null}
      <PropertyViewTracker propertyId={property.id} property={property} slug={slug} />
      <PropertyDetailExperience
        property={property}
        similarListings={similarListings}
        ownerBanner={ownerBanner}
      />
    </div>
  );
}
