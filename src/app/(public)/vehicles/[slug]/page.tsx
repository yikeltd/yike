import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  getVehicleByIdOrSlug,
  queryPublicVehicles,
} from "@/lib/marketplace/listings";
import { MarketplaceViewTracker } from "@/components/marketplace/view-tracker";
import { VehicleDetailExperience } from "@/components/marketplace/vehicle-detail-experience";
import { OwnerListingStatusBanner } from "@/components/agent/owner-listing-status-banner";
import { ListingUnavailable } from "@/components/property/listing-unavailable";
import { isAdmin, getSession, getProfile } from "@/lib/auth";
import {
  canPreviewOwnerListing,
  isListingPubliclyActive,
} from "@/lib/listing-lifecycle";

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
  const robots = !isListingPubliclyActive(v)
    ? { index: false, follow: true }
    : { index: true, follow: true };
  return {
    title: `${v.title} | Yike Vehicles`,
    description: v.description?.slice(0, 160) || undefined,
    robots,
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  if (!isLaunchFeatureVisible("vehicle_marketplace")) notFound();
  const { slug } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();

  const vehicle = await getVehicleByIdOrSlug(supabase, slug);
  if (!vehicle) notFound();

  const viewer = await getSession();
  const viewerProfile = viewer ? await getProfile(viewer.id) : null;
  const viewerCtx = viewer
    ? {
        userId: viewer.id,
        isAdmin: viewerProfile ? isAdmin(viewerProfile.role) : false,
      }
    : null;
  const isOwner = viewer?.id === vehicle.agent_id;
  const isPubliclyVisible = isListingPubliclyActive(vehicle);
  const previewMode =
    !isPubliclyVisible && canPreviewOwnerListing(vehicle, viewerCtx);

  if (!isPubliclyVisible && !previewMode) {
    return (
      <ListingUnavailable
        property={vehicle}
        reason={
          new Date(vehicle.expires_at) <= new Date() ? "expired" : "unpublished"
        }
      />
    );
  }

  const similarRaw = isPubliclyVisible
    ? await queryPublicVehicles(supabase, {
        auto_category: vehicle.auto_category ?? undefined,
        make: vehicle.make ?? undefined,
        limit: 8,
      })
    : [];

  const similar = similarRaw.filter((x) => x.id !== vehicle.id).slice(0, 4);
  const priceLabel = formatNaira(Number(vehicle.price));

  const ownerBanner =
    isOwner ? (
      <OwnerListingStatusBanner property={vehicle} className="mx-3 lg:mx-0" />
    ) : previewMode ? (
      <div className="mx-3 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 lg:mx-0">
        <p className="text-sm font-semibold text-navy">Staff preview</p>
        <p className="mt-0.5 text-xs text-muted">
          This vehicle is not public. You can view it as admin.
        </p>
      </div>
    ) : null;

  return (
    <main className="pb-8">
      {isPubliclyVisible ? (
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
      ) : null}

      <VehicleDetailExperience
        vehicle={vehicle}
        similarVehicles={similar}
        ownerBanner={ownerBanner}
      />
    </main>
  );
}
