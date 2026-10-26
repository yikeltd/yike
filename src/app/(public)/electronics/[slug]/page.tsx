import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getElectronicsByIdOrSlug,
  queryPublicElectronics,
} from "@/lib/marketplace/listings";
import { getSampleListingBySlugOrId, sampleBrowseFallback } from "@/lib/sample-listings/query-fixtures";
import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";
import { MarketplaceViewTracker } from "@/components/marketplace/view-tracker";
import { ElectronicsDetailExperience } from "@/components/marketplace/electronics-detail-experience";
import { OwnerListingStatusBanner } from "@/components/agent/owner-listing-status-banner";
import { ListingUnavailable } from "@/components/property/listing-unavailable";
import { isAdmin, getSession, getProfile } from "@/lib/auth";
import {
  canPreviewOwnerListing,
  isListingPubliclyActive,
} from "@/lib/listing-lifecycle";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isLaunchFeatureVisible("electronics_marketplace")) {
    return { title: "Electronics | Yike" };
  }
  const supabase = await createClient();
  let listing = supabase ? await getElectronicsByIdOrSlug(supabase, slug) : null;
  if (!listing) listing = getSampleListingBySlugOrId(slug, "ELECTRONICS");
  if (!listing) return { title: "Electronics | Yike" };
  const robots = !isListingPubliclyActive(listing)
    ? { index: false, follow: true }
    : { index: true, follow: true };
  return {
    title: `${listing.title} | Yike Electronics`,
    description: listing.description?.slice(0, 160) || undefined,
    robots,
  };
}

export default async function ElectronicsDetailPage({
  params,
  searchParams,
}: Props & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isLaunchFeatureVisible("electronics_marketplace")) notFound();
  const { slug } = await params;
  const query = await searchParams;
  const browseReturnParam =
    typeof query.browseReturn === "string" ? query.browseReturn : null;
  const supabase = await createClient();

  let listing: Awaited<ReturnType<typeof getElectronicsByIdOrSlug>> | ReturnType<
    typeof getSampleListingBySlugOrId
  > = null;
  if (isSampleListingFixtureEnabled() && slug.startsWith("sample-")) {
    listing = getSampleListingBySlugOrId(slug, "ELECTRONICS");
  }
  if (!listing && supabase) {
    listing = await getElectronicsByIdOrSlug(supabase, slug);
  }
  if (!listing) {
    listing = getSampleListingBySlugOrId(slug, "ELECTRONICS");
  }
  if (!listing) notFound();
  const isSampleFixture = listing.id.startsWith("s3000001-");

  const viewer = await getSession();
  const viewerProfile = viewer ? await getProfile(viewer.id) : null;
  const viewerCtx = viewer
    ? {
        userId: viewer.id,
        isAdmin: viewerProfile ? isAdmin(viewerProfile.role) : false,
      }
    : null;
  const isPubliclyVisible = isListingPubliclyActive(listing);
  const previewMode =
    !isPubliclyVisible && canPreviewOwnerListing(listing, viewerCtx);

  if (!isPubliclyVisible && !previewMode) {
    return (
      <ListingUnavailable
        property={listing}
        reason={
          listing.expires_at && new Date(listing.expires_at) <= new Date()
            ? "expired"
            : "unpublished"
        }
      />
    );
  }

  const similarRaw =
    isPubliclyVisible && supabase
      ? await queryPublicElectronics(supabase, {
          auto_category: listing.auto_category ?? undefined,
          limit: 8,
        })
      : [];
  let similar = similarRaw.filter((x) => x.id !== listing.id).slice(0, 4);
  if (similar.length === 0 && isSampleFixture) {
    similar = sampleBrowseFallback([], "ELECTRONICS", {
      auto_category: listing.auto_category ?? undefined,
    })
      .filter((x) => x.id !== listing.id)
      .slice(0, 4);
  }

  const priceLabel = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(listing.price));

  return (
    <main className="pb-8">
      {isPubliclyVisible ? (
        <MarketplaceViewTracker
          id={listing.id}
          title={listing.title}
          image={listing.media_urls?.[0] ?? ""}
          city={listing.city}
          area={listing.area || listing.city}
          priceLabel={priceLabel}
          assetType="ELECTRONICS"
          slug={listing.slug}
        />
      ) : null}
      <ElectronicsDetailExperience
        listing={listing}
        similar={similar}
        browseReturnParam={browseReturnParam}
        ownerBanner={
          previewMode ? (
            <OwnerListingStatusBanner property={listing} className="mx-3 mt-3" />
          ) : null
        }
      />
    </main>
  );
}
